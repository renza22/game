const bindDeps = (deps) => {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = deps;
  return { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts };
};

export function installShopMethods(G, deps) {
  const { ctx, cv, VW, VH, MW, MH, WALL, TS, WEAPONS, THEMES, FLOORS, ET, keys, mouse, cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, resolveWalls, isBlocked, spawnParts } = bindDeps(deps);
  G.openShop = function(){
    var self=this;
    var nextFloor=this.floor<10?this.floor+1:this.floor;
    var floorLabel=this.state==='transition'?('Menuju Lantai '+nextFloor+' — '+THEMES[Math.min(nextFloor-1,THEMES.length-1)].name):('Lantai '+this.floor+' — '+THEMES[Math.min(this.floor-1,THEMES.length-1)].name+' [Belanja antar lantai]');
    document.getElementById('shop-floor-info').textContent=floorLabel;
    document.getElementById('shop-gold').textContent=this.gold;
    this.renderShop();
    // Show overlay FIRST before switching tabs
    document.getElementById('shop-overlay').style.display='flex';
    this._shopOpen=true;
    // Also pause play state
    this._pausedState=this.state;
    if(this.state==='play') this.state='transition';
    // Show skill badge if any skill is purchasable and not yet owned
    var badge=document.getElementById('skill-tab-badge');
    if(badge){
      var SKILLS=this._getSkillDefs();
      var hasAvail=false;
      for(var i=0;i<SKILLS.length;i++){
        var sk=SKILLS[i];
        if(!this.activeSkill && this.floor>=sk.minFloor && this.gold>=sk.price){hasAvail=true;break;}
      }
      badge.style.display=hasAvail?'inline':'none';
    }
    // Default to weapons tab; auto-switch to skill tab when skill first becomes available
    var defaultTab = (!this.activeSkill && this.floor>=3) ? 'items' : 'weapons';
    if(window.shopTab) window.shopTab(defaultTab);
  };
  G.closeShop = function(){
    document.getElementById('shop-overlay').style.display='none';
    this._shopOpen=false;
    // Restore previous play state if shop was opened mid-game
    if(this._pausedState==='play'){
      this.state='play';
    } else if(this.state==='transition'){
      // transition shop: resume with short timer
      this.transTimer=Math.min(this.transTimer,30);
    }
    this._pausedState=null;
  };
  G.renderShop = function(){
    document.getElementById('shop-gold').textContent=this.gold;
    this.renderWeaponCards();
    this.renderItemCards();
    this.renderUpgradeCards();
  };
  G.renderWeaponCards = function(){
    var self=this;
    var SHOP_WEAPONS=[
      {idx:1, name:'Laser',  icon:'⚡', desc:'Tembak cepat, cocok untuk musuh banyak', price:120, minFloor:2, color:'#44ffff'},
      {idx:2, name:'Plasma', icon:'🌀', desc:'Proyektil besar, damage menengah', price:180, minFloor:2, color:'#ff44cc'},
      {idx:3, name:'Sniper', icon:'🏹', desc:'Damage tinggi, tembak menembus musuh — Ammo ∞ UNLIMITED', price:250, minFloor:3, color:'#88ff44'},
      {idx:4, name:'Orb',    icon:'🔮', desc:'Peluru pencari otomatis, butuh MP — Ammo ∞ UNLIMITED', price:300, minFloor:4, color:'#cc88ff'},
      {idx:5, name:'Roket',  icon:'💣', desc:'Ledakan area dahsyat, sangat kuat — Ammo ∞ UNLIMITED', price:400, minFloor:5, color:'#ff6633'},
    ];
    var html='';
    SHOP_WEAPONS.forEach(function(sw){
      var owned=self.unlockedWeapons[sw.idx];
      var locked=self.floor<sw.minFloor-1; // floor before advancing
      var canAfford=self.gold>=sw.price;
      var cls='shop-card'+(owned?' owned':locked?' locked':(!canAfford?' cant-afford':''));
      var btnHtml='';
      if(owned){
        btnHtml='<button class="shop-btn owned-btn">✓ Sudah Dimiliki</button>';
      } else if(locked){
        btnHtml='<button class="shop-btn locked-btn">🔒 Tersedia Lantai '+sw.minFloor+'</button>';
      } else if(!canAfford){
        btnHtml='<button class="shop-btn no-gold-btn">💰 Butuh '+sw.price+' Gold</button>';
      } else {
        btnHtml='<button class="shop-btn buy-btn" onclick="G.buyWeapon('+sw.idx+','+sw.price+')">🛒 Beli — '+sw.price+' Gold</button>';
      }
      html+='<div class="'+cls+'" style="border-color:'+(owned?'#22aa44':locked?'#1e1e40':(!canAfford?'#441111':'#1e1e40'))+'">';
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
      html+='<span style="font-size:22px;">'+sw.icon+'</span>';
      html+='<div><div style="color:'+sw.color+';font-weight:bold;font-size:13px;">'+sw.name+'</div>';
      html+='<div style="color:#555577;font-size:9px;">Min. Lantai '+sw.minFloor+'</div></div>';
      html+='<div style="margin-left:auto;color:#ffd700;font-size:12px;font-weight:bold;">'+(owned?'✓':sw.price+'G')+'</div></div>';
      html+='<div style="color:#8888aa;font-size:9px;margin-bottom:8px;">'+sw.desc+'</div>';
      html+=btnHtml+'</div>';
    });
    document.getElementById('weapon-cards').innerHTML=html;
  };
  G.renderItemCards = function(){
    var self=this;
    var SKILLS=this._getSkillDefs();
    var curFloor=this.floor;
    var skActive=null;
    if(this.activeSkill){for(var i=0;i<SKILLS.length;i++) if(SKILLS[i].id===this.activeSkill){skActive=SKILLS[i];break;}}
    if(skActive){
      document.getElementById('skill-active-icon').textContent=skActive.icon;
      document.getElementById('skill-active-name').textContent=skActive.name+' — '+skActive.desc;
      document.getElementById('skill-active-key').textContent='CD: '+Math.round(skActive.cooldown/60)+'s | MP: '+skActive.mpCost+' | Koleksi: '+self.ownedSkills.length+' skill';
    } else {
      document.getElementById('skill-active-icon').textContent='—';
      document.getElementById('skill-active-name').textContent=self.ownedSkills.length>0?'Kamu punya skill tapi belum di-equip!':'Belum ada skill. Beli skill di bawah.';
      document.getElementById('skill-active-key').textContent=self.ownedSkills.length>0?'Klik tombol EQUIP untuk mengaktifkan':'';
    }
    if(curFloor<=1){
      document.getElementById('item-cards').innerHTML=
        '<div style="grid-column:1/-1;background:#0c0820;border:1.5px solid #3a1a5a;border-radius:10px;padding:22px;text-align:center;">'
        +'<div style="font-size:36px;margin-bottom:10px;">🔒</div>'
        +'<div style="color:#ffcc44;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:8px;">SKILL BELUM TERSEDIA</div>'
        +'<div style="color:#8888aa;font-size:10px;line-height:1.8;">Kamu belum memiliki skill apapun di Lantai 1.<br><b style="color:#88ffcc">Shadow Decoy</b> 👥 tersedia mulai <b style="color:#88ffcc">Lantai 3</b>.<br><b style="color:#ffcc44">Dash Strike</b> 💨 tersedia mulai <b style="color:#ffcc44">Lantai 5</b>.<br>Selesaikan lantai ini dulu!</div>'
        +'</div>';
      return;
    }
    var html="";
    SKILLS.forEach(function(sk){
      var isEquipped=self.activeSkill===sk.id;
      var isOwned=self.ownedSkills.indexOf(sk.id)>=0;
      var floorLocked=curFloor<(sk.minFloor||2);
      var canAfford=self.gold>=sk.price;
      var cls='shop-card'+(isEquipped?' owned':isOwned?' owned':floorLocked?' locked':(!canAfford?' cant-afford':''));
      var borderStyle=isEquipped?'border-color:#ffcc44;':isOwned?'border-color:#22aa44;':'';
      var btn='';
      if(isEquipped){
        btn='<button class="shop-btn owned-btn" style="background:#2a1a00;color:#ffcc44;border:1px solid #664400;">⚡ Sedang Di-Equip — Tekan SPASI</button>';
      } else if(isOwned){
        btn='<button class="shop-btn buy-btn" style="background:linear-gradient(135deg,#553300,#332200);color:#ffcc44;border:1px solid #885500;" onclick="G.equipSkill(\''+sk.id+'\')">🔄 EQUIP Skill Ini</button>';
      } else if(floorLocked){
        btn='<button class="shop-btn locked-btn">🔒 Tersedia Lantai '+(sk.minFloor||2)+'</button>';
      } else if(!canAfford){
        btn='<button class="shop-btn no-gold-btn">💰 Butuh '+sk.price+' Gold</button>';
      } else {
        btn='<button class="shop-btn buy-btn" onclick="G.buySkill(\''+sk.id+'\','+sk.price+')">🛒 Beli — '+sk.price+' Gold</button>';
      }
      var nc=isEquipped?'#ffcc44':isOwned?'#88ffcc':floorLocked?'#555577':'#ddddff';
      var statusLabel=isEquipped?'⚡ EQUIP':isOwned?'✓ PUNYA':floorLocked?'Lantai '+(sk.minFloor||2):sk.price+'G';
      html+='<div class="'+cls+'" style="'+borderStyle+'">';
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
      html+='<span style="font-size:24px;'+(floorLocked&&!isOwned?'opacity:0.35':'')+'">'+(sk.icon)+'</span>';
      html+='<div><div style="color:'+nc+';font-weight:bold;font-size:12px;">'+sk.name+'</div>';
      html+='<div style="color:#555577;font-size:8px;">CD:'+Math.round(sk.cooldown/60)+'s | MP:'+sk.mpCost+' | Min Lantai '+(sk.minFloor||2)+'</div></div>';
      html+='<div style="margin-left:auto;color:'+(isEquipped?'#ffcc44':isOwned?'#88ffcc':'#ffd700')+';font-size:11px;font-weight:bold;">'+statusLabel+'</div>';
      html+='</div><div style="color:#8888aa;font-size:9px;margin-bottom:8px;">'+sk.desc+'</div>';
      html+=btn+"</div>";
    });
    document.getElementById('item-cards').innerHTML=html;
  };
  G.renderUpgradeCards = function(){
    var self=this;
    if(!this.upgradeLevels) this.upgradeLevels={hp:0,mp:0,spd:0,def:0,dmg:0,dash:0};
    var BASE={hp:120,mp:90,spd:150,def:130,dmg:160,dash:180};
    var PER ={hp:40, mp:30, spd:50, def:45, dmg:60, dash:70};
    var UPGRADES=[
      {id:'hp',   name:'Max HP +30',         icon:'❤️', desc:'Tingkatkan HP Maksimum'},
      {id:'mp',   name:'Max MP +20',          icon:'💙', desc:'Tingkatkan MP Maksimum'},
      {id:'spd',  name:'Kecepatan +10%',      icon:'💨', desc:'Gerak lebih cepat'},
      {id:'def',  name:'Armor +3',            icon:'🛡️', desc:'Kurangi damage musuh'},
      {id:'dmg',  name:'Semua Senjata +20%',  icon:'🔫', desc:'Semua senjata jadi lebih mematikan'},
      {id:'dash', name:'Dash Lebih Cepat',    icon:'⚡', desc:'Cooldown dash berkurang'},
    ];
    var html='';
    UPGRADES.forEach(function(up){
      var curLvl=self.upgradeLevels[up.id]||0;
      var price=(BASE[up.id]||100) + curLvl*(PER[up.id]||40);
      var nextPrice=(BASE[up.id]||100) + (curLvl+1)*(PER[up.id]||40);
      var canAfford=self.gold>=price;
      var cls='shop-card'+(canAfford?'':' cant-afford');
      var lvlBadge=curLvl>0
        ?'<span style="background:#1a3a2a;color:#44ffcc;font-size:9px;border-radius:4px;padding:1px 6px;margin-left:6px;border:1px solid #44ffcc44;">Lv.'+curLvl+'</span>'
        :'';
      var nextInfo=canAfford
        ?'<span style="color:#888899;font-size:8px;margin-left:6px;">Selanjutnya: '+nextPrice+'G</span>'
        :'';
      var btnHtml=canAfford
        ?'<button class="shop-btn buy-btn" onclick="G.buyUpgrade(\''+up.id+'\')">⬆️ Upgrade — '+price+' Gold</button>'
        :'<button class="shop-btn no-gold-btn">💰 Butuh '+price+' Gold</button>';
      html+='<div class="'+cls+'">';
      html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">';
      html+='<span style="font-size:20px;">'+up.icon+'</span>';
      html+='<div style="flex:1;"><div style="color:#ddddff;font-weight:bold;font-size:11px;">'+up.name+lvlBadge+'</div>';
      html+='<div style="color:#8888aa;font-size:9px;">'+up.desc+nextInfo+'</div></div></div>';
      html+=btnHtml+'</div>';
    });
    document.getElementById('upgrade-cards').innerHTML=html;
  };
  G.buyWeapon = function(idx, price){
    if(this.gold<price||this.unlockedWeapons[idx]) return;
    this.gold-=price;
    this.unlockedWeapons[idx]=true;
    spawnParts(this.P.x,this.P.y,'#ffd700',8,'-'+price+'G');
    this.updateWeaponBar();
    this.updateHUD();
    this.renderShop();
  };
  G.buyItem = function(id, price){
    if(this.gold<price) return;
    this.gold-=price;
    var ITEMS_MAP={
      'potion2':  function(g){g.P.potions=Math.min(g.P.potions+2,9);},
      'potion3':  function(g){g.P.potions=Math.min(g.P.potions+3,9);},
      'healS':    function(g){g.P.hp=Math.min(g.P.maxHp,g.P.hp+60);},
      'healFull': function(g){g.P.hp=g.P.maxHp;},
      'mpFull':   function(g){g.P.mp=g.P.maxMp;},
      'shield':   function(g){g.P.def+=5;},
    };
    if(ITEMS_MAP[id]) ITEMS_MAP[id](this);
    spawnParts(this.P.x,this.P.y,'#ffd700',8,'-'+price+'G');
    this.updateHUD();
    this.renderShop();
  };
  G.buySkill = function(id, price){
    if(this.gold<price) return;
    if(this.ownedSkills.indexOf(id)>=0) return;
    this.gold-=price;
    this.ownedSkills.push(id);
    if(!this.activeSkill){
      this.activeSkill=id;
      this.skillCd=0;
      this.skillActive=false;
      this.skillTimer=0;
    }
    spawnParts(this.P.x,this.P.y,'#ffd700',6,'-'+price+'G');
    spawnParts(this.P.x,this.P.y,'#88ffcc',12,'SKILL!');
    this.updateHUD();
    this.renderShop();
  };
  G.equipSkill = function(id){
    if(this.ownedSkills.indexOf(id)<0) return; // belum punya
    // Reset efek skill lama
    this._barrierOn=false;
    this._timeSlowOn=false;
    if(this._berserkerOn && this._berserkerSpdOrig){ this.P.spd=this._berserkerSpdOrig; }
    this._berserkerOn=false;
    this.skillActive=false;
    this.skillTimer=0;
    this.shadowDecoys=[];
    // Equip skill baru
    this.activeSkill=id;
    this.skillCd=0;
    spawnParts(this.P.x,this.P.y,'#ffcc44',10,'EQUIPPED!');
    this.updateHUD();
    this.renderShop();
  };
  G.buyUpgrade = function(id){
    if(!this.upgradeLevels) this.upgradeLevels={hp:0,mp:0,spd:0,def:0,dmg:0,dash:0};
    var BASE={hp:120,mp:90,spd:150,def:130,dmg:160,dash:180};
    var PER ={hp:40, mp:30, spd:50, def:45, dmg:60, dash:70};
    var curLvl=this.upgradeLevels[id]||0;
    var price=(BASE[id]||100) + curLvl*(PER[id]||40);
    if(this.gold<price) return;
    this.gold-=price;
    this.upgradeLevels[id]=curLvl+1;
    var self=this;
    var UPGR_MAP={
      'hp':   function(){self.P.maxHp+=30;self.P.hp=Math.min(self.P.maxHp,self.P.hp+15);},
      'mp':   function(){self.P.maxMp+=20;self.P.mp=Math.min(self.P.maxMp,self.P.mp+10);},
      'spd':  function(){self.P.spd+=0.3;},
      'def':  function(){self.P.def+=3;},
      'dmg':  function(){for(var wi=0;wi<self.weapons.length;wi++){if(self.weapons[wi]){self.weapons[wi].dmgA=Math.round(self.weapons[wi].dmgA*1.2);self.weapons[wi].dmgB=Math.round(self.weapons[wi].dmgB*1.2);}}},
      'dash': function(){self._dashBonus=(self._dashBonus||0)+8;},
    };
    if(UPGR_MAP[id]) UPGR_MAP[id]();
    spawnParts(self.P.x,self.P.y,'#ffd700',6,'-'+price+'G');
    spawnParts(self.P.x,self.P.y,'#aaaaff',8,'UPGRADE!');
    this.updateHUD();
    this.renderShop();
  };
}
