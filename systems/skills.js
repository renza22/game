const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installSkillMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.useSkill = function(){
    if(this.state!=='play') return;
    if(!this.activeSkill){spawnParts(this.P.x,this.P.y-24,'#ff6666',3,'NO SKILL!');return;}
    if(this.skillCd>0){spawnParts(this.P.x,this.P.y-24,'#ff8844',3,'COOLDOWN!');return;}
    var SKILLS=this._getSkillDefs();
    var sk=null; for(var i=0;i<SKILLS.length;i++) if(SKILLS[i].id===this.activeSkill){sk=SKILLS[i];break;}
    if(!sk) return;
    if(this.P.mp<sk.mpCost){spawnParts(this.P.x,this.P.y-24,'#8844ff',3,'MP!');return;}
    this.P.mp=Math.max(0,this.P.mp-sk.mpCost);
    sk.use.call(this);
    this.skillCd=sk.cooldown;
    this.updateHUD();
  };
  G._getSkillDefs = function(){
    var self=this;
    return [
      {
        id:'dash_strike',
        name:'Dash Strike',
        icon:'💨',
        desc:'Dash kilat ke arah tujuan, menembus musuh dan beri damage. Iframes saat dash.',
        price:120,
        minFloor:5,
        mpCost:0,
        cooldown:280,
        duration:0,
        use: function(){
          var p=self.P;
          var mx=0,my=0;
          if(keys['a']||keys['A']||keys['ArrowLeft'])mx-=1;
          if(keys['d']||keys['D']||keys['ArrowRight'])mx+=1;
          if(keys['w']||keys['W']||keys['ArrowUp'])my-=1;
          if(keys['s']||keys['S']||keys['ArrowDown'])my+=1;
          if(mx===0&&my===0){mx=Math.cos(p.facing);my=Math.sin(p.facing);}
          else{var l=Math.hypot(mx,my);mx/=l;my/=l;}
          p.dashVx=mx*26; p.dashVy=my*26;
          p.dashTimer=12; p.dashCd=0;
          p.iframes=Math.max(p.iframes,20);
          // damage enemies on path
          for(var i=0;i<self.enemies.length;i++){
            var e=self.enemies[i];
            var dist=Math.hypot(e.x-p.x,e.y-p.y);
            if(dist<80){
              var dmg=self.applyEnemyDefense(e,30+self.P.level*5);
              e.hp-=dmg; e.iframes=20;
              spawnParts(e.x,e.y,'#44ccff',6,'-'+dmg);
              if(e.isBoss&&e.enrage50)spawnParts(e.x,e.y,'#aaaaff',3,'ARMOR');
            }
          }
          spawnParts(p.x,p.y,'#00ccff',12,'DASH!');
        }
      },
      {
        id:'shadow',
        name:'Shadow Decoy',
        icon:'👥',
        desc:'Buat 3 bayangan palsu selama 5 detik. Musuh bingung dan menyerang bayangan.',
        price:200,
        minFloor:3,
        mpCost:15,
        cooldown:420,
        duration:300,
        use: function(){
          var p=self.P;
          self.shadowDecoys=[];
          var angles=[0, Math.PI*2/3, Math.PI*4/3];
          for(var i=0;i<3;i++){
            var a=angles[i];
            self.shadowDecoys.push({
              x:p.x+Math.cos(a)*60, y:p.y+Math.sin(a)*60,
              life:300, maxLife:300,
              vx:Math.cos(a)*0.6, vy:Math.sin(a)*0.6,
            });
          }
          self.skillActive=true; self.skillTimer=300;
          spawnParts(p.x,p.y,'#aa66ff',14,'SHADOW!');
        }
      },
      {
        id:'barrier',
        name:'Mana Barrier',
        icon:'🔵',
        desc:'Pasang perisai sihir selama 4 detik, blokir semua damage masuk.',
        price:250,
        minFloor:2,
        mpCost:25,
        cooldown:500,
        duration:240,
        use: function(){
          var p=self.P;
          self._barrierOn=true;
          self.skillActive=true; self.skillTimer=240;
          p.iframes=240;
          spawnParts(p.x,p.y,'#4488ff',16,'BARRIER!');
        }
      },
      {
        id:'timeslow',
        name:'Time Slow',
        icon:'⏳',
        desc:'Perlambat semua musuh 70% selama 5 detik. MP terus mengalir saat aktif.',
        price:350,
        minFloor:3,
        mpCost:30,
        cooldown:550,
        duration:300,
        use: function(){
          var p=self.P;
          self._timeSlowOn=true;
          self.skillActive=true; self.skillTimer=300;
          spawnParts(p.x,p.y,'#ffaa00',14,'TIME SLOW!');
        }
      },
      {
        id:'nova',
        name:'Mana Nova',
        icon:'💥',
        desc:'Ledakan energi sekeliling, memukul mundur & damage semua musuh di layar.',
        price:300,
        minFloor:3,
        mpCost:35,
        cooldown:480,
        duration:0,
        use: function(){
          var p=self.P;
          var blastR=250;
          for(var i=0;i<self.enemies.length;i++){
            var e=self.enemies[i];
            var dist=Math.hypot(e.x-p.x,e.y-p.y);
            if(dist<blastR){
              var dmg=self.applyEnemyDefense(e,Math.round(50*(1-dist/blastR))+20);
              e.hp-=dmg; e.iframes=30;
              var push=8*(1-dist/blastR);
              var ang=Math.atan2(e.y-p.y,e.x-p.x);
              e.kvx=(Math.cos(ang)*push*6)|0;
              e.kvy=(Math.sin(ang)*push*6)|0;
              spawnParts(e.x,e.y,'#ff88ff',5,'-'+dmg);
              if(e.isBoss&&e.enrage50)spawnParts(e.x,e.y,'#aaaaff',3,'ARMOR');
            }
          }
          self.explosions.push({x:p.x,y:p.y,r:0,maxR:blastR,life:1});
          spawnParts(p.x,p.y,'#ff44ff',20,'NOVA!');
        }
      },
      {
        id:'berserker',
        name:'Berserker Rage',
        icon:'🔥',
        desc:'Masuk mode mengamuk: kecepatan +80%, damage +50%, iframes terus-menerus selama 4 detik.',
        price:280,
        minFloor:3,
        mpCost:20,
        cooldown:520,
        duration:240,
        use: function(){
          var p=self.P;
          self._berserkerOn=true;
          self._berserkerSpdOrig=p.spd;
          p.spd*=1.8;
          self.skillActive=true; self.skillTimer=240;
          p.iframes=Math.max(p.iframes,10);
          spawnParts(p.x,p.y,'#ff4400',18,'RAGE!');
        }
      },
      {
        id:'chain_lightning',
        name:'Chain Lightning',
        icon:'⚡',
        desc:'Petir melompat ke 5 musuh terdekat, masing-masing kena damage besar. Instan.',
        price:320,
        minFloor:4,
        mpCost:28,
        cooldown:360,
        duration:0,
        use: function(){
          var p=self.P;
          // Find up to 5 closest enemies
          var sorted=self.enemies.slice().sort(function(a,b){
            return Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y);
          });
          var hit=sorted.slice(0,5);
          var prev={x:p.x,y:p.y};
          for(var i=0;i<hit.length;i++){
            var e=hit[i];
            var dmg=60+self.P.level*8;
            var decay=Math.pow(0.75,i); // each jump does 75% of previous
            var actualDmg=self.applyEnemyDefense(e,Math.round(dmg*decay));
            e.hp-=actualDmg; e.iframes=25;
            // Store lightning arc for rendering
            self._lightningArcs=(self._lightningArcs||[]);
            self._lightningArcs.push({x1:prev.x,y1:prev.y,x2:e.x,y2:e.y,life:18,maxLife:18});
            prev={x:e.x,y:e.y};
            spawnParts(e.x,e.y,'#ffff44',6,'-'+actualDmg);
            if(e.isBoss&&e.enrage50)spawnParts(e.x,e.y,'#aaaaff',3,'ARMOR');
          }
          spawnParts(p.x,p.y,'#ffffff',16,'LIGHTNING!');
        }
      },
    ];
  };
}
