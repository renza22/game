export function bindInput(G, deps){
  const { cv, VW, VH, keys, mouse, cam } = deps;

  document.addEventListener('keydown', function(e){
    if(G.unlockSniperShotSound) G.unlockSniperShotSound();
    if(G.unlockPistolShotSound) G.unlockPistolShotSound();
    if(G.unlockMonsterDeathSound) G.unlockMonsterDeathSound();
    keys[e.key] = true;
    if(e.key===' ' || e.code==='Space'){
      G.useSkill();
      e.preventDefault();
    }
    if(e.key>='1'&&e.key<='6'){G.selWeapon(parseInt(e.key)-1);}
    if(e.key==='f'||e.key==='F'){G.usePotion();}
    // Tombol B dihapus ? toko hanya terbuka otomatis setelah lantai selesai
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>=0) e.preventDefault();
  });
  document.addEventListener('keyup', function(e){ keys[e.key]=false; });
  cv.addEventListener('mousemove', function(e){
    var r=cv.getBoundingClientRect();
    mouse.x=(e.clientX-r.left)*(VW/r.width);
    mouse.y=(e.clientY-r.top)*(VH/r.height);
  });
  cv.addEventListener('mousedown', function(e){
    if(e.button!==0) return;
    if(G.unlockSniperShotSound) G.unlockSniperShotSound();
    if(G.unlockPistolShotSound) G.unlockPistolShotSound();
    if(G.unlockMonsterDeathSound) G.unlockMonsterDeathSound();
    mouse.down=true;
    if(G.state==='over'||G.state==='win'){G.init();return;}
    G.doAttack();
    e.preventDefault();
  });
  cv.addEventListener('mouseup', function(e){ if(e.button===0)mouse.down=false; });
  cv.addEventListener('mouseleave', function(){ mouse.down=false; });
  cv.addEventListener('wheel', function(e){
    var d=e.deltaY>0?1:-1;
    var cur=G.P.weaponIdx;
    var next=cur;
    for(var tries=0;tries<6;tries++){
      next=(next+d+6)%6;
      if(G.unlockedWeapons && G.unlockedWeapons[next]) break;
    }
    G.selWeapon(next);
    e.preventDefault();
  },{passive:false});
  cv.addEventListener('contextmenu', function(e){e.preventDefault();});
}
