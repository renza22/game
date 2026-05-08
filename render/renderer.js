const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installRendererMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.render = function(){
    ctx.clearRect(0,0,VW,VH);
    this.drawDungeon();
    // Draw boss projectiles behind enemies
    for(var i=0;i<this.enemies.length;i++){
      var be=this.enemies[i];
      if(be.isBoss && be.bossProjs){
        for(var bi=0;bi<be.bossProjs.length;bi++) this.drawBossProj(be.bossProjs[bi]);
      }
    }
    for(var i=0;i<this.enemies.length;i++) this.drawEnemy(this.enemies[i]);
    this.drawShadowDecoys();
    for(var i=0;i<this.projs.length;i++) this.drawProj(this.projs[i]);
    for(var i=0;i<this.enemyProjs.length;i++) this.drawEnemyProj(this.enemyProjs[i]);
    this.drawParts();
    if(this.state!=='over'&&this.state!=='win') this.drawPlayer();
    this.drawUI();
    if(this.state==='over'||this.state==='win') this.drawOverlay();
    if(this.state==='transition') this.drawTransition();
    if(this.state==='adminRevive') this.drawAdminReviveCinematic();
    this.drawMinimap();
  };
  G.drawBossProj = function(bp){
    if(!inView(bp.x,bp.y,20)) return;
    var sx=wx(bp.x), sy=wy(bp.y);
    ctx.save();
    var pulse=0.6+Math.sin(this.tick*0.3)*0.4;
    ctx.globalAlpha=0.9;
    var g=ctx.createRadialGradient(sx,sy,0,sx,sy,bp.r*2.5);
    g.addColorStop(0,bp.color||'#ff00ff');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(sx,sy,bp.r*2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=bp.color||'#ff00ff';
    ctx.beginPath();ctx.arc(sx,sy,bp.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffffff';ctx.globalAlpha=0.6;
    ctx.beginPath();ctx.arc(sx,sy,bp.r*0.4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  };
  G.drawEnemyProj = function(ep){
    if(!inView(ep.x,ep.y,ep.r*3)) return;
    var sx=wx(ep.x), sy=wy(ep.y);
    ctx.save();
    var lifePct=ep.life/ep.maxLife;
    ctx.globalAlpha=Math.min(1,lifePct*3);
    // Glow halo
    var g=ctx.createRadialGradient(sx,sy,0,sx,sy,ep.r*3.5);
    g.addColorStop(0,ep.glowColor||'rgba(255,140,0,0.5)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.arc(sx,sy,ep.r*3.5,0,Math.PI*2);ctx.fill();
    // Core
    if(ep.isSniper){
      // Draw as elongated bolt
      ctx.save();
      ctx.translate(sx,sy);
      ctx.rotate(Math.atan2(ep.vy,ep.vx));
      ctx.fillStyle=ep.color;
      ctx.beginPath();
      ctx.ellipse(0,0,ep.r*2.5,ep.r*0.7,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#ffffff';ctx.globalAlpha*=0.7;
      ctx.beginPath();ctx.ellipse(0,0,ep.r*1.2,ep.r*0.35,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    } else {
      // Round orange ball (Hunter)
      var pulse=0.7+Math.sin(this.tick*0.5+ep.x)*0.3;
      ctx.fillStyle=ep.color;
      ctx.beginPath();ctx.arc(sx,sy,ep.r*pulse,0,Math.PI*2);ctx.fill();
      // Inner bright core
      ctx.fillStyle='#ffeeaa';ctx.globalAlpha*=0.8;
      ctx.beginPath();ctx.arc(sx,sy,ep.r*0.45,0,Math.PI*2);ctx.fill();
      // Trailing sparks
      var trailLen=5;
      for(var ti=1;ti<=trailLen;ti++){
        var tf=ti/trailLen;
        var tx=sx-ep.vx*ti*0.6, ty=sy-ep.vy*ti*0.6;
        ctx.globalAlpha=ctx.globalAlpha*(1-tf)*0.4;
        ctx.fillStyle=ep.color;
        ctx.beginPath();ctx.arc(tx,ty,ep.r*(1-tf*0.7),0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  };
  G.drawShadowDecoys = function(){
    for(var i=0;i<this.shadowDecoys.length;i++){
      var sd=this.shadowDecoys[i];
      if(!inView(sd.x,sd.y)) continue;
      var alpha=(sd.life/sd.maxLife)*0.75;
      var sx=wx(sd.x),sy=wy(sd.y);
      ctx.save();
      ctx.globalAlpha=alpha;
      // ghost/shadow body
      ctx.fillStyle='#aa66ff';
      ctx.beginPath();ctx.ellipse(sx,sy-4,7,11,0,0,Math.PI*2);ctx.fill();
      // glow
      var g=ctx.createRadialGradient(sx,sy,0,sx,sy,22);
      g.addColorStop(0,'rgba(160,80,255,0.35)');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,22,0,Math.PI*2);ctx.fill();
      // eyes
      ctx.fillStyle='#ff4488';ctx.globalAlpha=alpha*0.9;
      ctx.beginPath();ctx.arc(sx-3,sy-6,2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(sx+3,sy-6,2,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  };
  G.drawDungeon = function(){
    var th=THEMES[Math.min(this.floor-1,THEMES.length-1)];
    // Floor tiles
    var sc=Math.floor(cam.x/TS), ec=Math.ceil((cam.x+VW)/TS)+1;
    var sr=Math.floor(cam.y/TS), er=Math.ceil((cam.y+VH)/TS)+1;
    for(var r=sr;r<er;r++) for(var c=sc;c<ec;c++){
      var fx=c*TS-cam.x, fy=r*TS-cam.y;
      ctx.fillStyle=(c+r)%2===0?th.f1:th.f2;
      ctx.fillRect(fx,fy,TS,TS);
      ctx.strokeStyle='rgba(20,15,40,0.8)';ctx.lineWidth=0.6;
      ctx.strokeRect(fx+0.3,fy+0.3,TS-0.6,TS-0.6);
    }
    // Spawn stair
    var L=FLOORS[this.floor-1];
    if(inView(L.spawn.x,L.spawn.y,80)){
      this.drawStair(wx(L.spawn.x),wy(L.spawn.y),'#226644','#44aa77','Masuk',false);
    }
    // Exit stair
    if(inView(this.stair.x,this.stair.y,80)){
      this.drawStair(wx(this.stair.x),wy(this.stair.y),
        this.stairOpen?'#885500':'#2a2a2a',
        this.stairOpen?'#ffcc44':'#555555',
        this.stairOpen?('Lantai '+(this.floor<10?this.floor+1:'TAMAT')):('Terkunci ('+this.enemies.length+')'),
        this.stairOpen);
    }
    // Ice zones
    for(var i=0;i<this.iceZones.length;i++){
      var z=this.iceZones[i];
      if(!inView(z.x+z.w/2,z.y+z.h/2,200))continue;
      ctx.fillStyle='rgba(100,180,255,0.11)';ctx.fillRect(wx(z.x),wy(z.y),z.w,z.h);
      ctx.strokeStyle='rgba(150,220,255,0.28)';ctx.lineWidth=1;ctx.strokeRect(wx(z.x),wy(z.y),z.w,z.h);
      ctx.fillStyle='rgba(200,240,255,0.45)';ctx.font='10px sans-serif';ctx.textAlign='center';
      ctx.fillText('*',wx(z.x+z.w/2),wy(z.y+z.h/2)+4);
    }
    // Traps
    for(var i=0;i<this.traps.length;i++){
      var t=this.traps[i];
      if(!t.on||!inView(t.x,t.y))continue;
      var pulse=Math.sin(this.tick*0.15+t.x)*0.4+0.6;
      var sx=wx(t.x),sy=wy(t.y);
      ctx.fillStyle='rgba(200,40,0,'+(0.25*pulse)+')';ctx.beginPath();ctx.arc(sx,sy,t.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,80,20,'+(0.7*pulse)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,sy,t.r,0,Math.PI*2);ctx.stroke();
      for(var k=0;k<6;k++){var a=k/6*Math.PI*2;ctx.strokeStyle='rgba(255,120,0,'+(0.5*pulse)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx+Math.cos(a)*6,sy+Math.sin(a)*6);ctx.lineTo(sx+Math.cos(a)*t.r,sy+Math.sin(a)*t.r);ctx.stroke();}
      ctx.fillStyle='rgba(255,100,0,0.8)';ctx.font='bold 10px Courier New';ctx.textAlign='center';ctx.fillText('!',sx,sy+4);
    }
    // Mines
    for(var i=0;i<this.mines.length;i++){
      var m=this.mines[i];
      if(!m.on||!inView(m.x,m.y))continue;
      var pulse=Math.sin(this.tick*0.2+m.x)*0.5+0.5;
      var sx=wx(m.x),sy=wy(m.y);
      ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(sx,sy,m.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,'+(80+pulse*120|0)+',0,0.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,m.r,0,Math.PI*2);ctx.stroke();
      if(Math.floor(this.tick/8)%2===0){ctx.fillStyle='rgba(255,100,0,0.9)';ctx.beginPath();ctx.arc(sx,sy,4,0,Math.PI*2);ctx.fill();}
    }
    // Portals
    for(var i=0;i<this.portals.length;i++){
      var po=this.portals[i];
      po.pulse=(po.pulse||0)+0.08;
      var ps=Math.sin(po.pulse)*4;
      var pairs=[[po.ax,po.ay],[po.bx,po.by]];
      for(var k=0;k<2;k++){
        var px=pairs[k][0],py=pairs[k][1];
        if(!inView(px,py,80))continue;
        var sx=wx(px),sy=wy(py);
        var g=ctx.createRadialGradient(sx,sy,0,sx,sy,po.r*2.2+ps);
        g.addColorStop(0,'rgba(160,80,255,0.45)');g.addColorStop(0.5,'rgba(80,20,200,0.18)');g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,po.r*2.2+ps,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(180,100,255,'+(0.7+Math.sin(po.pulse)*0.3)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,po.r+ps*0.4,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='rgba(220,180,255,0.85)';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('O',sx,sy+5);
      }
    }
    // Interior walls
    for(var i=0;i<this.walls.length;i++){
      var w=this.walls[i];
      if(!inView(w.x+w.w/2,w.y+w.h/2,100))continue;
      var sx=wx(w.x),sy=wy(w.y);
      ctx.fillStyle=th.wc;ctx.fillRect(sx,sy,w.w,w.h);
      // brick pattern
      var bh=14,bw=28;
      for(var row=0;row<Math.ceil(w.h/bh)+1;row++){
        var off=(row%2===0)?0:bw/2;
        for(var col=0;col<Math.ceil(w.w/bw)+2;col++){
          var bx=sx+col*bw-off,by=sy+row*bh;
          var cx2=Math.max(sx,bx),cy2=Math.max(sy,by);
          var cw=Math.min(bx+bw,sx+w.w)-cx2-1,ch=Math.min(by+bh,sy+w.h)-cy2-1;
          if(cw<=0||ch<=0)continue;
          var hi=(row*37+col*53)%7;
          var cols=['#1c1830','#1e1a30','#1a162c','#201c34','#1b1730','#1d1a32','#19152a'];
          ctx.fillStyle=cols[hi];ctx.fillRect(cx2+1,cy2+1,cw-1,ch-1);
          ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(cx2+1,cy2+1,cw-1,2);
          ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(cx2+1,cy2+ch-2,cw-1,2);
          ctx.fillStyle='#0b0918';ctx.fillRect(cx2,cy2,cw+1,1);ctx.fillRect(cx2,cy2,1,ch+1);
        }
      }
      ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(sx,sy,w.w,3);
      ctx.strokeStyle='#3a2860';ctx.lineWidth=1.5;ctx.strokeRect(sx+0.75,sy+0.75,w.w-1.5,w.h-1.5);
    }
    // Border walls
    var bsx=wx(0),bsy=wy(0);
    ctx.fillStyle='#0a0816';
    ctx.fillRect(bsx,bsy,MW,WALL);ctx.fillRect(bsx,wy(MH-WALL),MW,WALL);
    ctx.fillRect(bsx,bsy,WALL,MH);ctx.fillRect(wx(MW-WALL),bsy,WALL,MH);
    // Torches
    var torchList=[];
    for(var tx2=200;tx2<MW-200;tx2+=240){torchList.push([tx2,WALL]);torchList.push([tx2,MH-WALL]);}
    for(var ty2=200;ty2<MH-200;ty2+=240){torchList.push([WALL,ty2]);torchList.push([MW-WALL,ty2]);}
    for(var i=0;i<torchList.length;i++){
      var tx3=torchList[i][0],ty3=torchList[i][1];
      if(!inView(tx3,ty3,80))continue;
      var stx=wx(tx3),sty=wy(ty3);
      var fl=Math.sin(this.tick*0.18+tx3*0.01)*1.5;
      var gt=ctx.createRadialGradient(stx,sty,0,stx,sty,36+fl*2);
      gt.addColorStop(0,th.tc);gt.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gt;ctx.beginPath();ctx.arc(stx,sty,36+fl*2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff9922';ctx.beginPath();ctx.arc(stx,sty,3+fl*0.3,0,Math.PI*2);ctx.fill();
    }
    // Explosions
    for(var i=this.explosions.length-1;i>=0;i--){
      var ex=this.explosions[i];
      ex.r+=ex.maxR*0.1;ex.life-=0.07;
      if(ex.life<=0){this.explosions.splice(i,1);continue;}
      ctx.globalAlpha=ex.life*0.65;
      ctx.fillStyle='rgba(255,130,20,0.6)';ctx.beginPath();ctx.arc(wx(ex.x),wy(ex.y),ex.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,70,0,0.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(wx(ex.x),wy(ex.y),ex.r,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;
    }
  };
  G.drawStair = function(x,y,baseCol,stepCol,label,glow){
    if(glow){
      var pulse=Math.sin(this.tick*0.1)*0.3+0.7;
      ctx.fillStyle='rgba(255,200,50,'+(0.3*pulse)+')';
      ctx.beginPath();ctx.arc(x,y,40,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle=baseCol;ctx.fillRect(x-22,y-16,44,32);
    for(var s=0;s<4;s++){
      var sw=38-s*7,sh=7;
      ctx.fillStyle=s%2===0?stepCol:baseCol;
      ctx.fillRect(x-sw/2,y-16+s*sh,sw,sh);
    }
    ctx.strokeStyle=stepCol;ctx.lineWidth=1.5;ctx.strokeRect(x-22,y-16,44,32);
    ctx.fillStyle=stepCol;ctx.font='bold 8px Courier New';ctx.textAlign='center';
    ctx.fillText(label,x,y+26);
  };
  G.drawEnemy = function(e){
    if(!inView(e.x,e.y,e.r*2))return;
    if(e.iframes>0&&Math.floor(e.iframes/3)%2===0)return;

    // Boss gets special rendering
    if(e.isBoss){ this.drawBoss(e); return; }

    var sx=wx(e.x),sy=wy(e.y);
    var bob=Math.sin(this.tick*0.1+(e.wobble||0))*2;

    // Ghost dash visual: efek ungu transparan + afterimage
    var isGhosting = e.isDashGhost && e._ghostTimer>0;
    if(isGhosting){
      ctx.save();
      ctx.globalAlpha=0.38+Math.sin(this.tick*0.4)*0.15;
      // Afterimage trail
      for(var af=1;af<=3;af++){
        var tx=sx-(e._ghostDirX||0)*af*12, ty=sy-(e._ghostDirY||0)*af*12;
        ctx.globalAlpha=(0.22-af*0.06);
        ctx.fillStyle='#cc44ff';
        ctx.beginPath();ctx.arc(tx,ty,e.r*(1-af*0.1),0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=0.55;
    }

    ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();ctx.ellipse(sx,sy+e.r-1,e.r*0.75,e.r*0.26,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isGhosting?'#dd88ff':e.color;ctx.beginPath();ctx.arc(sx,sy+bob,e.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.16)';ctx.beginPath();ctx.arc(sx-e.r*0.3,sy+bob-e.r*0.3,e.r*0.35,0,Math.PI*2);ctx.fill();
    var eo=e.r*0.35;
    ctx.fillStyle=isGhosting?'#ff88ff':'#ff2222';ctx.beginPath();ctx.arc(sx-eo*0.6,sy+bob-eo*0.3,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(sx+eo*0.6,sy+bob-eo*0.3,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffff00';ctx.beginPath();ctx.arc(sx-eo*0.6,sy+bob-eo*0.3,1.1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(sx+eo*0.6,sy+bob-eo*0.3,1.1,0,Math.PI*2);ctx.fill();
    var bw=e.r*2.1;
    ctx.fillStyle='#180606';ctx.fillRect(sx-bw/2,sy+bob-e.r-10,bw,5);
    ctx.fillStyle=e.hp>e.maxHp*0.5?'#44cc44':e.hp>e.maxHp*0.25?'#ccaa22':'#cc2222';
    ctx.fillRect(sx-bw/2,sy+bob-e.r-10,bw*(e.hp/e.maxHp),5);
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.font='7px Courier New';ctx.textAlign='center';
    ctx.fillText(e.name+(e.isDashGhost?' 👻':''),sx,sy+bob-e.r-13);

    if(isGhosting) ctx.restore();
  };
  G.drawBoss = function(e){
    var sx=wx(e.x), sy=wy(e.y);
    var t=this.tick;
    var hpPct=e.hp/e.maxHp;
    var ph=e.phase;

    // Outer glow aura
    var auraCol=ph===3?'rgba(180,0,255,':'ph'===2?'rgba(255,0,100,':'rgba(200,0,255,';
    auraCol=ph===3?'rgba(180,0,255,':ph===2?'rgba(255,0,100,':'rgba(200,0,255,';
    var auraR=e.r*2.8+Math.sin(t*0.06)*8;
    var ag=ctx.createRadialGradient(sx,sy,e.r,sx,sy,auraR);
    ag.addColorStop(0,auraCol+'0.5)');
    ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ag;
    ctx.beginPath();ctx.arc(sx,sy,auraR,0,Math.PI*2);ctx.fill();

    // Rage flash
    if(e.rageFlash>0){
      ctx.save();
      ctx.globalAlpha=(e.rageFlash/80)*0.5;
      ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.arc(sx,sy,e.r*3,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }

    // Rotating rings
    ctx.save();
    ctx.translate(sx,sy);
    for(var ri=0;ri<3;ri++){
      var ra=t*0.04*(ri%2===0?1:-1)+ri*Math.PI*2/3;
      var rr=e.r+12+ri*10;
      ctx.strokeStyle='rgba(255,'+(ri*80)+',255,'+(0.4+ri*0.15)+')';
      ctx.lineWidth=2;
      ctx.setLineDash([8,6]);
      ctx.lineDashOffset=-t*0.6*(ri%2===0?1:-1);
      ctx.beginPath();
      for(var k=0;k<8;k++){
        var ka=k/8*Math.PI*2+ra;
        if(k===0) ctx.moveTo(Math.cos(ka)*rr,Math.sin(ka)*rr);
        else ctx.lineTo(Math.cos(ka)*rr,Math.sin(ka)*rr);
      }
      ctx.closePath();ctx.stroke();
    }
    ctx.setLineDash([]);

    // Main body (dark void form)
    var bodyGrad=ctx.createRadialGradient(0,0,0,0,0,e.r);
    bodyGrad.addColorStop(0,ph===3?'#550033':'#220022');
    bodyGrad.addColorStop(0.5,ph===3?'#880055':'#440044');
    bodyGrad.addColorStop(1,'#ff00ff');
    ctx.fillStyle=bodyGrad;
    ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();

    // Void cracks on body
    ctx.strokeStyle='rgba(255,150,255,0.6)';ctx.lineWidth=1.5;
    for(var ci=0;ci<6;ci++){
      var ca=ci/6*Math.PI*2+t*0.01;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ca)*5,Math.sin(ca)*5);
      ctx.lineTo(Math.cos(ca+0.3)*(e.r-5),Math.sin(ca+0.3)*(e.r-5));
      ctx.stroke();
    }

    // Phase indicator glow
    var innerCol=ph===3?'#ff4488':ph===2?'#ff2244':'#cc00ff';
    ctx.fillStyle=innerCol;ctx.globalAlpha=0.5+Math.sin(t*0.12)*0.3;
    ctx.beginPath();ctx.arc(0,0,e.r*0.5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;

    // Eyes — 4 eyes in phase 3, 3 in phase 2, 2 in phase 1
    var eyeCount=ph;
    for(var ei=0;ei<eyeCount+1;ei++){
      var ea=ei/(eyeCount+1)*Math.PI*2+t*0.02;
      var er2=e.r*0.45;
      var ex2=Math.cos(ea)*er2, ey2=Math.sin(ea)*er2;
      ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.arc(ex2,ey2,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=ph===3?'#ff0000':'#ff4400';
      ctx.beginPath();ctx.arc(ex2,ey2,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#000000';
      ctx.beginPath();ctx.arc(ex2+1,ey2,1.5,0,Math.PI*2);ctx.fill();
    }

    // Crown / spikes
    for(var si=0;si<8;si++){
      var sa=si/8*Math.PI*2+t*0.015;
      var sx2=Math.cos(sa)*(e.r-2), sy2=Math.sin(sa)*(e.r-2);
      var sx3=Math.cos(sa)*(e.r+12+Math.sin(t*0.1+si)*4), sy3=Math.sin(sa)*(e.r+12+Math.sin(t*0.1+si)*4);
      ctx.strokeStyle=ph===3?'#ff0088':'#aa00ff';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(sx2,sy2);ctx.lineTo(sx3,sy3);ctx.stroke();
      ctx.fillStyle='rgba(255,0,200,0.8)';
      ctx.beginPath();ctx.arc(sx3,sy3,3,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();

    // Shield indicator
    if(e.shieldHp>0){
      var shieldPct=e.shieldHp/800;
      ctx.save();
      ctx.globalAlpha=0.55+Math.sin(t*0.2)*0.2;
      ctx.strokeStyle='rgba(180,220,255,0.9)';ctx.lineWidth=3;
      ctx.setLineDash([12,4]);
      ctx.lineDashOffset=-(t*1.5)%16;
      ctx.beginPath();ctx.arc(sx,sy,e.r+8,0,Math.PI*2*shieldPct);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
    }

    // HP bar (large, prominent)
    var bw2=140;
    var hbx=sx-bw2/2, hby=sy-e.r-28;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(hbx-1,hby-1,bw2+2,12);
    var hpCol=hpPct>0.6?'#cc00ff':hpPct>0.35?'#ff0088':'#ff0000';
    ctx.fillStyle=hpCol;ctx.fillRect(hbx,hby,bw2*hpPct,10);
    // Shield bar overlay
    if(e.shieldHp>0){
      ctx.fillStyle='rgba(180,220,255,0.6)';
      ctx.fillRect(hbx,hby,bw2*(e.shieldHp/800),10);
    }
    ctx.strokeStyle='rgba(255,0,255,0.5)';ctx.lineWidth=1;ctx.strokeRect(hbx,hby,bw2,10);

    // Boss name & phase
    var phaseLabel=ph===3?'⚠ DESPERATE PHASE':ph===2?'⚡ ENRAGED':'Phase 1';
    ctx.fillStyle='#ff00ff';ctx.font='bold 12px Courier New';ctx.textAlign='center';
    ctx.fillText('💀 VOIDLORD — RAJA KEGELAPAN',sx,hby-18);
    ctx.fillStyle=ph===3?'#ff4466':ph===2?'#ff8800':'#aa66ff';
    ctx.font='bold 9px Courier New';
    ctx.fillText(phaseLabel+' | HP: '+Math.max(0,e.hp|0)+'/'+e.maxHp,sx,hby-6);
    ctx.textAlign='left';
  };
  G.drawProj = function(pr){
    if(!inView(pr.x,pr.y))return;
    var sx=wx(pr.x),sy=wy(pr.y);
    ctx.save();
    if(pr.type==='bullet'){
      ctx.translate(sx,sy);ctx.rotate(pr.angle);
      ctx.fillStyle='#ffee44';ctx.fillRect(-6,-2,10,4);
      ctx.fillStyle='#ffffff';ctx.fillRect(2,-1,3,2);
    } else if(pr.type==='laser'){
      ctx.translate(sx,sy);ctx.rotate(pr.angle);
      ctx.globalAlpha=0.4;ctx.fillStyle='#88ffff';ctx.fillRect(-8,-4,16,8);
      ctx.globalAlpha=1;ctx.fillStyle='#00ffff';ctx.fillRect(-8,-2,16,4);
      ctx.fillStyle='#ffffff';ctx.fillRect(-6,-1,14,2);
    } else if(pr.type==='plasma'){
      var g=ctx.createRadialGradient(sx,sy,0,sx,sy,pr.r*2.2);
      g.addColorStop(0,'rgba(255,200,255,0.9)');g.addColorStop(0.5,'rgba(220,80,255,0.7)');g.addColorStop(1,'rgba(180,20,200,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,pr.r*2.2,0,Math.PI*2);ctx.fill();
    } else if(pr.type==='sniper'){
      ctx.translate(sx,sy);ctx.rotate(pr.angle);
      ctx.globalAlpha=0.3;ctx.fillStyle='#aaffaa';ctx.fillRect(-15,-4,30,8);
      ctx.globalAlpha=0.9;ctx.fillStyle='#88ff44';ctx.fillRect(-14,-2,28,4);
      ctx.globalAlpha=1;ctx.fillStyle='#ffffff';ctx.fillRect(-12,-1,26,2);
    } else if(pr.type==='orb'){
      var g=ctx.createRadialGradient(sx,sy,0,sx,sy,pr.r*2);
      g.addColorStop(0,'rgba(255,220,255,0.9)');g.addColorStop(0.5,'rgba(180,80,255,0.7)');g.addColorStop(1,'rgba(100,20,200,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,pr.r*2,0,Math.PI*2);ctx.fill();
    } else if(pr.type==='bomb'){
      ctx.fillStyle='#222';ctx.beginPath();ctx.arc(sx,sy,pr.r*0.65,0,Math.PI*2);ctx.fill();
      var fuse=pr.life/pr.maxLife;
      ctx.strokeStyle=fuse>0.5?'#ff8822':'#ff2222';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,sy,pr.r*0.65,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  };
  G.drawParts = function(){
    for(var i=0;i<this.parts.length;i++){
      var p=this.parts[i];
      if(!inView(p.x,p.y,40))continue;
      ctx.globalAlpha=p.life;
      if(p.text){ctx.fillStyle=p.color;ctx.font='bold 12px Courier New';ctx.textAlign='center';ctx.fillText(p.text,wx(p.x),wy(p.y));}
      else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(wx(p.x),wy(p.y),p.r,0,Math.PI*2);ctx.fill();}
    }
    ctx.globalAlpha=1;
  };
  G.drawPlayer = function(){
    var p=this.P;
    if(this.state!=='adminRevive'&&p.iframes>0&&Math.floor(p.iframes/4)%2===0)return;
    var sx=wx(p.x),sy=wy(p.y);
    var t=this.tick, moving=Math.hypot(p.vx,p.vy)>0.5;
    var walkPhase=t*0.28, breathPhase=t*0.05;
    var bob=moving?Math.abs(Math.sin(walkPhase))*2:Math.sin(breathPhase)*0.8;

    if(this.state==='adminRevive'){
      var reviveProgress=1-(this.adminReviveTimer/(this.adminReviveMax||180));
      var pulse=0.5+Math.sin(t*0.18)*0.5;
      ctx.save();
      ctx.globalCompositeOperation='lighter';
      var auraR=42+reviveProgress*72+pulse*10;
      var aura=ctx.createRadialGradient(sx,sy-6,0,sx,sy-6,auraR);
      aura.addColorStop(0,'rgba(255,255,255,0.85)');
      aura.addColorStop(0.22,'rgba(255,204,68,0.55)');
      aura.addColorStop(0.55,'rgba(68,255,204,0.22)');
      aura.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=aura;ctx.beginPath();ctx.arc(sx,sy-6,auraR,0,Math.PI*2);ctx.fill();
      for(var rr=0;rr<4;rr++){
        var ringR=26+reviveProgress*130+rr*18+(t*1.5%18);
        ctx.globalAlpha=Math.max(0,0.75-ringR/190);
        ctx.strokeStyle=rr%2===0?'#ffcc44':'#44ffcc';
        ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(sx,sy-6,ringR,0,Math.PI*2);ctx.stroke();
      }
      for(var ray=0;ray<14;ray++){
        var a=ray/14*Math.PI*2+t*0.025;
        var r1=22+reviveProgress*16;
        var r2=105+Math.sin(t*0.08+ray)*22;
        ctx.globalAlpha=0.22+0.16*pulse;
        ctx.strokeStyle=ray%2===0?'#ffffff':'#ffcc44';
        ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(sx+Math.cos(a)*r1,sy-6+Math.sin(a)*r1);
        ctx.lineTo(sx+Math.cos(a)*r2,sy-6+Math.sin(a)*r2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Dash trail
    for(var i=0;i<p.dashTrail.length;i++){
      var tr=p.dashTrail[i];
      if(tr.a<=0)continue;
      ctx.save();ctx.globalAlpha=tr.a*0.45;ctx.fillStyle='#44aaff';
      ctx.beginPath();ctx.ellipse(wx(tr.x),wy(tr.y)-6,5,10,0,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }

    ctx.save();ctx.translate(sx,sy-bob);

    // Shadow
    ctx.globalAlpha=0.28;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,8,11,3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;

    // Spider legs (8 legs)
    var legConfigs=[
      {s:1,tx:15,ty:10},{s:1,tx:19,ty:16},{s:1,tx:17,ty:22},{s:1,tx:11,ty:26},
      {s:-1,tx:15,ty:10},{s:-1,tx:19,ty:16},{s:-1,tx:17,ty:22},{s:-1,tx:11,ty:26},
    ];
    for(var i=0;i<8;i++){
      var cfg=legConfigs[i];
      var lp=Math.sin(walkPhase+(i%4)*0.7)*(moving?0.4:0.08);
      var s=cfg.s;
      ctx.strokeStyle='#226644';ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(s*6,-2);ctx.lineTo(s*(cfg.tx*0.5+lp*3),cfg.ty*0.4-4+lp*3);ctx.stroke();
      ctx.strokeStyle='#33aa66';
      ctx.beginPath();ctx.moveTo(s*(cfg.tx*0.5+lp*3),cfg.ty*0.4-4+lp*3);ctx.lineTo(s*(cfg.tx+lp*5),cfg.ty+lp*4);ctx.stroke();
      ctx.fillStyle='#55cc88';ctx.beginPath();ctx.arc(s*(cfg.tx*0.5+lp*3),cfg.ty*0.4-4+lp*3,2.2,0,Math.PI*2);ctx.fill();
    }
    // Abdomen
    ctx.fillStyle='#1a3322';ctx.beginPath();ctx.ellipse(0,6,10,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#224433';ctx.beginPath();ctx.ellipse(0,6,7,10,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#33ff88';ctx.lineWidth=0.8;ctx.globalAlpha=0.35;
    for(var i=0;i<4;i++){ctx.beginPath();ctx.ellipse(0,2+i*4,6-i,2,0,0,Math.PI);ctx.stroke();}
    ctx.globalAlpha=1;
    // Thorax
    ctx.fillStyle='#223344';ctx.beginPath();ctx.ellipse(0,-4,9,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#334466';ctx.beginPath();ctx.ellipse(0,-5,7,7,0,0,Math.PI*2);ctx.fill();
    // Armor
    ctx.fillStyle='#3a5577';ctx.beginPath();ctx.roundRect(-5,-11,10,7,3);ctx.fill();
    ctx.strokeStyle='#55aaff';ctx.lineWidth=0.7;ctx.globalAlpha=0.55;
    ctx.beginPath();ctx.moveTo(-4,-10);ctx.lineTo(-4,-5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(4,-10);ctx.lineTo(4,-5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(4,-8);ctx.stroke();
    ctx.globalAlpha=1;
    // Head
    ctx.fillStyle='#1a2233';ctx.beginPath();ctx.ellipse(0,-13,7,6,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#002244';ctx.beginPath();ctx.ellipse(0,-13,5.5,4,0,0,Math.PI*2);ctx.fill();
    var vPulse=0.7+Math.sin(t*0.08)*0.3;
    ctx.globalAlpha=vPulse;ctx.fillStyle='#00aaff';ctx.beginPath();ctx.ellipse(0,-13,4,3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // Eyes
    var eyeList=[[-4,-15],[-2,-16.5],[2,-16.5],[4,-15],[-3.5,-13],[3.5,-13]];
    for(var i=0;i<eyeList.length;i++){ctx.fillStyle='#ff4400';ctx.beginPath();ctx.arc(eyeList[i][0],eyeList[i][1],1.5,0,Math.PI*2);ctx.fill();}
    // Gun arm
    var gunAng=p.facing;
    var gx=Math.cos(gunAng)*10, gy=Math.sin(gunAng)*10;
    ctx.save();ctx.translate(gx,gy-4);ctx.rotate(gunAng);
    var w=this.weapons[p.weaponIdx];
    ctx.fillStyle='#335577';ctx.fillRect(-2,-2.5,14,5);
    ctx.fillStyle=w.color||'#55aaff';ctx.fillRect(8,-1.5,8,3);
    var atkProg=Math.min((p.atkFrame||0)/(p.atkDur||10),1);
    if(atkProg<0.2){var f=1-atkProg/0.2;ctx.globalAlpha=f;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(16,0,4+f*4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
    ctx.restore();
    ctx.restore();

    // Barrier glow (drawn after restore, in world coords)
    if(this._barrierOn){
      var alpha2=0.4+Math.sin(this.tick*0.15)*0.2;
      ctx.save();ctx.globalAlpha=alpha2;
      var bsx2=wx(p.x),bsy2=wy(p.y)-6;
      var bg=ctx.createRadialGradient(bsx2,bsy2,10,bsx2,bsy2,30);
      bg.addColorStop(0,'rgba(60,140,255,0.5)');bg.addColorStop(1,'rgba(0,80,255,0)');
      ctx.fillStyle=bg;ctx.beginPath();ctx.arc(bsx2,bsy2,30,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(100,180,255,0.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(bsx2,bsy2,22,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    // Time slow aura
    if(this._timeSlowOn){
      var alpha3=0.3+Math.sin(this.tick*0.08)*0.15;
      var tsx2=wx(p.x),tsy2=wy(p.y)-6;
      ctx.save();ctx.globalAlpha=alpha3;
      ctx.strokeStyle='rgba(255,180,0,0.8)';ctx.lineWidth=1.5;
      ctx.setLineDash([4,4]);ctx.lineDashOffset=-(this.tick*0.5)%8;
      ctx.beginPath();ctx.arc(tsx2,tsy2,40,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
    }
    // Berserker aura
    if(this._berserkerOn){
      var alpha4=0.5+Math.sin(this.tick*0.25)*0.3;
      var brx=wx(p.x),bry=wy(p.y)-6;
      ctx.save();ctx.globalAlpha=alpha4;
      var bg2=ctx.createRadialGradient(brx,bry,5,brx,bry,35);
      bg2.addColorStop(0,'rgba(255,80,0,0.6)');bg2.addColorStop(1,'rgba(255,0,0,0)');
      ctx.fillStyle=bg2;ctx.beginPath();ctx.arc(brx,bry,35,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,140,0,0.9)';ctx.lineWidth=2;
      ctx.setLineDash([3,3]);ctx.lineDashOffset=-(this.tick*1.2)%6;
      ctx.beginPath();ctx.arc(brx,bry,26,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
    }
    // Lightning arcs
    if(this._lightningArcs && this._lightningArcs.length>0){
      for(var i=0;i<this._lightningArcs.length;i++){
        var arc=this._lightningArcs[i];
        var arcAlpha=arc.life/arc.maxLife;
        ctx.save();ctx.globalAlpha=arcAlpha;
        ctx.strokeStyle='#ffff44';ctx.lineWidth=2+arcAlpha*2;
        ctx.shadowColor='#88ffff';ctx.shadowBlur=8;
        ctx.beginPath();ctx.moveTo(wx(arc.x1),wy(arc.y1));
        // Zigzag line
        var steps=5;
        for(var s=1;s<steps;s++){
          var t2=s/steps;
          var zx=wx(arc.x1+(arc.x2-arc.x1)*t2)+(Math.random()-0.5)*18;
          var zy=wy(arc.y1+(arc.y2-arc.y1)*t2)+(Math.random()-0.5)*18;
          ctx.lineTo(zx,zy);
        }
        ctx.lineTo(wx(arc.x2),wy(arc.y2));
        ctx.stroke();ctx.restore();
      }
    }
  };
  G.drawAdminReviveCinematic = function(){
    var p=this.P;
    var progress=1-(this.adminReviveTimer/(this.adminReviveMax||180));
    var fadeIn=Math.min(1,progress*3);
    var fadeOut=Math.min(1,this.adminReviveTimer/45);
    var alpha=Math.min(fadeIn,fadeOut);
    var sx=wx(p.x), sy=wy(p.y);

    ctx.save();
    ctx.fillStyle='rgba(255,245,180,'+(0.22*(1-progress))+')';
    ctx.fillRect(0,0,VW,VH);
    ctx.fillStyle='rgba(0,0,0,'+(0.28*alpha)+')';
    ctx.fillRect(0,0,VW,VH);

    ctx.globalCompositeOperation='lighter';
    var shock=progress<0.45?progress/0.45:Math.max(0,1-(progress-0.45)/0.55);
    ctx.globalAlpha=0.55*shock;
    ctx.strokeStyle='#ffffff';
    ctx.lineWidth=5;
    ctx.beginPath();ctx.arc(sx,sy-6,80+progress*360,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ffcc44';
    ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(sx,sy-6,40+progress*260,0,Math.PI*2);ctx.stroke();
    ctx.globalCompositeOperation='source-over';

    var titleAlpha=progress<0.18?progress/0.18:1;
    ctx.globalAlpha=titleAlpha*alpha;
    ctx.textAlign='center';
    ctx.fillStyle='#ffcc44';
    ctx.font='bold 28px Courier New';
    ctx.fillText('BANGKITLAH!',VW/2,VH/2-96);
    ctx.fillStyle='#44ffcc';
    ctx.font='bold 13px Courier New';
    ctx.fillText('HADIAH ADMIN MENGALIR KE TUBUHMU',VW/2,VH/2-68);

    var barW=260, barH=6, bx=VW/2-barW/2, by=VH/2-42;
    ctx.globalAlpha=0.85*alpha;
    ctx.fillStyle='rgba(255,255,255,0.12)';
    ctx.fillRect(bx,by,barW,barH);
    ctx.fillStyle='#ffcc44';
    ctx.fillRect(bx,by,barW*progress,barH);
    ctx.strokeStyle='rgba(255,204,68,0.6)';
    ctx.strokeRect(bx,by,barW,barH);

    if(progress>0.76){
      var ready=(progress-0.76)/0.24;
      ctx.globalAlpha=Math.min(1,ready)*alpha;
      ctx.fillStyle='#ffffff';
      ctx.font='bold 16px Courier New';
      ctx.fillText('HABISI BIJI KORUPTOR ITU',VW/2,VH/2+26);
    }
    ctx.restore();
  };
}
