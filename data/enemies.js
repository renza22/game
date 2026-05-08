export const ET = [
  {name:'Slime',    r:12,spd:1.0,hp:40,  atk:8,  color:'#33cc55',xp:10},
  {name:'Goblin',   r:13,spd:1.5,hp:60,  atk:14, color:'#cc8833',xp:20},
  {name:'Skull',    r:13,spd:1.2,hp:80,  atk:18, color:'#ccccdd',xp:30},
  {name:'Orc',      r:16,spd:0.9,hp:120, atk:24, color:'#557744',xp:50},
  {name:'Wraith',   r:14,spd:2.0,hp:70,  atk:20, color:'#6644cc',xp:40, isDashGhostType:true},
  {name:'Dragon',   r:20,spd:1.1,hp:220, atk:35, color:'#cc3322',xp:100, isDashGhostType:true},
  {name:'VOIDLORD', r:40,spd:1.6,hp:4000,atk:45, color:'#ff00ff',xp:2000,isBoss:true},
  // New smart monsters
  {name:'Hunter',   r:14,spd:1.7,hp:90,  atk:16, color:'#ff8c00',xp:45, isHunter:true},   // index 7: shoots ranged + wall-aware
  {name:'Specter',  r:15,spd:1.8,hp:130, atk:26, color:'#00eeff',xp:70, isDashGhostType:true, isSpecter:true}, // index 8: aggressive wall-phasing dasher (UPGRADED)
  {name:'Brute',    r:18,spd:0.8,hp:200, atk:40, color:'#884400',xp:80, isBrute:true},    // index 9: tanks walls, smarter pathing
  {name:'Phantom',  r:13,spd:2.2,hp:95,  atk:28, color:'#ff44cc',xp:85, isDashGhostType:true, isPhantom:true}, // index 10: rapid multi-dash wall-piercer
];
