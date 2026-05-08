const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installBossAiMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.updateBossAI = function(boss, p){
    var self=this;
    var hpPct=boss.hp/boss.maxHp;

    // Phase transitions
    if(hpPct<0.6 && boss.phase===1){
      boss.phase=2; boss.rageFlash=60;
      boss.spd*=1.25; boss.atk=Math.round(boss.atk*1.3);
      spawnParts(boss.x,boss.y,'#ff0000',30,'PHASE 2!');
    }
    if(hpPct<0.25 && boss.phase===2){
      boss.phase=3; boss.rageFlash=80;
      boss.spd*=1.2; boss.atk=Math.round(boss.atk*1.4);
      boss.shieldHp=800;
      spawnParts(boss.x,boss.y,'#aa00ff',40,'PHASE 3!');
      spawnParts(boss.x,boss.y,'#ffffff',30,'RAGE!');
    }
    if(hpPct<0.5 && !boss.enrage50){
      boss.enrage50=true;
      boss.rageFlash=70;
      boss.spd*=1.25;
      boss.aiDecision=0;
      boss.barrageCd=0;
      boss.summonCd=Math.min(boss.summonCd||0,90);
      spawnParts(boss.x,boss.y,'#ff6600',36,'ENRAGE 50%!');
      spawnParts(boss.x,boss.y,'#ffcc44',24,'BOSS MENGAMUK!');
      spawnParts(boss.x,boss.y,'#aaaaff',32,'VOID ARMOR!');
    }

    // Regenerate shield in phase 3
    if(boss.phase===3 && boss.shieldHp>0 && this.tick%90===0){
      boss.shieldHp=Math.min(800,boss.shieldHp+30);
    }

    // Cooldown decrement
    if(boss.summonCd>0) boss.summonCd--;
    if(boss.barrageCd>0) boss.barrageCd--;
    if(boss.dashCd>0) boss.dashCd--;
    if(boss.teleportCd>0) boss.teleportCd--;
    if(boss.aiDecision>0) boss.aiDecision--;
    if(boss.adaptTimer>0) boss.adaptTimer--;
    if(boss.enrageMeleeWindow>0) boss.enrageMeleeWindow--;

    // Track player movement for prediction
    var plVx=p.x-(boss.lastPlayerX||p.x);
    var plVy=p.y-(boss.lastPlayerY||p.y);
    boss.lastPlayerX=p.x; boss.lastPlayerY=p.y;
    var predictAhead=40;
    boss.predictX=p.x+plVx*predictAhead;
    boss.predictY=p.y+plVy*predictAhead;

    var dist=Math.hypot(p.x-boss.x,p.y-boss.y);
    var enraged50 = hpPct<0.5 || boss.enrage50;
    var shotCdMul = enraged50?0.62:1;
    var shotSpeedMul = enraged50?1.22:1;
    var extraShots = enraged50?2:0;
    var extraSummons = enraged50?3:0;
    var teleportCdBase = enraged50?58:240;

    if(enraged50 && boss.teleportCd<=0 && boss.aiMode!=='teleport_strike' && dist>boss.r+p.r+6){
      boss.aiMode='teleport_strike';
      boss.aiDecision=22;
    }

    // ── ADAPTIVE DECISION MAKING ──
    if(boss.aiDecision<=0){
      var roll=Math.random();
      var ph=boss.phase;

      // If player keeps dodging (low hit count), switch to predicted aim
      if(boss.adaptTimer<=0){
        if(boss.playerHitCount<1 && ph>=2){
          boss.aiMode='barrage'; // overwhelm with projectiles
        }
        boss.playerHitCount=0;
        boss.adaptTimer=180;
      }

      if(ph===1){
        if(roll<0.30) boss.aiMode='chase';
        else if(roll<0.55) boss.aiMode='strafe';
        else if(roll<0.70) boss.aiMode='shoot_spread';
        else if(roll<0.85 && boss.summonCd<=0) boss.aiMode='summon';
        else boss.aiMode='chase';
        boss.aiDecision=90+Math.random()*60;
      } else if(ph===2){
        if(enraged50){
          if(roll<0.32 && boss.teleportCd<=0) boss.aiMode='teleport_strike';
          else if(roll<0.46) boss.aiMode='chase';
          else if(roll<0.61) boss.aiMode='barrage';
          else if(roll<0.74) boss.aiMode='shoot_predicted';
          else if(roll<0.90 && boss.summonCd<=0) boss.aiMode='summon';
          else boss.aiMode='shoot_spread';
          boss.aiDecision=24+Math.random()*22;
        } else {
          if(roll<0.20) boss.aiMode='chase';
          else if(roll<0.38) boss.aiMode='strafe';
          else if(roll<0.52) boss.aiMode='barrage';
          else if(roll<0.65) boss.aiMode='shoot_predicted';
          else if(roll<0.78 && boss.summonCd<=0) boss.aiMode='summon';
          else if(roll<0.90 && boss.teleportCd<=0) boss.aiMode='teleport_strike';
          else boss.aiMode='shoot_spread';
          boss.aiDecision=60+Math.random()*50;
        }
      } else {
        // Phase 3 - maximum aggression
        if(enraged50 && roll<0.34 && boss.teleportCd<=0) boss.aiMode='teleport_strike';
        else if(roll<0.44) boss.aiMode='chase';
        else if(roll<0.58) boss.aiMode='barrage';
        else if(roll<0.70) boss.aiMode='shoot_predicted';
        else if(roll<0.84 && boss.summonCd<=0) boss.aiMode='summon';
        else if(roll<0.94) boss.aiMode='spiral_shot';
        else boss.aiMode='barrage';
        boss.aiDecision=enraged50?(18+Math.random()*18):(40+Math.random()*40);
      }
    }

    // ── EXECUTE MODE ──
    var spd=boss.spd*(this._timeSlowOn?0.3:1);

    if(boss.aiMode==='chase'){
      var tdx=p.x-boss.x, tdy=p.y-boss.y, td=Math.hypot(tdx,tdy)||1;
      boss.x+=tdx/td*spd; boss.y+=tdy/td*spd;

    } else if(boss.aiMode==='strafe'){
      // Circle around player
      var ang=Math.atan2(boss.y-p.y,boss.x-p.x);
      var targetDist=boss.strafeDist*(boss.phase===3?0.8:1);
      var radialDx=Math.cos(ang)*targetDist+p.x-boss.x;
      var radialDy=Math.sin(ang)*targetDist+p.y-boss.y;
      var tangAng=ang+Math.PI/2*boss.strafeDir;
      boss.x+=Math.cos(tangAng)*spd*1.1+(radialDx*0.03);
      boss.y+=Math.sin(tangAng)*spd*1.1+(radialDy*0.03);
      // Occasionally reverse strafe direction
      if(Math.random()<0.01) boss.strafeDir*=-1;

    } else if(boss.aiMode==='shoot_spread'){
      // Move slowly, fire spread of projectiles
      var tdx2=p.x-boss.x,tdy2=p.y-boss.y,td2=Math.hypot(tdx2,tdy2)||1;
      boss.x+=tdx2/td2*spd*0.3; boss.y+=tdy2/td2*spd*0.3;
      if(boss.barrageCd<=0){
        var baseAng=Math.atan2(p.y-boss.y,p.x-boss.x);
        var count=(boss.phase>=2?7:5)+extraShots;
        var spread=enraged50?0.23:0.28;
        for(var k=0;k<count;k++){
          var a2=baseAng+(k-(count-1)/2)*spread;
          boss.bossProjs.push({x:boss.x,y:boss.y,vx:Math.cos(a2)*7*shotSpeedMul,vy:Math.sin(a2)*7*shotSpeedMul,r:8,dmg:boss.atk*0.7|0,life:120,color:'#ff00ff'});
        }
        boss.barrageCd=Math.max(20,Math.round(60*shotCdMul));
        spawnParts(boss.x,boss.y,'#ff00ff',8,null);
      }

    } else if(boss.aiMode==='shoot_predicted'){
      // Aim at predicted player position
      var tdx3=p.x-boss.x,tdy3=p.y-boss.y,td3=Math.hypot(tdx3,tdy3)||1;
      boss.x+=tdx3/td3*spd*0.2; boss.y+=tdy3/td3*spd*0.2;
      if(boss.barrageCd<=0){
        var pang=Math.atan2(boss.predictY-boss.y,boss.predictX-boss.x);
        var predCount=enraged50?3:1;
        for(var pk=0;pk<predCount;pk++){
          var poff=(pk-(predCount-1)/2)*(enraged50?0.16:0);
          boss.bossProjs.push({x:boss.x,y:boss.y,vx:Math.cos(pang+poff)*9*shotSpeedMul,vy:Math.sin(pang+poff)*9*shotSpeedMul,r:7,dmg:boss.atk*0.9|0,life:150,color:'#ff4488'});
        }
        // Add homing missile in phase 3
        if(boss.phase===3){
          var ha=pang+0.4;
          boss.bossProjs.push({x:boss.x,y:boss.y,vx:Math.cos(ha)*5*shotSpeedMul,vy:Math.sin(ha)*5*shotSpeedMul,r:9,dmg:boss.atk*0.7|0,life:200,color:'#aa00ff',homing:true,homingStr:0.18,maxSpd:8*shotSpeedMul});
        }
        boss.barrageCd=Math.max(18,Math.round(45*shotCdMul));
        spawnParts(boss.x,boss.y,'#ff4488',6,null);
      }

    } else if(boss.aiMode==='barrage'){
      // Rapid fire all around while chasing
      var tdx4=p.x-boss.x,tdy4=p.y-boss.y,td4=Math.hypot(tdx4,tdy4)||1;
      boss.x+=tdx4/td4*spd*0.7; boss.y+=tdy4/td4*spd*0.7;
      if(boss.barrageCd<=0){
        var ba=Math.atan2(p.y-boss.y,p.x-boss.x)+(Math.random()-0.5)*0.5;
        var barrageShots=enraged50?2:1;
        for(var bk=0;bk<barrageShots;bk++){
          var boff=(bk-(barrageShots-1)/2)*0.22;
          boss.bossProjs.push({x:boss.x,y:boss.y,vx:Math.cos(ba+boff)*8*shotSpeedMul,vy:Math.sin(ba+boff)*8*shotSpeedMul,r:6,dmg:boss.atk*0.6|0,life:130,color:'#ff6600'});
        }
        boss.barrageCd=Math.max(8,Math.round(18*shotCdMul));
      }

    } else if(boss.aiMode==='spiral_shot'){
      // Spiral projectile pattern
      boss.aiTimer=(boss.aiTimer||0)+1;
      var tdx5=p.x-boss.x,tdy5=p.y-boss.y,td5=Math.hypot(tdx5,tdy5)||1;
      boss.x+=tdx5/td5*spd*0.15; boss.y+=tdy5/td5*spd*0.15;
      if(boss.barrageCd<=0){
        var spiralAng=(boss.aiTimer*0.3)%(Math.PI*2);
        var spiralCount=enraged50?5:3;
        for(var s=0;s<spiralCount;s++){
          var sa=spiralAng+s*(Math.PI*2/spiralCount);
          boss.bossProjs.push({x:boss.x,y:boss.y,vx:Math.cos(sa)*6*shotSpeedMul,vy:Math.sin(sa)*6*shotSpeedMul,r:7,dmg:boss.atk*0.5|0,life:140,color:'#cc00ff'});
        }
        boss.barrageCd=Math.max(6,Math.round(12*shotCdMul));
      }

    } else if(boss.aiMode==='summon'){
      // Stay in place, summon minions
      if(boss.summonCd<=0){
        var summonCount=(boss.phase>=2?4:2)+extraSummons;
        for(var s2=0;s2<summonCount;s2++){
          var sa2=s2/summonCount*Math.PI*2;
          var sx=boss.x+Math.cos(sa2)*100, sy=boss.y+Math.sin(sa2)*100;
          if(!isBlocked(sx,sy,14)){
            var minionType=boss.phase>=3?5:boss.phase>=2?3:1;
            var met=ET[minionType];
            this.enemies.push({
              x:sx,y:sy,r:met.r,
              hp:Math.round(met.hp*1.5),maxHp:Math.round(met.hp*1.5),
              atk:Math.round(met.atk*1.2),spd:met.spd*1.3,
              color:met.color,name:'SUMMON:'+met.name,xp:Math.round(met.xp*0.5),
              iframes:30,atkTimer:0,teleCD:0,wobble:0,kvx:0,kvy:0,
            });
            spawnParts(sx,sy,'#ff00ff',10,null);
          }
        }
        boss.summonCd=enraged50?220:360;
        spawnParts(boss.x,boss.y,'#aa00ff',20,'SUMMON!');
        boss.aiMode='shoot_spread'; // immediately follow up
      }

    } else if(boss.aiMode==='teleport_strike'){
      // Teleport near player then melee
      if(boss.teleportCd<=0){
        var ta=Math.random()*Math.PI*2;
        var trad=enraged50?(18+Math.random()*30):(80+Math.random()*60);
        var tx2=p.x+Math.cos(ta)*trad, ty2=p.y+Math.sin(ta)*trad;
        tx2=Math.max(WALL+50,Math.min(MW-WALL-50,tx2));
        ty2=Math.max(WALL+50,Math.min(MH-WALL-50,ty2));
        boss.x=tx2; boss.y=ty2;
        boss.teleportCd=teleportCdBase;
        boss.atkTimer=0;
        boss.enrageMeleeWindow=enraged50?75:0;
        spawnParts(tx2,ty2,enraged50?'#ff3300':'#ffffff',enraged50?30:20,enraged50?'AMUK!':'TELEPORT!');
        // After teleport: pressure melee when enraged, otherwise shoot
        boss.aiMode=enraged50?'chase':'shoot_predicted';
        boss.barrageCd=0;
      }
    }

    // Movement resolution
    resolveWalls(boss);
    boss.x=Math.max(WALL+boss.r,Math.min(MW-WALL-boss.r,boss.x));
    boss.y=Math.max(WALL+boss.r,Math.min(MH-WALL-boss.r,boss.y));

    // Shield absorbs damage (managed externally via hit detection)
    // Periodic stun effect avoided — done via iframes
  };
}
