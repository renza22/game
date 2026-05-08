const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installRenderUiMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.updateHUD = function(){
    var p=this.P, w=this.weapons[p.weaponIdx];
    document.getElementById('bhp').style.width=Math.max(0,100*p.hp/p.maxHp)+'%';
    document.getElementById('thp').textContent=Math.max(0,p.hp)+'/'+p.maxHp;
    document.getElementById('bmp').style.width=Math.max(0,100*p.mp/p.maxMp)+'%';
    document.getElementById('tmp').textContent=p.mp+'/'+p.maxMp;
    document.getElementById('tlv').textContent=p.level;
    document.getElementById('tfl').textContent=this.floor+'/10';
    document.getElementById('ten').textContent=this.enemies.length;
    document.getElementById('tsc').textContent=this.score;
    document.getElementById('tam').textContent='∞ inf';
    document.getElementById('tpot').textContent=p.potions;
    document.getElementById('tgold').textContent=this.gold;
    var livesEl=document.getElementById('tlives');
    if(livesEl){
      var hearts='';
      for(var li=0;li<p.lives;li++) hearts+='❤️';
      livesEl.textContent=hearts||'0';
    }
    // Update skill HUD slot
    var slot=document.getElementById('skill-hud-slot');
    var cdBar=document.getElementById('skill-hud-cd-bar');
    if(slot){
      if(this.activeSkill){
        var SKILLS=this._getSkillDefs();
        var sk=null; for(var i=0;i<SKILLS.length;i++) if(SKILLS[i].id===this.activeSkill){sk=SKILLS[i];break;}
        if(sk){
          var ready=this.skillCd===0&&!this.skillActive;
          var active=this.skillActive;
          var cdPct=this.skillCd>0?Math.round(100*(1-this.skillCd/sk.cooldown)):100;
          var borderCol=active?'#aa44ff':ready?'#44ffcc':'#224488';
          var bgCol=active?'rgba(160,40,255,0.25)':ready?'rgba(40,220,180,0.15)':'#0e0e20';
          slot.style.borderColor=borderCol;
          slot.style.background=bgCol;
          slot.innerHTML='<span style="font-size:18px;line-height:1;">'+sk.icon+'</span>'
            +'<span style="font-size:6px;color:'+(ready?'#88ffcc':active?'#ff88ff':'#6699cc')+';text-align:center;max-width:48px;overflow:hidden;">'+(active?'AKTIF':ready?'SIAP':(Math.ceil(this.skillCd/60)+'s'))+'</span>'
            +'<div id="skill-hud-cd-bar" style="position:absolute;bottom:0;left:0;height:3px;width:'+cdPct+'%;background:'+(active?'#aa44ff':ready?'#44ffcc':'#2255aa')+';"></div>';
        }
      } else {
        slot.style.borderColor='#242440';
        slot.style.background='#0e0e20';
        slot.innerHTML='<span style="font-size:9px;color:#333355;">—</span><span style="font-size:7px;color:#333355;">No Skill</span><div id="skill-hud-cd-bar" style="position:absolute;bottom:0;left:0;height:3px;width:0%;background:#4488ff;"></div>';
      }
    }
  };
  G.drawUI = function(){
    var p=this.P;
    var w=this.weapons[p.weaponIdx];
    // Weapon badge
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(VW-115,6,109,20);
    ctx.fillStyle=w.color||'#55aaff';ctx.font='bold 10px Courier New';ctx.textAlign='right';
    ctx.fillText('['+p.weaponIdx+1+'] '+w.name,VW-8,19);

    // Stair prompt
    if(this.stairOpen){
      var dist=Math.hypot(p.x-this.stair.x,p.y-this.stair.y);
      var stx=wx(this.stair.x),sty=wy(this.stair.y);
      if(dist<180){
        ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(stx-70,sty-52,140,22);
        ctx.fillStyle='#ffee44';ctx.font='bold 9px Courier New';ctx.textAlign='center';
        ctx.fillText(this.floor>=10?'Injak = SELESAI!':'Injak tangga = Lantai '+(this.floor+1),stx,sty-36);
      }
    }

    // Off-screen arrows
    for(var i=0;i<this.enemies.length;i++){
      var e=this.enemies[i];
      var esx=wx(e.x),esy=wy(e.y);
      if(esx>-20&&esx<VW+20&&esy>-20&&esy<VH+20)continue;
      var ang=Math.atan2(e.y-p.y,e.x-p.x);
      var ax=VW/2+Math.cos(ang)*(Math.min(VW,VH)/2-28);
      var ay=VH/2+Math.sin(ang)*(Math.min(VW,VH)/2-28);
      ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);
      ctx.fillStyle='rgba(255,80,80,0.65)';
      ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();
      ctx.restore();
    }

    // Dash bar
    var psx=wx(p.x),psy=wy(p.y);
    var dcd=p.dashCd||0,maxDcd=55,bw2=55,bh=5;
    var dbx=psx-bw2/2,dby=psy+p.r+9;
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.beginPath();ctx.roundRect(dbx-1,dby-1,bw2+2,bh+2,2);ctx.fill();
    var dashFill=dcd===0?bw2:bw2*(1-dcd/maxDcd);
    ctx.fillStyle=dcd===0?'#44eeff':'#1166aa';
    ctx.beginPath();ctx.roundRect(dbx,dby,dashFill,bh,1.5);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='6px Courier New';ctx.textAlign='center';
    ctx.fillText(dcd===0?'DASH':'DASH',psx,dby+bh+7);

    // Skill indicator near player
    if(this.activeSkill){
      var SKILLS=this._getSkillDefs();
      var sk=null; for(var i=0;i<SKILLS.length;i++) if(SKILLS[i].id===this.activeSkill){sk=SKILLS[i];break;}
      if(sk){
        var sbx=psx-28, sby=psy-p.r-40, sbw=56, sbh=16;
        ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(sbx,sby,sbw,sbh,4);ctx.fill();
        var skReady=this.skillCd===0&&!this.skillActive;
        var skActive=this.skillActive;
        var fillRatio=this.skillCd>0?(1-this.skillCd/sk.cooldown):1;
        ctx.fillStyle=skActive?'rgba(180,100,255,0.55)':skReady?'rgba(80,220,180,0.35)':'rgba(40,80,180,0.35)';
        ctx.beginPath();ctx.roundRect(sbx,sby,sbw*fillRatio,sbh,4);ctx.fill();
        ctx.fillStyle=skActive?'#cc88ff':skReady?'#88ffcc':'#4488cc';
        ctx.font='bold 7px Courier New';ctx.textAlign='center';
        var label=skActive?'AKTIF!':skReady?('[SP] '+sk.icon):('[SP] '+(Math.ceil(this.skillCd/60))+'s');
        ctx.fillText(label,psx,sby+sbh-3);
      }
    }

    // Skill HUD corner box
    if(this.activeSkill){
      var SKILLS=this._getSkillDefs();
      var sk=null; for(var i=0;i<SKILLS.length;i++) if(SKILLS[i].id===this.activeSkill){sk=SKILLS[i];break;}
      if(sk){
        var hx=VW-130, hy=30, hw=122, hh=28;
        ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(hx,hy,hw,hh,5);ctx.fill();
        var ready=this.skillCd===0&&!this.skillActive;
        var active=this.skillActive;
        var fr=this.skillCd>0?(1-this.skillCd/sk.cooldown):1;
        ctx.fillStyle=active?'rgba(180,80,255,0.4)':ready?'rgba(60,200,160,0.3)':'rgba(20,60,160,0.3)';
        ctx.beginPath();ctx.roundRect(hx,hy,hw*fr,hh,5);ctx.fill();
        ctx.strokeStyle=active?'#cc44ff':ready?'#44ffcc':'#2244aa';
        ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(hx,hy,hw,hh,5);ctx.stroke();
        ctx.fillStyle=active?'#ff88ff':ready?'#88ffcc':'#6699cc';
        ctx.font='bold 9px Courier New';ctx.textAlign='left';
        ctx.fillText(sk.icon+' '+sk.name,hx+6,hy+11);
        ctx.fillStyle='rgba(200,200,255,0.5)';ctx.font='7px Courier New';
        var statusTxt=active?'AKTIF ('+this.skillTimer+'t)':ready?'SIAP — Tekan SPASI':'CD '+(Math.ceil(this.skillCd/60))+'s';
        ctx.fillText(statusTxt,hx+6,hy+23);
      }
    }

    // Floor info box
    var th=THEMES[Math.min(this.floor-1,THEMES.length-1)];
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(WALL+2,WALL+2,200,55);
    ctx.fillStyle=this.floor===10?'#ff00ff':'#ffcc44';
    ctx.font='bold 10px Courier New';ctx.textAlign='left';
    ctx.fillText('Lantai '+this.floor+': '+th.name,WALL+6,WALL+15);
    ctx.fillStyle=this.stairOpen?'#44ff88':'#ff6666';
    if(this.floor===10){
      var boss=null; for(var bi=0;bi<this.enemies.length;bi++) if(this.enemies[bi].isBoss){boss=this.enemies[bi];break;}
      if(boss) ctx.fillText('💀 BOSS: '+Math.floor(boss.hp/boss.maxHp*100)+'% HP | Phase '+boss.phase,WALL+6,WALL+28);
      else ctx.fillText(this.stairOpen?'BOS DIKALAHKAN!':'Bunuh VOIDLORD!',WALL+6,WALL+28);
    } else {
      ctx.fillText(this.stairOpen?'Tangga TERBUKA!':'Musuh tersisa: '+this.enemies.length,WALL+6,WALL+28);
    }
    ctx.fillStyle='#666688';
    ctx.fillText('Score: '+this.score+'  Kill: '+this.kills,WALL+6,WALL+42);
  };
  G.drawOverlay = function(){
    ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(0,0,VW,VH);
    ctx.textAlign='center';
    if(this.state==='over'){
      ctx.fillStyle='#ff4444';ctx.font='bold 44px Courier New';ctx.fillText('GAME OVER',VW/2,VH/2-50);
      ctx.fillStyle='#cc6666';ctx.font='16px Courier New';ctx.fillText('Mati di Lantai '+this.floor+'/10',VW/2,VH/2-16);
    } else {
      ctx.fillStyle='#ffdd44';ctx.font='bold 38px Courier New';ctx.fillText('DUNGEON TAKLUK!',VW/2,VH/2-52);
      ctx.fillStyle='#ff88ff';ctx.font='bold 18px Courier New';ctx.fillText('💀 VOIDLORD DIKALAHKAN!',VW/2,VH/2-20);
      ctx.fillStyle='#aaffaa';ctx.font='14px Courier New';ctx.fillText('Semua 10 Lantai Diselesaikan!',VW/2,VH/2+6);
    }
    ctx.fillStyle='#aaaacc';ctx.font='14px Courier New';ctx.fillText('Score: '+this.score+' | Kill: '+this.kills+' | Level: '+this.P.level,VW/2,VH/2+30);
    ctx.fillStyle='#6666aa';ctx.font='13px Courier New';ctx.fillText('Klik untuk main lagi',VW/2,VH/2+58);
  };
  G.drawTransition = function(){
    // If shop is open, show a subtle pause indicator instead
    if(this._shopOpen){
      ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,VW,VH);
      ctx.fillStyle='rgba(255,204,68,0.25)';ctx.font='bold 22px Courier New';ctx.textAlign='center';
      ctx.fillText('⏸ GAME PAUSED',VW/2,VH/2);
      ctx.fillStyle='rgba(150,150,200,0.4)';ctx.font='11px Courier New';
      ctx.fillText('Toko sedang terbuka…',VW/2,VH/2+24);
      return;
    }
    var alpha=Math.min(1,(90-this.transTimer)/40);
    ctx.fillStyle='rgba(0,0,0,'+(alpha*0.88)+')';ctx.fillRect(0,0,VW,VH);
    var nextFloor=this.floor+1;
    if(nextFloor>10)return;
    var th=THEMES[Math.min(nextFloor-1,THEMES.length-1)];
    ctx.globalAlpha=alpha;
    ctx.fillStyle='#ffdd44';ctx.font='bold 28px Courier New';ctx.textAlign='center';
    ctx.fillText('LANTAI '+nextFloor,VW/2,VH/2-18);
    ctx.fillStyle='#aaaacc';ctx.font='15px Courier New';
    ctx.fillText(th.name,VW/2,VH/2+12);
    ctx.globalAlpha=1;
  };
}
