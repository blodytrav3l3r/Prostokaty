import test from 'node:test';
import assert from 'node:assert/strict';
import {buildLevels,validateLevelData} from '../src/levels.js';
import {GameEngine} from '../src/engine.js';

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

test('poziomy z jednym rozwiązaniem wymagają dokładnie wskazanego układu',()=>{
 for(const l of buildLevels().filter(x=>x.family==='Jedno rozwiązanie')){
  const e=new GameEngine(l);
  assert.equal(l.constraints.exact,true);
  e.pieces=l.targets.map(p=>({...p}));
  assert.equal(e.solved(),true);
  e.pieces[0].x=(e.pieces[0].x+1)%8;
  assert.equal(e.solved(),false);
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
