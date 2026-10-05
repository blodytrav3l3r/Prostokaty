function adjacent(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function edge(p,L){return p.x===0||p.y===0||p.x+p.w===L.width||p.y+p.h===L.height}
export class GameEngine{
constructor(level){this.level=level;this.pieces=level.pieces.map(p=>({...p}));this.history=[];this.moves=0}
snapshot(){return this.pieces.map(p=>({id:p.id,x:p.x,y:p.y}))}
restore(s){s.forEach(v=>{const p=this.pieces.find(x=>x.id===v.id);if(p){p.x=v.x;p.y=v.y}})}
valid(p,x,y){if(x<0||y<0||x+p.w>this.level.width||y+p.h>this.level.height)return false;const q={...p,x,y};return !this.pieces.some(v=>v.id!==p.id&&overlap(q,v))}
move(id,x,y){const p=this.pieces.find(v=>v.id===id);if(!p||!this.valid(p,x,y))return false;this.history.push(this.snapshot());p.x=x;p.y=y;this.moves++;return true}
undo(){const s=this.history.pop();if(!s)return false;this.restore(s);this.moves=Math.max(0,this.moves-1);return true}
reset(){this.pieces=this.level.pieces.map(p=>({...p}));this.history=[];this.moves=0}
solved(){if(this.pieces.some((p,i)=>this.pieces.some((q,j)=>i!==j&&overlap(p,q))))return false;return this.checkConstraints(this.level.constraints||{})}
checkConstraints(c){const L=this.level,by=id=>this.pieces.find(p=>p.id===id),T=this.level.targets;if(c.exact&&!T.every(t=>{const p=by(t.id);return p&&p.x===t.x&&p.y===t.y}))return false;if(c.adjacent&&!c.adjacent.every(([a,b])=>adjacent(by(a),by(b))))return false;if(c.path){for(let i=0;i<c.path.length-1;i++)if(!adjacent(by(c.path[i]),by(c.path[i+1])))return false}if(c.symmetry==="rot180"){for(const p of this.pieces)if(!this.pieces.some(q=>q.id!==p.id&&q.x===L.width-p.x-p.w&&q.y===L.height-p.y-p.h&&q.w===p.w&&q.h===p.h))return false}if(c.rowArea){const sums=Array(L.height).fill(0);this.pieces.forEach(p=>{for(let y=p.y;y<p.y+p.h;y++)sums[y]+=p.w});if(sums.some((v,i)=>v!==c.rowArea[i]))return false}if(c.colorAdjacentDifferent){for(let i=0;i<this.pieces.length;i++)for(let j=i+1;j<this.pieces.length;j++){const a=this.pieces[i],b=this.pieces[j];if(adjacent(a,b)&&a.color===b.color)return false}}if(c.forbidden){const bad=c.forbidden.map(([x,y])=>({x,y,w:1,h:1}));if(this.pieces.some(p=>bad.some(q=>overlap(p,q))))return false}if(Number.isInteger(c.edgeCount)&&this.pieces.filter(p=>edge(p,L)).length!==c.edgeCount)return false;if(c.leftOf&&!c.leftOf.every(([a,b])=>by(a).x<by(b).x))return false;return true}
hint(){const p=this.pieces.find(v=>{const t=this.level.targets.find(x=>x.id===v.id);return t&&(v.x!==t.x||v.y!==t.y)});return p?this.level.targets.find(t=>t.id===p.id):null}
}