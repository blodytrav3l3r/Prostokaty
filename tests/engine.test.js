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
 const counts=Object.groupBy(levels,l=>l.family);
 assert.deepEqual(Object.values(counts).map(v=>v.length).sort((a,b)=>a-b),Array(10).fill(10));
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
 for(let yy=0;yy<8&&!dest;yy++)for(let xx=0;xx<8;xx++)if(e.valid(p,xx,yy)){dest=[xx,yy];break}
 assert.ok(dest);
 assert.equal(e.move(p.id,...dest),true);
 assert.equal(e.undo(),true);
 assert.equal(p.x,x);assert.equal(p.y,y);
});
