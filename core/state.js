const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installStateMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.init = function(){
    this.state='play';
    this.tick=0;
    this.floor=1;
    this.score=0;
    this.kills=0;
    this.gold=0;
    this.shopShown=false;
    this.adminGiftUsed=false;
    this.adminSurpriseTick=0;
    this.adminSurpriseStep=0;
    this.adminReviveTimer=0;
    this.adminReviveMax=0;
    var adminOverlay=document.getElementById('admin-surprise-overlay');
    if(adminOverlay) adminOverlay.style.display='none';
    if(this.adminGiftAudio){
      this.adminGiftAudio.pause();
      this.adminGiftAudio.currentTime=0;
    }
    this.P={
      x:0,y:0,r:13,
      hp:100,maxHp:100,mp:60,maxMp:60,
      spd:2.8,def:3,
      xp:0,level:1,potions:3,
      lives:3, maxLives:5,
      reviving:0,
      facing:0,vx:0,vy:0,
      iframes:0,teleCD:0,
      dashTimer:0,dashCd:0,dashVx:0,dashVy:0,dashTrail:[],
      weaponIdx:0,atkFrame:0,atkDur:10,
    };
    this.ownedSkills=[];      // semua skill yang sudah dibeli
    this.activeSkill=null;   // id skill yang sedang di-equip
    this.skillCd=0;          // current cooldown ticks
    this.skillActive=false;  // skill effect in progress
    this.skillTimer=0;       // duration of active effect
    this.shadowDecoys=[];    // for shadow skill
    this._barrierOn=false;   // for barrier skill
    this._timeSlowOn=false;  // for time slow skill
    this._berserkerOn=false; // for berserker skill
    this._berserkerSpdOrig=0;
    this._lightningArcs=[];  // for chain lightning visual
    // Track which weapons are unlocked (index 0 = Pistol always unlocked)
    this.unlockedWeapons=[true,false,false,false,false,false];
    this.upgradeLevels={hp:0,mp:0,spd:0,def:0,dmg:0,dash:0};
    this.weapons = WEAPONS.map(function(w){return {id:w.id,name:w.name,color:w.color,projSpd:w.projSpd,projR:w.projR,projType:w.projType,dmgA:w.dmgA,dmgB:w.dmgB,cd:w.cd,mpCost:w.mpCost,ammo:w.ammo,maxAmmo:w.maxAmmo||0};});
    this.atkCd=0; this.potCd=0;
    this.loadFloor(0);
    this.selWeapon(0);
    this.updateWeaponBar();
  };
  G.loadFloor = function(idx){
    var L=FLOORS[idx];
    var self=this;
    this.walls=L.walls.map(function(w){return {x:w[0],y:w[1],w:w[2],h:w[3]};});
    this.traps=L.traps.map(function(t){return {x:t[0],y:t[1],r:20,on:true,timer:0};});
    this.mines=L.mines.map(function(m){return {x:m[0],y:m[1],r:14,on:true};});
    this.iceZones=L.ice.map(function(z){return {x:z[0],y:z[1],w:z[2],h:z[3]};});
    this.portals=L.portals.map(function(p){return {ax:p[0],ay:p[1],bx:p[2],by:p[3],r:20,pulse:0,cd:0};});
    this.stair={x:L.stair.x,y:L.stair.y,r:28};
    this.stairOpen=false;
    this.enemies=[];
    this.projs=[];
    this.enemyProjs=[];
    this.parts=[];
    this.explosions=[];
    this.P.x=L.spawn.x; this.P.y=L.spawn.y;
    this.P.vx=0; this.P.vy=0;
    cam.x=this.P.x-VW/2; cam.y=this.P.y-VH/2;
    cam.tx=cam.x; cam.ty=cam.y;
    this.spawnEnemies(L);
    this.updateHUD();
  };
  G.spawnEnemies = function(L){
    // BOSS FLOOR
    if(L.isBossFloor){
      this.spawnBoss();
      return;
    }
    var cnt = L.enemyCount + (this.floor-1)*2;
    var pts = [
      [WALL+30,WALL+30],[MW-WALL-30,WALL+30],[WALL+30,MH-WALL-30],[MW-WALL-30,MH-WALL-30],
      [MW/2,WALL+20],[MW/2,MH-WALL-20],[WALL+20,MH/2],[MW-WALL-20,MH/2],
      [MW/4,MH/4],[MW*3/4,MH/4],[MW/4,MH*3/4],[MW*3/4,MH*3/4],
    ];
    for(var i=0;i<cnt;i++){
      var pt=pts[i%pts.length];
      var ti=L.enemyTypes[Math.floor(Math.random()*L.enemyTypes.length)];
      var et=ET[Math.min(ti,ET.length-2)]; // exclude boss from random spawn
      var sc=1+(this.floor-1)*0.18;
      var ex=pt[0]+(Math.random()-0.5)*80, ey=pt[1]+(Math.random()-0.5)*80;
      for(var t=0;t<20&&isBlocked(ex,ey,et.r+4);t++){ex=pt[0]+(Math.random()-0.5)*120;ey=pt[1]+(Math.random()-0.5)*120;}
      this.enemies.push({
        x:ex,y:ey,r:et.r,
        hp:Math.round(et.hp*sc),maxHp:Math.round(et.hp*sc),
        atk:Math.round(et.atk*sc),spd:et.spd*(1+(this.floor-1)*0.04),
        color:et.color,name:et.name,xp:et.xp,
        iframes:0,atkTimer:0,teleCD:0,wobble:Math.random()*Math.PI*2,
        kvx:0,kvy:0,
        // Wraith (type 4) dan Dragon (type 5) punya dash ghost
        isDashGhost: !!(et.isDashGhostType),
        isSpecter: !!(et.isSpecter),
        isHunter: !!(et.isHunter),
        isBrute: !!(et.isBrute),
        isPhantom: !!(et.isPhantom),
        _ghostCd: 60+Math.floor(Math.random()*60),
        _ghostTimer:0,
      });
    }
  };
  G.spawnBoss = function(){
    var et=ET[6]; // VOIDLORD
    this.enemies.push({
      x:900, y:300, r:et.r,
      hp:et.hp, maxHp:et.hp,
      atk:et.atk, spd:et.spd,
      color:et.color, name:et.name, xp:et.xp,
      isBoss:true,
      iframes:0, atkTimer:0, teleCD:0, wobble:0,
      kvx:0, kvy:0,
      // Boss AI state
      phase: 1,
      aiMode: 'chase',
      aiTimer: 0,
      aiDecision: 0,
      strafeDir: 1,
      strafeDist: 180,
      lastPlayerX: 0, lastPlayerY: 0,
      predictX: 0, predictY: 0,
      bossProjs: [],
      summonCd: 0,
      barrageCd: 0,
      dashCd: 0,
      rageFlash: 0,
      teleportCd: 0,
      playerHitCount: 0,
      playerDodgeCount: 0,
      lastAtk: '',
      adaptTimer: 0,
      shieldHp: 0,
    });
    for(var i=0;i<30;i++){
      var a=i/30*Math.PI*2;
      this.parts.push({x:900+Math.cos(a)*80,y:300+Math.sin(a)*80,vx:Math.cos(a)*-1,vy:Math.sin(a)*-1,life:1,r:3,color:'#ff00ff',text:i===0?'BOSS!':null});
    }
  };
  G.selWeapon = function(idx){
    if(this.unlockedWeapons && !this.unlockedWeapons[idx]) return;
    this.P.weaponIdx=idx;
    document.querySelectorAll('.ws').forEach(function(el,i){
      el.classList.toggle('on',i===idx);
    });
    this.updateHUD();
  };
  G.updateWeaponBar = function(){
    var self=this;
    document.querySelectorAll('.ws').forEach(function(el,i){
      var unlocked = self.unlockedWeapons && self.unlockedWeapons[i];
      el.style.display = unlocked ? 'flex' : 'none';
      el.style.opacity = '1';
      el.title = '';
    });
  };
  G.doDash = function(){
    // Dash bawaan terpisah tidak ada; Spasi dipakai untuk mengaktifkan skill aktif.
    return;
  };
  G.update = function(){
    if(this.state==='over'||this.state==='win') return;
    if(this.state==='adminSurprise'){
      this.adminSurpriseTick=(this.adminSurpriseTick||0)+1;
      return;
    }
    if(this.state==='adminRevive'){
      this.tick++;
      if(this.adminReviveTimer>0) this.adminReviveTimer--;
      if(this.P){
        this.P.iframes=Math.max(this.P.iframes,60);
        this.P.reviving=Math.max(this.P.reviving||0,this.adminReviveTimer||0);
        camUpdate(this.P.x,this.P.y);
      }
      for(var arpi=this.parts.length-1;arpi>=0;arpi--){
        var arpt=this.parts[arpi];
        arpt.x+=arpt.vx;arpt.y+=arpt.vy;arpt.vy+=0.04;arpt.life-=0.014;
        if(arpt.life<=0)this.parts.splice(arpi,1);
      }
      if(this.adminReviveTimer%12===0){
        spawnParts(this.P.x,this.P.y,'#ffcc44',8,null);
        spawnParts(this.P.x,this.P.y,'#44ffcc',8,null);
      }
      if(this.adminReviveTimer<=0){
        this.state='play';
        this.P.reviving=0;
      }
      this.updateHUD();
      return;
    }
    if(this.state==='transition'){
      // Pause transition timer while shop is open
      if(this._shopOpen) return;
      this.transTimer--;
      if(this.transTimer<=0){
        this.state='play';
        this.floor++;
        var p=this.P;
        p.potions=Math.min(p.potions+1,6);
        p.mp=Math.min(p.maxMp,p.mp+20);
        this.loadFloor(this.floor-1);
      }
      return;
    }

    this.tick++;
    if(mouse.down&&this.atkCd===0) this.doAttack();

    var p=this.P;

    // Movement
    var mx=0,my=0;
    if(keys['a']||keys['A']||keys['ArrowLeft'])mx-=1;
    if(keys['d']||keys['D']||keys['ArrowRight'])mx+=1;
    if(keys['w']||keys['W']||keys['ArrowUp'])my-=1;
    if(keys['s']||keys['S']||keys['ArrowDown'])my+=1;
    if(mx&&my){mx*=0.707;my*=0.707;}

    var onIce=this.checkIce(p);
    if(onIce){p.iceTimer=20;}else{if(p.iceTimer>0)p.iceTimer--;}
    var fric=onIce?0.92:0.80;
    var spd2=p.spd*(onIce?1.3:1);
    if(mx||my){
      p.vx+=(mx*spd2-p.vx)*(onIce?0.06:0.35);
      p.vy+=(my*spd2-p.vy)*(onIce?0.06:0.35);
    } else {
      p.vx*=fric; p.vy*=fric;
      if(Math.abs(p.vx)<0.05)p.vx=0;
      if(Math.abs(p.vy)<0.05)p.vy=0;
    }
    var vm=Math.hypot(p.vx,p.vy), maxV=p.spd*(onIce?1.8:1);
    if(vm>maxV){p.vx=p.vx/vm*maxV;p.vy=p.vy/vm*maxV;}

    // Dash
    if(p.dashTimer>0){
      p.dashTimer--;
      p.vx=p.dashVx; p.vy=p.dashVy;
      p.dashTrail.unshift({x:p.x,y:p.y,a:1});
      if(p.dashTrail.length>6) p.dashTrail.pop();
    }
    for(var i=0;i<p.dashTrail.length;i++) p.dashTrail[i].a-=0.15;
    if(p.dashCd>0) p.dashCd--;

    p.x+=p.vx; p.y+=p.vy;
    resolveWalls(p);

    // Facing
    var tx=mouse.x+cam.x, ty=mouse.y+cam.y;
    var df=Math.atan2(ty-p.y,tx-p.x)-(p.facing||0);
    while(df>Math.PI)df-=Math.PI*2;
    while(df<-Math.PI)df+=Math.PI*2;
    p.facing=(p.facing||0)+df*0.2;

    // Cooldowns
    if(this.atkCd>0)this.atkCd--;
    if(this.potCd>0)this.potCd--;
    if(p.iframes>0)p.iframes--;
    if(p.teleCD>0)p.teleCD--;
    if(p.atkFrame<p.atkDur)p.atkFrame++;
    if(this.tick%80===0&&p.mp<p.maxMp)p.mp=Math.min(p.maxMp,p.mp+4);

    this.checkTraps(p,true);
    this.checkMines(p,true);
    this.checkPortals(p);

    // Stair check
    if(this.stairOpen){
      var sd=Math.hypot(p.x-this.stair.x,p.y-this.stair.y);
      if(sd<this.stair.r+p.r){
        if(this.floor>=10){this.state='win';return;}
        this.state='transition'; this.transTimer=90;
        spawnParts(p.x,p.y,'#ffcc44',20,'LANTAI '+(this.floor+1)+'!');
        // Show shop before transition
        this.openShop();
      }
    }

    // Enemies
    for(var i=this.enemies.length-1;i>=0;i--){
      var e=this.enemies[i];

      // ── BOSS AI ──
      if(e.isBoss){
        this.updateBossAI(e, p);
        // Boss projectile update
        for(var bi=e.bossProjs.length-1;bi>=0;bi--){
          var bp=e.bossProjs[bi];
          bp.x+=bp.vx; bp.y+=bp.vy; bp.life--;
          if(bp.homing && bp.life>0){
            var hdx=p.x-bp.x, hdy=p.y-bp.y, hl=Math.hypot(hdx,hdy)||1;
            bp.vx+=(hdx/hl*bp.homingStr||0); bp.vy+=(hdy/hl*bp.homingStr||0);
            var spd=Math.hypot(bp.vx,bp.vy); if(spd>bp.maxSpd){bp.vx=bp.vx/spd*bp.maxSpd;bp.vy=bp.vy/spd*bp.maxSpd;}
          }
          var wallHit=bp.x<WALL||bp.x>MW-WALL||bp.y<WALL||bp.y>MH-WALL;
          if(!wallHit){for(var j=0;j<this.walls.length;j++){if(circleRect(bp.x,bp.y,bp.r,this.walls[j].x,this.walls[j].y,this.walls[j].w,this.walls[j].h)){wallHit=true;break;}}}
          if(bp.life<=0||wallHit){
            if(bp.isExplosive){this.explosions.push({x:bp.x,y:bp.y,r:0,maxR:80,life:1});spawnParts(bp.x,bp.y,'#ff00ff',12,'BOOM!');}
            e.bossProjs.splice(bi,1); continue;
          }
          if(p.iframes===0&&!this._barrierOn&&Math.hypot(bp.x-p.x,bp.y-p.y)<bp.r+p.r){
            var dmg2=Math.max(1,bp.dmg-p.def);
            p.hp-=dmg2; p.iframes=35;
            spawnParts(p.x,p.y,'#ff00ff',6,'-'+dmg2);
            e.bossProjs.splice(bi,1);
            if(!this.handlePlayerDeath()) return;
          }
        }
        // Boss melee attack
        var distToPlayer=Math.hypot(p.x-e.x,p.y-e.y);
        if(distToPlayer<p.r+e.r+4&&e.atkTimer<=0&&p.iframes===0&&!this._barrierOn){
          var meleeMul=e.enrage50?3.2:1;
          var dmg=Math.max(1,Math.round(e.atk*meleeMul)-p.def);
          p.hp-=dmg; p.iframes=e.enrage50?45:30; e.atkTimer=e.enrage50?28:50;
          spawnParts(p.x,p.y,'#ff0066',6,'-'+dmg);
          if(e.enrage50) spawnParts(p.x,p.y,'#ff3300',10,'CRUSH!');
          e.playerHitCount=(e.playerHitCount||0)+1;
          if(!this.handlePlayerDeath()) return;
        }
        if(e.atkTimer>0)e.atkTimer--;
        if(e.iframes>0)e.iframes--;
        if(e.rageFlash>0)e.rageFlash--;
        e.wobble=(e.wobble||0)+0.04;
        if(e.hp<=0){
          // Boss death
          this.playMonsterDeathSound();
          spawnParts(e.x,e.y,'#ff00ff',50,'BOSS MATI!');
          spawnParts(e.x,e.y,'#ffcc44',40,'MENANG!');
          for(var bi=0;bi<20;bi++) this.explosions.push({x:e.x+(Math.random()-0.5)*150,y:e.y+(Math.random()-0.5)*150,r:0,maxR:60+Math.random()*60,life:1});
          this.score+=e.xp*10; this.kills++; p.xp+=e.xp;
          this.enemies.splice(i,1);
        }
        continue; // skip normal AI for boss
      }

      // ── NORMAL ENEMY AI ──
      e.kvx=(e.kvx||0)*0.78; e.kvy=(e.kvy||0)*0.78;

      // Shadow Decoy: enemies chase decoys instead of player
      var target_x=p.x, target_y=p.y;
      if(this.activeSkill==='shadow' && this.skillActive && this.shadowDecoys.length>0){
        var myDecoy=this.shadowDecoys[i%this.shadowDecoys.length];
        target_x=myDecoy.x; target_y=myDecoy.y;
      }

      var dx=target_x-e.x, dy=target_y-e.y, dist=Math.hypot(dx,dy);
      var eSpd=e.spd*(this._timeSlowOn?0.3:1);

      // ── Assign AI personality once ──
      if(!e._aiType){
        // Slime=0→stalker, Goblin=1→flanker, Skull=2→sniper, Orc=3→berserker, Wraith=4/Dragon=5→ghost
        var nameBase=e.name.replace('SUMMON:','');
        if(nameBase==='Slime')      e._aiType='stalker';
        else if(nameBase==='Goblin')e._aiType='flanker';
        else if(nameBase==='Skull') e._aiType='sniper';
        else if(nameBase==='Orc')   e._aiType='berserker';
        else if(nameBase==='Hunter')e._aiType='hunter';
        else if(nameBase==='Brute') e._aiType='brute';
        else                        e._aiType='chaser';
        e._aiTimer=0;
        e._flankDir=(Math.random()>0.5?1:-1);
        e._steerAngle=0;
        e._stuckTimer=0;
        e._lastX=e.x; e._lastY=e.y;
        e._stuckCheck=0;
        e._shootCd=0;
      }

      if(!e.isDashGhost){
        var probeLen = e.r*3 + eSpd*8;
        var baseAngle = Math.atan2(dy, dx);
        var dirX = dist>0 ? dx/dist : 0;
        var dirY = dist>0 ? dy/dist : 0;

        // ── Stuck detection: if barely moved in 30 ticks, force escape ──
        e._stuckCheck=(e._stuckCheck||0)+1;
        if(e._stuckCheck>=30){
          var movedDist=Math.hypot(e.x-(e._lastX||e.x), e.y-(e._lastY||e.y));
          if(movedDist < eSpd*4){
            e._stuckTimer=50; // force escape mode
          }
          e._lastX=e.x; e._lastY=e.y;
          e._stuckCheck=0;
        }

        // ── Force escape if stuck ──
        if((e._stuckTimer||0) > 0){
          e._stuckTimer--;
          if(!e._escAngle) e._escAngle=Math.random()*Math.PI*2;
          // Gradually rotate escape angle toward player when unstuck
          var escToPlayer=Math.atan2(dy,dx);
          var diff=escToPlayer-e._escAngle;
          while(diff>Math.PI) diff-=Math.PI*2;
          while(diff<-Math.PI) diff+=Math.PI*2;
          e._escAngle += diff*0.06;
          dirX=Math.cos(e._escAngle); dirY=Math.sin(e._escAngle);
          e.x+=dirX*eSpd*1.3; e.y+=dirY*eSpd*1.3;
        } else {
          e._escAngle=null;

          // ── Multi-probe wall avoidance: fan of 24 rays with 3-step look-ahead ──
          var probeX = e.x + dirX*probeLen;
          var probeY = e.y + dirY*probeLen;
          var wallAhead = isBlocked(probeX, probeY, e.r*0.8);

          if(wallAhead){
            // Smart steering: test 24 angles, score by closeness to player AND openness + look-ahead
            var bestScore=-Infinity, bestDirX=dirX, bestDirY=dirY;
            var steps=24;
            for(var sa=1;sa<=steps/2;sa++){
              var sides=[sa/steps*Math.PI*2, -sa/steps*Math.PI*2];
              for(var ss=0;ss<sides.length;ss++){
                var testA=baseAngle+sides[ss];
                var tX=e.x+Math.cos(testA)*probeLen;
                var tY=e.y+Math.sin(testA)*probeLen;
                if(!isBlocked(tX,tY,e.r*0.8)){
                  // 3-step look-ahead: check if path continues to open
                  var tX2=e.x+Math.cos(testA)*probeLen*2;
                  var tY2=e.y+Math.sin(testA)*probeLen*2;
                  var tX3=e.x+Math.cos(testA)*probeLen*3.5;
                  var tY3=e.y+Math.sin(testA)*probeLen*3.5;
                  var open2=!isBlocked(tX2,tY2,e.r*0.7);
                  var open3=!isBlocked(tX3,tY3,e.r*0.6);
                  var openScore=(open2?0.5:0.15)+(open3?0.5:0.0);
                  // Bonus: how close does this path get to target?
                  var pathEndDist=Math.hypot(tX2-target_x, tY2-target_y);
                  var targetScore=Math.max(0, 1-pathEndDist/(dist+1));
                  // Score: prefer angles closer to target direction + path openness
                  var angScore=Math.cos(sides[ss]);
                  var score=openScore*(0.4+0.3*angScore)+targetScore*0.3;
                  if(score>bestScore){ bestScore=score; bestDirX=Math.cos(testA); bestDirY=Math.sin(testA); }
                }
              }
            }
            dirX=bestDirX; dirY=bestDirY;
            e._steerAngle = Math.atan2(bestDirY,bestDirX)-baseAngle;
          } else {
            e._steerAngle=0;
          }

          // ── AI TYPE BEHAVIOUR ──
          e._aiTimer=(e._aiTimer||0)+1;

          if(e._aiType==='stalker'){
            // Approaches carefully, keeps medium range, then lunges
            if(!e._stalkerMode) e._stalkerMode='approach';
            if(dist<160 && e._stalkerMode==='approach' && (e._aiTimer%80<40)){
              e._stalkerMode='circle';
            } else if(dist>220){ e._stalkerMode='approach'; }
            if(e._stalkerMode==='circle'){
              var circAng=Math.atan2(e.y-target_y, e.x-target_x);
              var tangAng=circAng+Math.PI/2*e._flankDir;
              // Drift toward target dist of 150
              var radial=(dist-150)/150;
              dirX=Math.cos(tangAng)*0.9 - (e.x-target_x)/dist*radial*0.4;
              dirY=Math.sin(tangAng)*0.9 - (e.y-target_y)/dist*radial*0.4;
              var dl2=Math.hypot(dirX,dirY)||1; dirX/=dl2; dirY/=dl2;
            } else if(e._stalkerMode==='lunge'){
              eSpd*=2.2; // fast lunge
              if(dist<e.r+p.r+10 || e._aiTimer%60===0) e._stalkerMode='approach';
            }
            // Every 5s switch flank dir
            if(e._aiTimer%300===0) e._flankDir*=-1;

          } else if(e._aiType==='flanker'){
            // Tries to get to player's side, then rushes
            if(dist>300){
              // Flank offset: aim to a point 90deg to player's side
              var flankA=Math.atan2(target_y-e.y, target_x-e.x)+Math.PI/2*e._flankDir;
              var targetOffX=target_x+Math.cos(flankA)*80;
              var targetOffY=target_y+Math.sin(flankA)*80;
              var fdx=targetOffX-e.x, fdy=targetOffY-e.y, fl=Math.hypot(fdx,fdy)||1;
              var newA=Math.atan2(fdy,fdx);
              var probeX2=e.x+Math.cos(newA)*probeLen; var probeY2=e.y+Math.sin(newA)*probeLen;
              if(!isBlocked(probeX2,probeY2,e.r*0.8)){ dirX=fdx/fl; dirY=fdy/fl; }
            } else {
              // Close: sprint directly with speed burst
              eSpd*=1.35;
            }
            if(e._aiTimer%200===0) e._flankDir*=-1;

          } else if(e._aiType==='sniper'){
            // Stays at range ~250, moves to LOS, then halts to shoot (visual: flickers)
            if(!e._shootCd) e._shootCd=0;
            if(e._shootCd>0) e._shootCd--;
            var keepDist=240;
            if(dist<keepDist-40){
              // Too close: back away
              dirX=-dx/dist; dirY=-dy/dist;
              eSpd*=0.9;
            } else if(dist>keepDist+60){
              // Approach to range
              eSpd*=1.1;
            } else {
              // At range: stand and "shoot" (deal damage at distance every 90 ticks if LOS clear)
              eSpd*=0.2; // slow drift
              if(e._shootCd<=0 && p.iframes===0 && !this._barrierOn){
                // Line-of-sight check: sample 5 points along line
                var los=true;
                for(var lc=1;lc<=4;lc++){
                  var lx=e.x+dx/dist*(dist*lc/5), ly=e.y+dy/dist*(dist*lc/5);
                  if(isBlocked(lx,ly,6)){ los=false; break; }
                }
                if(los){
                  var sniperDmg=Math.max(1,e.atk-p.def);
                  e._shootCd=90;
                  // Spawn visible sniper projectile (fast, thin)
                  var sa2=Math.atan2(dy,dx);
                  spawnParts(e.x,e.y,'#ccccdd',4,null);
                  this.enemyProjs.push({
                    x:e.x, y:e.y,
                    vx:Math.cos(sa2)*14, vy:Math.sin(sa2)*14,
                    r:4, dmg:sniperDmg, life:80, maxLife:80,
                    color:'#ccccdd', glowColor:'rgba(200,220,255,0.5)',
                    isSniper:true, fromEnemy:true
                  });
                }
              }
            }

          } else if(e._aiType==='berserker'){
            // Slow but relentless; after taking hit, enrages and charges fast
            if((e.iframes>0) && !e._enraged){
              e._enraged=true; e._enrageTimer=120;
              spawnParts(e.x,e.y,'#ff6600',6,'GERAM!');
            }
            if(e._enrageTimer>0){ e._enrageTimer--; eSpd*=2.5; }
            else { e._enraged=false; }
            // Orc also does a heavy knockback when reaching player
            if(dist<e.r+p.r+4 && e.atkTimer<=0){
              var pushA=Math.atan2(p.y-e.y,p.x-e.x);
              p.vx+= Math.cos(pushA)*8; p.vy+=Math.sin(pushA)*8;
            }

          } else if(e._aiType==='hunter'){
            // ── HUNTER: Tahu posisi player, berputar cerdas, tembak dari jarak sedang ──
            if(e._shootCd>0) e._shootCd--;
            var huntDist=200;
            // Check LOS first
            var hunterLos=true;
            for(var hlc=1;hlc<=5;hlc++){
              var hlx=e.x+dx/dist*(dist*hlc/6), hly=e.y+dy/dist*(dist*hlc/6);
              if(isBlocked(hlx,hly,6)){hunterLos=false;break;}
            }
            if(!hunterLos){
              // No LOS: navigate to find it — try to go around walls smarter
              // Pick the direction from our fan that moves toward a clear LOS point
              if(!e._hunterSeekAngle) e._hunterSeekAngle=baseAngle+e._flankDir*Math.PI*0.4;
              // Slowly sweep angle toward player
              var saDiff=baseAngle-e._hunterSeekAngle;
              while(saDiff>Math.PI) saDiff-=Math.PI*2;
              while(saDiff<-Math.PI) saDiff+=Math.PI*2;
              e._hunterSeekAngle+=saDiff*0.04+e._flankDir*0.05;
              var hsX=Math.cos(e._hunterSeekAngle), hsY=Math.sin(e._hunterSeekAngle);
              if(!isBlocked(e.x+hsX*probeLen, e.y+hsY*probeLen, e.r*0.8)){
                dirX=hsX; dirY=hsY;
              }
              eSpd*=1.1;
            } else {
              e._hunterSeekAngle=null;
              if(dist<huntDist-30){
                // Strafe sideways to maintain distance
                var haAng=Math.atan2(e.y-target_y,e.x-target_x);
                var htAng=haAng+Math.PI/2*e._flankDir;
                dirX=Math.cos(htAng)*0.8 - dx/dist*0.3;
                dirY=Math.sin(htAng)*0.8 - dy/dist*0.3;
                var hdl=Math.hypot(dirX,dirY)||1; dirX/=hdl; dirY/=hdl;
              } else if(dist>huntDist+50){
                eSpd*=1.15;
              } else {
                eSpd*=0.25; // hover in place while shooting
              }
              // Shoot when in range with LOS — spawn visible projectile
              if(e._shootCd<=0 && dist<huntDist+80){
                // Predict player position
                var huntPredX=target_x+(p.vx||0)*12, huntPredY=target_y+(p.vy||0)*12;
                var hpa=Math.atan2(huntPredY-e.y, huntPredX-e.x);
                var hdmg=Math.max(1,e.atk-p.def);
                // Muzzle flash
                spawnParts(e.x,e.y,'#ff8c00',5,null);
                // Spawn visible enemy projectile
                this.enemyProjs.push({
                  x:e.x, y:e.y,
                  vx:Math.cos(hpa)*8, vy:Math.sin(hpa)*8,
                  r:5, dmg:hdmg, life:100, maxLife:100,
                  color:'#ff8c00', glowColor:'rgba(255,140,0,0.5)',
                  fromEnemy:true
                });
                e._shootCd=70;
              }
            }
            if(e._aiTimer%240===0) e._flankDir*=-1;

          } else if(e._aiType==='brute'){
            // ── BRUTE: Tanky, sangat cerdas navigasi, terus menekan player ──
            // Brute uses wall-memory: remembers when it was near a wall corner and picks a detour
            if(!e._brutePatience) e._brutePatience=0;
            e._brutePatience=Math.max(0,e._brutePatience-1);
            // After hitting wall, pick the direction that made the most progress last time
            if(e._brutePatience>0 && e._bruteDetourAngle!=null){
              var bdX=Math.cos(e._bruteDetourAngle), bdY=Math.sin(e._bruteDetourAngle);
              if(!isBlocked(e.x+bdX*probeLen,e.y+bdY*probeLen,e.r)){
                dirX=bdX; dirY=bdY;
                eSpd*=1.2;
              }
            } else if(wallAhead){
              // Find the best detour and commit to it for 40 ticks
              e._bruteDetourAngle=Math.atan2(bestDirY,bestDirX);
              e._brutePatience=40;
            }
            // Brute charges last 100 units
            if(dist<100) eSpd*=1.5;
          } else {
            // chaser: straight line, wall-avoidance handled above
          }

          e.x += dirX*eSpd;
          e.y += dirY*eSpd;
        }

      } else {
        // ── DASH GHOST (Wraith / Dragon / Specter / Phantom): smart predictive ghost dash ──
        e._ghostCd = (e._ghostCd||0)-1;
        e._ghostTimer = (e._ghostTimer||0)-1;
        var ghostActive = e._ghostTimer > 0;

        // ── Phantom: rapid multi-dash wall-piercer ──
        if(e.isPhantom){
          // Phantom has shorter cooldown and dashes more aggressively
          // Also uses "blink-chain": can chain 2-3 dashes in quick succession
          if(!e._phantomCharges) e._phantomCharges = 2;
          if(!e._phantomChargeCd) e._phantomChargeCd = 0;
          e._phantomChargeCd = Math.max(0,(e._phantomChargeCd||0)-1);

          if(!ghostActive){
            // Normal movement: fast and twitchy
            var probeLP = e.r*2 + eSpd*5;
            var bAP=Math.atan2(dy,dx);
            var dXP=dist>0?dx/dist:0, dYP=dist>0?dy/dist:0;
            if(isBlocked(e.x+dXP*probeLP, e.y+dYP*probeLP, e.r*0.8)){
              for(var sp2=1;sp2<=8;sp2++){
                var offP=[sp2/8*Math.PI*1.5, -sp2/8*Math.PI*1.5];
                for(var osp=0;osp<offP.length;osp++){
                  var tAP=bAP+offP[osp];
                  if(!isBlocked(e.x+Math.cos(tAP)*probeLP, e.y+Math.sin(tAP)*probeLP, e.r*0.8)){
                    dXP=Math.cos(tAP); dYP=Math.sin(tAP); break;
                  }
                }
                if(dXP!=(dist>0?dx/dist:0)) break;
              }
            }
            // Add erratic sidestep movement
            if(e._aiTimer%60<20 && dist < 300){
              var sideA=bAP+Math.PI/2*(e._flankDir||1);
              dXP=dXP*0.6+Math.cos(sideA)*0.4;
              dYP=dYP*0.6+Math.sin(sideA)*0.4;
              var dpl=Math.hypot(dXP,dYP)||1; dXP/=dpl; dYP/=dpl;
            }
            e.x+=dXP*eSpd; e.y+=dYP*eSpd;
          }

          // Phantom decides to dash: shorter range trigger, shorter cooldown
          var phantomCdBase = e._phantomCharges>0 ? 60 : 220;
          if(!ghostActive && e._ghostCd<=0 && dist < 700 && e._phantomChargeCd<=0){
            // Always aim slightly ahead of player
            var leadAmt = dist>200 ? 25 : 15;
            var predXP = target_x + (p.vx||0)*leadAmt;
            var predYP = target_y + (p.vy||0)*leadAmt;
            var pdxP=predXP-e.x, pdyP=predYP-e.y, pdistP=Math.hypot(pdxP,pdyP)||1;
            e._ghostTimer = 20; // shorter dash = more frequent
            e._ghostCd = phantomCdBase + Math.floor(Math.random()*60);
            e._ghostDirX = pdxP/pdistP;
            e._ghostDirY = pdyP/pdistP;
            if(e._phantomCharges>0){ e._phantomCharges--; e._phantomChargeCd=30; } // quick chain
            else { e._phantomCharges=2; } // recharge
            // Vibrant flash
            for(var gp2=0;gp2<14;gp2++){
              var ga2=Math.random()*Math.PI*2;
              G.parts.push({x:e.x+Math.cos(ga2)*e.r,y:e.y+Math.sin(ga2)*e.r,vx:Math.cos(ga2)*2.5,vy:Math.sin(ga2)*2.5-0.8,life:0.6,r:3.5,color:e.color,text:gp2===0?'DASH!':null});
            }
          }

          if(ghostActive){
            // Phantom dashes faster and leaves more vivid trail
            e.x += (e._ghostDirX||0) * eSpd * 4.5;
            e.y += (e._ghostDirY||0) * eSpd * 4.5;
            if(this.tick%2===0) G.parts.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*1,vy:(Math.random()-0.5)*1-0.5,life:0.55,r:e.r*0.7,color:e.color,text:null});
          }

        } else if(e.isSpecter){
          // ── Specter: aggressive wall-phasing, frequently dashes, uses flanking approach ──
          if(!ghostActive){
            var probeLS = e.r*3 + eSpd*6;
            var bAS=Math.atan2(dy,dx);
            var dXS=dist>0?dx/dist:0, dYS=dist>0?dy/dist:0;
            if(isBlocked(e.x+dXS*probeLS, e.y+dYS*probeLS, e.r*0.8)){
              for(var sas=1;sas<=10;sas++){
                var offS=[sas/10*Math.PI*1.6, -sas/10*Math.PI*1.6];
                for(var oss=0;oss<offS.length;oss++){
                  var tAS=bAS+offS[oss];
                  if(!isBlocked(e.x+Math.cos(tAS)*probeLS, e.y+Math.sin(tAS)*probeLS, e.r*0.8)){
                    dXS=Math.cos(tAS); dYS=Math.sin(tAS); break;
                  }
                }
                if(dXS!=(dist>0?dx/dist:0)) break;
              }
            }
            // Specter flanks: tries to get to side of player
            if(dist > 150 && dist < 400 && e._aiTimer%120 < 60){
              var specFlankA=bAS + Math.PI/2*(e._flankDir||1)*0.7;
              dXS = dXS*0.5 + Math.cos(specFlankA)*0.5;
              dYS = dYS*0.5 + Math.sin(specFlankA)*0.5;
              var sdl=Math.hypot(dXS,dYS)||1; dXS/=sdl; dYS/=sdl;
            }
            e.x+=dXS*eSpd; e.y+=dYS*eSpd;
          }

          // Specter dashes more often and from further range
          if(!ghostActive && e._ghostCd<=0 && dist < 700){
            // Predict player movement better
            var leadS = dist > 250 ? 30 : 18;
            var predXS = target_x + (p.vx||0)*leadS;
            var predYS = target_y + (p.vy||0)*leadS;
            var pdxS=predXS-e.x, pdyS=predYS-e.y, pdistS=Math.hypot(pdxS,pdyS)||1;
            e._ghostTimer = 40;
            e._ghostCd = 100 + Math.floor(Math.random()*80); // ~1.7-3s CD (was 2.5-4.2s)
            e._ghostDirX = pdxS/pdistS;
            e._ghostDirY = pdyS/pdistS;
            if(e._aiTimer%240===0) e._flankDir=(e._flankDir||1)*-1; // flip flank dir occasionally
            for(var gps=0;gps<12;gps++){
              var gas=Math.random()*Math.PI*2;
              G.parts.push({x:e.x+Math.cos(gas)*e.r,y:e.y+Math.sin(gas)*e.r,vx:Math.cos(gas)*2,vy:Math.sin(gas)*2-0.7,life:0.7,r:3,color:e.color,text:gps===0?'PHASE!':null});
            }
          }

          if(ghostActive){
            e.x += (e._ghostDirX||0) * eSpd * 3.5;
            e.y += (e._ghostDirY||0) * eSpd * 3.5;
            if(this.tick%3===0) G.parts.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*0.6,vy:(Math.random()-0.5)*0.6-0.3,life:0.55,r:e.r*0.65,color:e.color,text:null});
          }

        } else {
          // ── Regular Wraith / Dragon: original ghost dash logic (slightly improved) ──
          if(!ghostActive){
            var probeLen2 = e.r*3 + eSpd*6;
            var bA2=Math.atan2(dy,dx);
            var dX2=dist>0?dx/dist:0, dY2=dist>0?dy/dist:0;
            if(isBlocked(e.x+dX2*probeLen2, e.y+dY2*probeLen2, e.r*0.8)){
              var bScore2=-Infinity;
              for(var sa2=1;sa2<=8;sa2++){
                var offs2=[sa2/8*Math.PI*1.5, -sa2/8*Math.PI*1.5];
                for(var os2=0;os2<offs2.length;os2++){
                  var tA2=bA2+offs2[os2];
                  if(!isBlocked(e.x+Math.cos(tA2)*probeLen2, e.y+Math.sin(tA2)*probeLen2, e.r*0.8)){
                    var sc2=Math.cos(offs2[os2]);
                    if(sc2>bScore2){ bScore2=sc2; dX2=Math.cos(tA2); dY2=Math.sin(tA2); }
                  }
                }
              }
            }
            e.x+=dX2*eSpd; e.y+=dY2*eSpd;
          }

          if(!ghostActive && e._ghostCd<=0 && dist < 600){
            var predX = target_x + (p.vx||0)*20;
            var predY = target_y + (p.vy||0)*20;
            var pdx=predX-e.x, pdy=predY-e.y, pdist=Math.hypot(pdx,pdy)||1;
            e._ghostTimer = 35;
            e._ghostCd = 150 + Math.floor(Math.random()*100);
            e._ghostDirX = pdx/pdist;
            e._ghostDirY = pdy/pdist;
            for(var gp=0;gp<10;gp++){
              var ga=Math.random()*Math.PI*2;
              G.parts.push({x:e.x+Math.cos(ga)*e.r,y:e.y+Math.sin(ga)*e.r,vx:Math.cos(ga)*1.5,vy:Math.sin(ga)*1.5-0.5,life:0.8,r:3,color:e.color,text:gp===0?'GHOST!':null});
            }
          }

          if(ghostActive){
            e.x += (e._ghostDirX||0) * eSpd * 3.0;
            e.y += (e._ghostDirY||0) * eSpd * 3.0;
            if(this.tick%4===0) G.parts.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5-0.3,life:0.5,r:e.r*0.6,color:e.color,text:null});
          }
        }
      }

      e.x+=e.kvx; e.y+=e.kvy;
      if(!(e.isDashGhost && (e._ghostTimer||0)>0)) resolveWalls(e);

      // If chasing a decoy and reaches it, destroy that decoy
      if(this.activeSkill==='shadow' && this.skillActive && this.shadowDecoys.length>0){
        var myDecoyIdx=i%this.shadowDecoys.length;
        var myDecoy2=this.shadowDecoys[myDecoyIdx];
        if(Math.hypot(e.x-myDecoy2.x,e.y-myDecoy2.y)<e.r+16){
          spawnParts(myDecoy2.x,myDecoy2.y,'#aa66ff',8,'DECOY!');
          this.shadowDecoys.splice(myDecoyIdx,1);
        }
      }

      // enemy-enemy push
      for(var j=0;j<this.enemies.length;j++){
        if(j===i)continue;
        var e2=this.enemies[j];
        var ex=e.x-e2.x,ey=e.y-e2.y,ed=Math.hypot(ex,ey);
        if(ed<e.r+e2.r+2&&ed>0){var push=(e.r+e2.r+2-ed)/2;e.x+=ex/ed*push;e.y+=ey/ed*push;}
      }
      e.wobble=(e.wobble||0)+0.05;
      if(e.iframes>0)e.iframes--;
      if(e.teleCD>0)e.teleCD--;
      this.checkTraps(e,false);
      this.checkMines(e,false);
      this.checkPortals(e);
      // attack player
      var distToPlayer=Math.hypot(p.x-e.x,p.y-e.y);
      if(distToPlayer<p.r+e.r+2&&e.atkTimer<=0&&p.iframes===0){
        var dmg=Math.max(1,e.atk-p.def);
        p.hp-=dmg; p.iframes=30; e.atkTimer=40;
        spawnParts(p.x,p.y,'#ff4444',5,'-'+dmg);
        if(!this.handlePlayerDeath()) return;
      }
      if(e.atkTimer>0)e.atkTimer--;
      // die
      if(e.hp<=0){
        this.playMonsterDeathSound();
        var goldReward = Math.round(e.xp * 0.8 + this.floor * 3 + Math.random()*10);
        this.gold += goldReward;
        spawnParts(e.x,e.y,'#ffd700',6,'+'+goldReward+'G');
        spawnParts(e.x,e.y,e.color,10,'+'+e.xp+'xp');
        this.score+=e.xp*this.floor; this.kills++; p.xp+=e.xp;
        this.handleLevelUp(p);
        this.enemies.splice(i,1);
      }
    }

    // Unlock stair
    if(!this.stairOpen&&this.enemies.length===0){
      this.stairOpen=true;
      spawnParts(this.stair.x,this.stair.y,'#ffcc44',20,'TANGGA TERBUKA!');
    }

    // Projectiles
    for(var i=this.projs.length-1;i>=0;i--){
      var pr=this.projs[i];
      // Orb seeking
      if(pr.type==='orb'&&this.enemies.length>0){
        var cl=this.enemies[0];
        for(var j=1;j<this.enemies.length;j++){if(Math.hypot(this.enemies[j].x-pr.x,this.enemies[j].y-pr.y)<Math.hypot(cl.x-pr.x,cl.y-pr.y))cl=this.enemies[j];}
        var dx2=cl.x-pr.x,dy2=cl.y-pr.y,dl=Math.hypot(dx2,dy2)||1;
        pr.vx+=dx2/dl*0.28;pr.vy+=dy2/dl*0.28;
        var ps=Math.hypot(pr.vx,pr.vy);if(ps>9){pr.vx=pr.vx/ps*9;pr.vy=pr.vy/ps*9;}
      }
      pr.x+=pr.vx;pr.y+=pr.vy;pr.life--;
      pr.angle=Math.atan2(pr.vy,pr.vx);
      var wallHit=pr.x<WALL||pr.x>MW-WALL||pr.y<WALL||pr.y>MH-WALL;
      if(!wallHit){for(var j=0;j<this.walls.length;j++){if(circleRect(pr.x,pr.y,pr.r,this.walls[j].x,this.walls[j].y,this.walls[j].w,this.walls[j].h)){wallHit=true;break;}}}
      if(pr.type==='bomb'&&(pr.life<=0||wallHit)){
        this.explosions.push({x:pr.x,y:pr.y,r:0,maxR:80,life:1});
        spawnParts(pr.x,pr.y,'#ff8800',14,'BOOM!');
        for(var j=0;j<this.enemies.length;j++){var e=this.enemies[j];if(Math.hypot(e.x-pr.x,e.y-pr.y)<80+e.r){var fd=1-Math.hypot(e.x-pr.x,e.y-pr.y)/(80+e.r);var bombDmg=this.applyEnemyDefense(e,Math.round(pr.dmg*fd));e.hp-=bombDmg;e.iframes=20;spawnParts(e.x,e.y,'#ff6633',5,'-'+bombDmg);if(e.isBoss&&e.enrage50)spawnParts(e.x,e.y,'#aaaaff',3,'ARMOR');}}
        this.projs.splice(i,1);continue;
      }
      if(pr.life<=0||wallHit){this.projs.splice(i,1);continue;}
      var phit=false;
      for(var j=this.enemies.length-1;j>=0;j--){
        var e=this.enemies[j];
        if(Math.hypot(pr.x-e.x,pr.y-e.y)<pr.r+e.r){
          var actualDmg=pr.dmg;
          // Boss shield absorbs damage
          if(e.isBoss && e.shieldHp>0){
            var shieldAbsorb=Math.min(e.shieldHp,actualDmg);
            e.shieldHp-=shieldAbsorb;
            actualDmg-=shieldAbsorb;
            spawnParts(e.x,e.y,'#aaaaff',3,shieldAbsorb>0?'SHIELD':null);
          }
          if(actualDmg>0){
            actualDmg=this.applyEnemyDefense(e,actualDmg);
            e.hp-=actualDmg; e.iframes=20;
            spawnParts(e.x,e.y,pr.color,6,'-'+actualDmg);
            if(e.isBoss&&e.enrage50)spawnParts(e.x,e.y,'#aaaaff',3,'ARMOR');
            this.score+=Math.round(actualDmg*0.5);
            e.kvx=(e.x-pr.x)/(Math.hypot(e.x-pr.x,e.y-pr.y)||1)*4;
            e.kvy=(e.y-pr.y)/(Math.hypot(e.x-pr.x,e.y-pr.y)||1)*4;
          }
          if(pr.type==='sniper'){pr.dmg=Math.round(pr.dmg*0.6);continue;}
          phit=true;break;
        }
      }
      if(phit)this.projs.splice(i,1);
    }

    // Enemy Projectiles (visible, dodgeable)
    for(var i=this.enemyProjs.length-1;i>=0;i--){
      var ep=this.enemyProjs[i];
      ep.x+=ep.vx; ep.y+=ep.vy; ep.life--;
      // Wall check
      var epWallHit=ep.x<WALL||ep.x>MW-WALL||ep.y<WALL||ep.y>MH-WALL;
      if(!epWallHit){for(var j=0;j<this.walls.length;j++){if(circleRect(ep.x,ep.y,ep.r,this.walls[j].x,this.walls[j].y,this.walls[j].w,this.walls[j].h)){epWallHit=true;break;}}}
      if(ep.life<=0||epWallHit){
        spawnParts(ep.x,ep.y,ep.color,3,null);
        this.enemyProjs.splice(i,1); continue;
      }
      // Hit player
      if(p.iframes===0 && !this._barrierOn && Math.hypot(ep.x-p.x,ep.y-p.y)<ep.r+p.r){
        var epDmg=ep.dmg;
        p.hp-=epDmg; p.iframes=30;
        spawnParts(p.x,p.y,ep.color,6,'-'+epDmg);
        this.enemyProjs.splice(i,1);
        if(!this.handlePlayerDeath()) return;
      }
    }

    // Particles
    for(var i=this.parts.length-1;i>=0;i--){
      var pt=this.parts[i];
      pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.07;pt.life-=0.022;
      if(pt.life<=0)this.parts.splice(i,1);
    }

    // Portals cd
    for(var i=0;i<this.portals.length;i++) if(this.portals[i].cd>0)this.portals[i].cd--;

    // ── SKILL UPDATE ──
    if(this.skillCd>0) this.skillCd--;
    if(this.skillActive && this.skillTimer>0){
      this.skillTimer--;
      // Shadow decoys: move & update
      if(this.activeSkill==='shadow'){
        for(var i=this.shadowDecoys.length-1;i>=0;i--){
          var sd=this.shadowDecoys[i];
          sd.life--;
          sd.x+=sd.vx; sd.y+=sd.vy;
          if(sd.life<=0){this.shadowDecoys.splice(i,1);}
        }
        // Enemy redirect is now handled in the enemy loop above
      }
      // Barrier: iframes
      if(this.activeSkill==='barrier'){
        p.iframes=Math.max(p.iframes,2);
      }
      // Time slow: slow enemies
      if(this.activeSkill==='timeslow'){
        // handled in enemy loop below via flag
      }
      if(this.skillTimer<=0){
        this.skillActive=false;
        if(this.activeSkill==='shadow') this.shadowDecoys=[];
        if(this.activeSkill==='barrier') this._barrierOn=false;
        if(this.activeSkill==='timeslow') this._timeSlowOn=false;
        if(this.activeSkill==='berserker'){
          this._berserkerOn=false;
          if(this._berserkerSpdOrig>0) this.P.spd=this._berserkerSpdOrig;
        }
      }
    }

    // Update lightning arcs
    if(this._lightningArcs && this._lightningArcs.length>0){
      for(var i=this._lightningArcs.length-1;i>=0;i--){
        this._lightningArcs[i].life--;
        if(this._lightningArcs[i].life<=0) this._lightningArcs.splice(i,1);
      }
    }

    camUpdate(p.x,p.y);
    this.updateHUD();
  };
}
