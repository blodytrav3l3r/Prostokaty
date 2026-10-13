import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevels,validateLevelData,getLevelClues} from '../src/levels.js';
import {GameEngine} from '../src/engine.js';
import {countSolutions} from '../src/solver.js';
import {load,save} from '../src/storage.js';

function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

test('zawartość ma dokładnie 100 ręcznie opisanych poziomów',()=>{
 const levels=buildLevels();
 assert.equal(levels.length,100);
 assert.equal(new Set(levels.map(l=>l.title)).size,100);
});

test('10 rodzin zagadek jest reprezentowanych po 10 poziomów',()=>{
 const levels=buildLevels();
 const counts=levels.reduce((map,l)=>map.set(l.family,(map.get(l.family)||0)+1),new Map());
 assert.equal(counts.size,10);
 assert.deepEqual([...counts.values()].sort((a,b)=>a-b),Array(10).fill(10));
});

test('każdy poziom ma poprawną planszę, reguły, cele i bezkolizyjne rozwiązanie',()=>{
 for(const l of buildLevels()){
  assert.equal(validateLevelData(l),true);
  assert.equal(l.rules.length,2);
  for(const p of l.targets) assert.ok(p.x>=0&&p.y>=0&&p.x+p.w<=l.width&&p.y+p.h<=l.height);
  for(let i=0;i<l.targets.length;i++)for(let j=i+1;j<l.targets.length;j++)assert.equal(overlap(l.targets[i],l.targets[j]),false,`kolizja celu ${l.id}`);
 }
});

test('rozwiązanie każdego poziomu spełnia jego reguły',()=>{
 for(const l of buildLevels()){
  const e=new GameEngine(l);
  e.pieces=l.targets.map(p=>({...p}));
  assert.equal(e.solved(),true,`poziom ${l.id}: ${l.title}`);
 }
});

test('poziomy z jednym rozwiązaniem używają sum wierszy, kolumn i kolejności',()=>{
 for(const l of buildLevels().filter(x=>x.family==='Jedno rozwiązanie')){
  const e=new GameEngine(l);
  assert.equal(l.constraints.exact,undefined);
  assert.ok(Array.isArray(l.constraints.rowArea));
  assert.ok(Array.isArray(l.constraints.columnArea));
  assert.deepEqual(l.constraints.leftOf,[[1,2],[2,3],[3,4]]);
  e.pieces=l.targets.map(p=>({...p}));
  assert.equal(e.solved(),true);
  assert.equal(countSolutions(l,2),1,`poziom ${l.id} powinien mieć dokładnie jedno rozwiązanie`);
 }
});

test('silnik blokuje nakładanie i wyjście poza planszę',()=>{
 const l=buildLevels()[0],e=new GameEngine(l),p=e.pieces[0];
 assert.equal(e.valid(p,-1,p.y),false);
 assert.equal(e.valid(p,p.x,p.y),true);
 const other=e.pieces[1];
 assert.equal(e.valid(p,other.x,other.y),false);
});

test('cofanie przywraca stan',()=>{
 const l=buildLevels()[0],e=new GameEngine(l),p=e.pieces[0],x=p.x,y=p.y;
 let dest=null;
 for(let yy=0;yy<8&&!dest;yy++)for(let xx=0;xx<8;xx++)if((xx!==p.x||yy!==p.y)&&e.valid(p,xx,yy)){dest=[xx,yy];break}
 assert.ok(dest);
 assert.equal(e.move(p.id,...dest),true);
 assert.equal(e.undo(),true);
 assert.equal(p.x,x);assert.equal(p.y,y);
});


test('styk bokiem uwzględnia rzeczywiste wymiary prostokątów',()=>{
 const level={width:6,height:6,pieces:[
  {id:1,x:0,y:0,w:2,h:2,color:'red'},
  {id:2,x:2,y:0,w:1,h:2,color:'blue'},
  {id:3,x:3,y:3,w:1,h:1,color:'green'},
  {id:4,x:4,y:4,w:1,h:1,color:'yellow'}
 ],targets:[],constraints:{adjacent:[[1,2]]}};
 const e=new GameEngine(level);
 assert.equal(e.solved(),true);
 e.pieces[1].x=3;
 assert.equal(e.solved(),false);
});

test('silnik odrzuca niecałkowite współrzędne i brakujące elementy reguł',()=>{
 const level={width:4,height:4,pieces:[
  {id:1,x:0,y:0,w:1,h:1,color:'red'},
  {id:2,x:2,y:0,w:1,h:1,color:'blue'}
 ],targets:[],constraints:{adjacent:[[1,99]]}};
 const e=new GameEngine(level);
 assert.equal(e.valid(e.pieces[0],1.5,1),false);
 assert.equal(e.solved(),false);
});

test('ruch na to samo pole nie zwiększa licznika ruchów',()=>{
 const e=new GameEngine(buildLevels()[0]);
 const p=e.pieces[0];
 assert.equal(e.move(p.id,p.x,p.y),false);
 assert.equal(e.moves,0);
});


test('każdy poziom pokazuje konkretne wskazówki odpowiadające ograniczeniom',()=>{
 for(const level of buildLevels()){
  const clues=getLevelClues(level);
  assert.ok(clues.length>0,`brak wskazówek dla poziomu ${level.id}`);
  const c=level.constraints;
  if(c.rowArea) assert.ok(clues.some(text=>text.startsWith('Suma pól w wierszach')), `brak sum wierszy: ${level.id}`);
  if(c.columnArea) assert.ok(clues.some(text=>text.startsWith('Suma pól w kolumnach')), `brak sum kolumn: ${level.id}`);
  if(c.forbidden) assert.ok(clues.some(text=>text.startsWith('Pola zakazane')), `brak pól zakazanych: ${level.id}`);
  if(c.edgeCount!==undefined) assert.ok(clues.some(text=>text.startsWith('Dokładna liczba prostokątów')), `brak liczby krawędzi: ${level.id}`);
  if(c.exact) assert.ok(clues.some(text=>text.startsWith('Współrzędne celu')), `brak współrzędnych celu: ${level.id}`);
 }
});


test('solver formalnie potwierdza dokładnie jeden układ w poziomach logicznych',()=>{
 for(const level of buildLevels().filter(item=>item.family==='Jedno rozwiązanie')){
  assert.equal(countSolutions(level,2),1,`poziom ${level.id} powinien mieć dokładnie jeden układ docelowy`);
 }
});

test('solver odróżnia co najmniej dwa rozwiązania od braku rozwiązania',()=>{
 const many={width:2,height:2,pieces:[
  {id:1,x:0,y:0,w:1,h:1,color:'red'},
  {id:2,x:1,y:1,w:1,h:1,color:'blue'}
 ],targets:[],constraints:{}};
 assert.equal(countSolutions(many,2),2);
 const impossible={...many,constraints:{adjacent:[[1,99]]}};
 assert.equal(countSolutions(impossible,2),0);
});


test('solver audit: logic-first levels are not mislabeled as unique-solution puzzles',()=>{
 for(const level of buildLevels().filter(item=>item.family!=='Jedno rozwiązanie')){
  assert.equal(countSolutions(level,2),2,`poziom ${level.id} unexpectedly has fewer than two solutions`);
 }
});


function withMockStorage(raw, setItem = () => {}) {
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
  getItem:()=>raw,
  setItem
 }});
 return () => {
  if(previous) Object.defineProperty(globalThis,'localStorage',previous);
  else delete globalThis.localStorage;
 };
}

test('storage repairs malformed progress instead of crashing the game',()=>{
 const restore=withMockStorage(JSON.stringify({
  currentLevel:999,
  completed:{'2':{stars:2,moves:5},'101':{stars:3,moves:1},'1':{stars:9,moves:-1}},
  bestMoves:{'1':4,'101':2,'3':-1},
  totalMoves:-50,
  sound:'yes',
  theme:'unknown'
 }));
 try {
  const state=load();
  assert.equal(state.currentLevel,1);
  assert.deepEqual(state.completed,{'2':{stars:2,moves:5}});
  assert.deepEqual(state.bestMoves,{'1':4});
  assert.equal(state.totalMoves,0);
  assert.equal(state.sound,true);
  assert.equal(state.theme,'dark');
 } finally { restore(); }
});

test('storage handles blocked writes without throwing',()=>{
 const restore=withMockStorage('{}',()=>{throw new Error('quota exceeded')});
 try {
  assert.equal(save({currentLevel:1}),false);
  assert.equal(load().currentLevel,1);
 } finally { restore(); }
});
