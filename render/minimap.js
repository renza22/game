const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installMinimapMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.drawMinimap = function(){
    var mm=document.getElementById('mm');
    if(!mm)return;
    var mctx=mm.getContext('2d');
    var mw=mm.width,mh=mm.height;
    var scx=mw/MW,scy=mh/MH;
    mctx.fillStyle='rgba(6,6,14,0.9)';mctx.fillRect(0,0,mw,mh);
    mctx.fillStyle='#2a1a50';
    for(var i=0;i<this.walls.length;i++){var w=this.walls[i];mctx.fillRect(w.x*scx,w.y*scy,Math.max(1,w.w*scx),Math.max(1,w.h*scy));}
    mctx.fillStyle='#cc2200';
    for(var i=0;i<this.traps.length;i++){var t=this.traps[i];if(t.on)mctx.fillRect(t.x*scx-1,t.y*scy-1,2,2);}
    mctx.fillStyle='#ffaa00';
    for(var i=0;i<this.mines.length;i++){var m=this.mines[i];if(m.on)mctx.fillRect(m.x*scx-1,m.y*scy-1,2,2);}
    mctx.fillStyle='#aa44ff';
    for(var i=0;i<this.portals.length;i++){var po=this.portals[i];mctx.fillRect(po.ax*scx-1.5,po.ay*scy-1.5,3,3);mctx.fillRect(po.bx*scx-1.5,po.by*scy-1.5,3,3);}
    mctx.fillStyle=this.stairOpen?'#ffcc44':'#555555';
    if(this.stair)mctx.fillRect(this.stair.x*scx-2,this.stair.y*scy-2,4,4);
    mctx.fillStyle='#ff3333';
    for(var i=0;i<this.enemies.length;i++){var e=this.enemies[i];mctx.fillRect(e.x*scx-1.5,e.y*scy-1.5,3,3);}
    mctx.strokeStyle='rgba(255,255,255,0.18)';mctx.lineWidth=0.5;
    mctx.strokeRect(cam.x*scx,cam.y*scy,VW*scx,VH*scy);
    mctx.fillStyle='#44aaff';mctx.beginPath();mctx.arc(this.P.x*scx,this.P.y*scy,2.5,0,Math.PI*2);mctx.fill();
    mctx.strokeStyle='#3a2a60';mctx.lineWidth=1;mctx.strokeRect(0,0,mw,mh);
  };
}
