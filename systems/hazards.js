const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installHazardMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.checkIce = function(obj){
    for(var i=0;i<this.iceZones.length;i++){
      var z=this.iceZones[i];
      if(obj.x>z.x&&obj.x<z.x+z.w&&obj.y>z.y&&obj.y<z.y+z.h) return true;
    }
    return false;
  };
  G.checkTraps = function(obj,isPlayer){
    for(var i=0;i<this.traps.length;i++){
      var t=this.traps[i];
      if(!t.on) continue;
      if(Math.hypot(obj.x-t.x,obj.y-t.y)<t.r+obj.r){
        t.timer++;
        if(t.timer%30===0){
          var dmg=isPlayer?6:10;
          obj.hp-=dmg;
          spawnParts(obj.x,obj.y,'#ff3300',4,isPlayer?'-'+dmg:null);
          if(isPlayer) this.handlePlayerDeath();
        }
      }
    }
  };
  G.checkMines = function(obj,isPlayer){
    for(var i=this.mines.length-1;i>=0;i--){
      var m=this.mines[i];
      if(!m.on) continue;
      if(Math.hypot(obj.x-m.x,obj.y-m.y)<m.r+obj.r){
        m.on=false;
        var r2=60, dmg=isPlayer?28:45;
        this.explosions.push({x:m.x,y:m.y,r:0,maxR:r2,life:1});
        spawnParts(m.x,m.y,'#ff8800',16,'BOOM!');
        if(isPlayer){var p=this.P;if(Math.hypot(p.x-m.x,p.y-m.y)<r2){p.hp-=dmg;p.iframes=40;this.handlePlayerDeath();}}
        for(var j=0;j<this.enemies.length;j++){var e=this.enemies[j];if(Math.hypot(e.x-m.x,e.y-m.y)<r2+e.r){var mineDmg=this.applyEnemyDefense(e,Math.round(dmg*0.7));e.hp-=mineDmg;e.iframes=20;if(e.isBoss&&e.enrage50)spawnParts(e.x,e.y,'#aaaaff',3,'ARMOR');}}
      }
    }
  };
  G.checkPortals = function(obj){
    if(obj.teleCD>0) return;
    for(var i=0;i<this.portals.length;i++){
      var po=this.portals[i];
      if(po.cd>0) continue;
      if(Math.hypot(obj.x-po.ax,obj.y-po.ay)<po.r+obj.r){
        obj.x=po.bx;obj.y=po.by;obj.teleCD=60;po.cd=30;
        spawnParts(po.bx,po.by,'#aa66ff',14,null);return;
      }
      if(Math.hypot(obj.x-po.bx,obj.y-po.by)<po.r+obj.r){
        obj.x=po.ax;obj.y=po.ay;obj.teleCD=60;po.cd=30;
        spawnParts(po.ax,po.ay,'#aa66ff',14,null);return;
      }
    }
  };
}
