import { VW, VH, MW, MH, WALL } from '../data/constants.js';

export const cam = {x:0, y:0, tx:0, ty:0};

export function camUpdate(px, py) {
  cam.tx = Math.max(0, Math.min(MW-VW, px - VW/2));
  cam.ty = Math.max(0, Math.min(MH-VH, py - VH/2));
  cam.x += (cam.tx - cam.x) * 0.12;
  cam.y += (cam.ty - cam.y) * 0.12;
}

export function wx(x){ return x - cam.x; }
export function wy(y){ return y - cam.y; }
export function inView(x,y,m){ m=m||60; return x>cam.x-m&&x<cam.x+VW+m&&y>cam.y-m&&y<cam.y+VH+m; }

export function circleRect(cx,cy,cr,rx,ry,rw,rh){
  var nx=Math.max(rx,Math.min(rx+rw,cx));
  var ny=Math.max(ry,Math.min(ry+rh,cy));
  return Math.hypot(cx-nx,cy-ny)<cr;
}

export function resolveCircleRect(obj,rx,ry,rw,rh){
  var nx=Math.max(rx,Math.min(rx+rw,obj.x));
  var ny=Math.max(ry,Math.min(ry+rh,obj.y));
  var dx=obj.x-nx,dy=obj.y-ny,d=Math.hypot(dx,dy);
  if(d<obj.r&&d>0){var pen=obj.r-d;obj.x+=dx/d*pen;obj.y+=dy/d*pen;}
}

export function createCollision(G){
  function resolveWalls(obj){
    obj.x=Math.max(WALL+obj.r,Math.min(MW-WALL-obj.r,obj.x));
    obj.y=Math.max(WALL+obj.r,Math.min(MH-WALL-obj.r,obj.y));
    for(var i=0;i<G.walls.length;i++) resolveCircleRect(obj,G.walls[i].x,G.walls[i].y,G.walls[i].w,G.walls[i].h);
  }

  function isBlocked(x,y,r){
    if(x-r<WALL||x+r>MW-WALL||y-r<WALL||y+r>MH-WALL) return true;
    for(var i=0;i<G.walls.length;i++) if(circleRect(x,y,r,G.walls[i].x,G.walls[i].y,G.walls[i].w,G.walls[i].h)) return true;
    return false;
  }

  return { resolveWalls, isBlocked };
}

export function createSpawnParts(G){
  return function spawnParts(x,y,color,n,text){
    for(var i=0;i<n;i++){
      var a=Math.random()*Math.PI*2, s=Math.random()*2.5+0.5;
      G.parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:1,r:Math.random()*2.5+1,color:color,text:i===0&&text?text:null});
    }
  };
}
