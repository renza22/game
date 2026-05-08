const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, ADMIN_GIFT_MUSIC_SRC, SNIPER_SHOT_SOUND_SRC, PISTOL_SHOT_SOUND_SRC, MONSTER_DEATH_SOUND_SRC, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, ADMIN_GIFT_MUSIC_SRC, SNIPER_SHOT_SOUND_SRC, PISTOL_SHOT_SOUND_SRC, MONSTER_DEATH_SOUND_SRC, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installCombatMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, ADMIN_GIFT_MUSIC_SRC, SNIPER_SHOT_SOUND_SRC, PISTOL_SHOT_SOUND_SRC, MONSTER_DEATH_SOUND_SRC, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.tryRevive = function(){
    var p=this.P;
    if(p.lives>0){
      p.lives--;
      p.hp=Math.round(p.maxHp*0.5);
      p.iframes=180; // 3 detik iframes setelah revive
      p.reviving=120; // animasi revive 2 detik
      spawnParts(p.x,p.y,'#ff4466',20,'NYAWA -1!');
      spawnParts(p.x,p.y,'#ffcc44',30,'REVIVE!');
      spawnParts(p.x,p.y,'#ffffff',20,null);
      this.updateHUD();
      return true; // masih bisa lanjut
    }
    return false; // benar-benar mati
  };
  G.handlePlayerDeath = function(){
    if(this.P.hp<=0 && !this.tryRevive()){
      if(this.floor===10 && !this.adminGiftUsed){
        this.triggerAdminSurprise();
        return false;
      }
      this.state='over';
      return false;
    }
    return true;
  };
  G.triggerAdminSurprise = function(){
    this.state='adminSurprise';
    this.adminSurpriseTick=0;
    this.adminSurpriseStep=0;
    this.updateHUD();
    var overlay=document.getElementById('admin-surprise-overlay');
    if(overlay) overlay.style.display='flex';
    this.renderAdminSurpriseMessage();
  };
  G.getAdminSurpriseMessages = function(){
    return [
      'SELAMAT SUDAH MENCAPAI LANTAI 10',
      'Karena sudah sampai sejauh ini, kamu berhak mendapat hadiah dari admin.',
      'BANGKITLAH DAN HABISI BIJI KORUPTOR ITU',
    ];
  };
  G.renderAdminSurpriseMessage = function(){
    var messages=this.getAdminSurpriseMessages();
    var step=Math.max(0,Math.min(this.adminSurpriseStep||0,messages.length-1));
    var msg=document.getElementById('admin-surprise-message');
    var stepEl=document.getElementById('admin-surprise-step');
    var nextBtn=document.getElementById('admin-surprise-next-btn');
    var reviveBtn=document.getElementById('admin-surprise-revive-btn');
    if(msg){
      msg.textContent=messages[step];
      msg.style.animation='none';
      void msg.offsetWidth;
      msg.style.animation='adminTextRise .8s ease-out both';
    }
    if(stepEl) stepEl.textContent=(step+1)+'/'+messages.length;
    if(nextBtn) nextBtn.style.display=step<messages.length-1?'inline-block':'none';
    if(reviveBtn) reviveBtn.style.display=step>=messages.length-1?'inline-block':'none';
  };
  G.nextAdminSurpriseMessage = function(){
    var messages=this.getAdminSurpriseMessages();
    this.adminSurpriseStep=Math.min((this.adminSurpriseStep||0)+1,messages.length-1);
    this.renderAdminSurpriseMessage();
  };
  G.claimAdminGift = function(){
    if(this.state!=='adminSurprise') return;
    this.adminGiftUsed=true;
    var overlay=document.getElementById('admin-surprise-overlay');
    if(overlay) overlay.style.display='none';
    var p=this.P;
    p.lives=Math.max(p.lives,1);
    p.hp=Math.max(1,Math.round(p.maxHp*0.5));
    p.iframes=240;
    p.reviving=120;
    this.adminReviveTimer=180;
    this.adminReviveMax=180;
    spawnParts(p.x,p.y,'#ffcc44',30,'HADIAH ADMIN!');
    spawnParts(p.x,p.y,'#44ffcc',26,'BANGKIT!');
    spawnParts(p.x,p.y,'#ffffff',36,null);
    this.playAdminGiftMusic();
    this.state='adminRevive';
    this.updateHUD();
  };
  G.playAdminGiftMusic = function(){
    if(this.adminGiftAudio) {
      this.adminGiftAudio.currentTime=0;
    } else {
      this.adminGiftAudio=new Audio(ADMIN_GIFT_MUSIC_SRC);
      this.adminGiftAudio.loop=true;
      this.adminGiftAudio.volume=0.75;
    }
    var playResult=this.adminGiftAudio.play();
    if(playResult && playResult.catch) playResult.catch(function(){});
  };
  G.getSniperShotAudio = function(){
    if(!this.sniperShotAudioBase){
      this.sniperShotAudioBase=new Audio(SNIPER_SHOT_SOUND_SRC);
      this.sniperShotAudioBase.preload='auto';
      this.sniperShotAudioBase.volume=0.95;
      this.sniperShotAudioBase.load();
    }
    return this.sniperShotAudioBase;
  };
  G.unlockSniperShotSound = function(){
    if(this.sniperShotSoundUnlocked) return;
    var audio=this.getSniperShotAudio();
    audio.muted=true;
    var playResult=audio.play();
    var self=this;
    if(playResult && playResult.then){
      playResult.then(function(){
        audio.pause();
        audio.currentTime=0;
        audio.muted=false;
        self.sniperShotSoundUnlocked=true;
      }).catch(function(){
        audio.muted=false;
      });
    } else {
      audio.pause();
      audio.currentTime=0;
      audio.muted=false;
      this.sniperShotSoundUnlocked=true;
    }
  };
  G.playSniperShotSound = function(){
    var base=this.getSniperShotAudio();
    var audio=base.cloneNode(true);
    audio.volume=0.95;
    audio.currentTime=0;
    var playResult=audio.play();
    if(playResult && playResult.catch) playResult.catch(function(){});
  };
  G.getPistolShotAudio = function(){
    if(!this.pistolShotAudioBase){
      this.pistolShotAudioBase=new Audio(PISTOL_SHOT_SOUND_SRC);
      this.pistolShotAudioBase.preload='auto';
      this.pistolShotAudioBase.volume=0.9;
      this.pistolShotAudioBase.load();
    }
    return this.pistolShotAudioBase;
  };
  G.unlockPistolShotSound = function(){
    if(this.pistolShotSoundUnlocked) return;
    var audio=this.getPistolShotAudio();
    audio.muted=true;
    var playResult=audio.play();
    var self=this;
    if(playResult && playResult.then){
      playResult.then(function(){
        audio.pause();
        audio.currentTime=0;
        audio.muted=false;
        self.pistolShotSoundUnlocked=true;
      }).catch(function(){
        audio.muted=false;
      });
    } else {
      audio.pause();
      audio.currentTime=0;
      audio.muted=false;
      this.pistolShotSoundUnlocked=true;
    }
  };
  G.playPistolShotSound = function(){
    var base=this.getPistolShotAudio();
    var audio=base.cloneNode(true);
    audio.volume=0.9;
    audio.currentTime=0;
    var playResult=audio.play();
    if(playResult && playResult.catch) playResult.catch(function(){});
  };
  G.getMonsterDeathAudio = function(){
    if(!this.monsterDeathAudioBase){
      this.monsterDeathAudioBase=new Audio(MONSTER_DEATH_SOUND_SRC);
      this.monsterDeathAudioBase.preload='auto';
      this.monsterDeathAudioBase.volume=0.9;
      this.monsterDeathAudioBase.load();
    }
    return this.monsterDeathAudioBase;
  };
  G.unlockMonsterDeathSound = function(){
    if(this.monsterDeathSoundUnlocked) return;
    var audio=this.getMonsterDeathAudio();
    audio.muted=true;
    var playResult=audio.play();
    var self=this;
    if(playResult && playResult.then){
      playResult.then(function(){
        audio.pause();
        audio.currentTime=0;
        audio.muted=false;
        self.monsterDeathSoundUnlocked=true;
      }).catch(function(){
        audio.muted=false;
      });
    } else {
      audio.pause();
      audio.currentTime=0;
      audio.muted=false;
      this.monsterDeathSoundUnlocked=true;
    }
  };
  G.playMonsterDeathSound = function(){
    var base=this.getMonsterDeathAudio();
    var audio=base.cloneNode(true);
    audio.volume=0.9;
    audio.currentTime=0;
    var playResult=audio.play();
    if(playResult && playResult.catch) playResult.catch(function(){});
  };
  G.applyEnemyDefense = function(enemy, damage){
    if(enemy && enemy.isBoss && (enemy.enrage50 || enemy.hp/enemy.maxHp<0.5)){
      return Math.max(1,Math.round(damage*0.22));
    }
    return damage;
  };
  G.usePotion = function(){
    var p=this.P;
    if(p.potions<=0||this.potCd>0) return;
    p.potions--;
    this.potCd=60;
    var h=40+Math.floor(Math.random()*20);
    p.hp=Math.min(p.maxHp,p.hp+h);
    spawnParts(p.x,p.y,'#44ff88',10,'+'+h+'HP');
    this.updateHUD();
  };
  G.doAttack = function(){
    if(this.atkCd>0||this.state!=='play') return;
    var p=this.P;
    var w=this.weapons[p.weaponIdx];
    // Block if weapon not unlocked
    if(!this.unlockedWeapons[p.weaponIdx]){
      spawnParts(p.x,p.y-20,'#ff4444',3,'TERKUNCI!');
      return;
    }
    var mx=mouse.x+cam.x, my=mouse.y+cam.y;
    var ang=Math.atan2(my-p.y,mx-p.x);
    p.facing=ang; p.atkFrame=0; p.atkDur=w.cd;
    if(w.ammo===0){spawnParts(p.x,p.y-20,'#ff4444',3,'HABIS!');return;}
    if(w.mpCost>0&&p.mp<w.mpCost){spawnParts(p.x,p.y-20,'#8844ff',3,'MP!');return;}
    if(w.mpCost>0) p.mp=Math.max(0,p.mp-w.mpCost);
    if(w.ammo>0) w.ammo--;
    this.atkCd=w.cd;
    var dmg=w.dmgA+Math.floor(Math.random()*(w.dmgB-w.dmgA+1));
    if(this._berserkerOn) dmg=Math.round(dmg*1.5); // berserker damage boost
    var len=Math.hypot(mx-p.x,my-p.y)||1;
    var ml=w.projType==='bomb'?55:w.projType==='sniper'?180:130;
    this.projs.push({
      x:p.x,y:p.y,
      vx:(mx-p.x)/len*w.projSpd, vy:(my-p.y)/len*w.projSpd,
      r:w.projR,dmg:dmg,type:w.projType,
      life:ml,maxLife:ml,angle:ang,color:w.color,
    });
    if(w.projType==='sniper') this.playSniperShotSound();
    if(w.projType==='bullet') this.playPistolShotSound();
    spawnParts(p.x,p.y,w.color,3,null);
    this.updateHUD();
  };
}
