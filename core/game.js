import { VW, VH, MW, MH, WALL, TS, ADMIN_GIFT_MUSIC_SRC, SNIPER_SHOT_SOUND_SRC, PISTOL_SHOT_SOUND_SRC, MONSTER_DEATH_SOUND_SRC, PLAYER_WALK_SOUND_SRC, SHOP_TAB_SOUND_SRC, SHOP_BUY_SOUND_SRC } from '../data/constants.js';
import { WEAPONS } from '../data/weapons.js';
import { THEMES } from '../data/themes.js';
import { FLOORS } from '../data/floors.js';
import { ET } from '../data/enemies.js';
import { cam, camUpdate, wx, wy, inView, circleRect, resolveCircleRect, createCollision, createSpawnParts } from './utils.js';
import { installStateMethods } from './state.js';
import { installCombatMethods } from '../systems/combat.js';
import { installBossAiMethods } from '../systems/boss-ai.js';
import { installSkillMethods } from '../systems/skills.js';
import { installHazardMethods } from '../systems/hazards.js';
import { installProgressionMethods } from '../systems/progression.js';
import { bindInput } from '../systems/input.js';
import { installShopMethods } from '../systems/shop.js';
import { installRendererMethods } from '../render/renderer.js';
import { installRenderUiMethods } from '../render/render-ui.js';
import { installMinimapMethods } from '../render/minimap.js';

var cv = document.getElementById('cv');
var ctx = cv.getContext('2d');
var keys = {};
var mouse = {x:VW/2, y:VH/2, down:false};

export var G = {
  state:'play', // play | over | win | transition | adminSurprise | adminRevive
  tick:0,
  floor:1,
  score:0,
  kills:0,
  transTimer:0,
  P:null, // player
  enemies:[],
  projs:[],
  enemyProjs:[],
  parts:[],
  explosions:[],
  walls:[],
  traps:[],
  mines:[],
  iceZones:[],
  portals:[],
  stair:null,
  stairOpen:false,
  atkCd:0,
  potCd:0,
};

const collision = createCollision(G);
const spawnParts = createSpawnParts(G);

const deps = {
  ctx, cv, VW, VH, MW, MH, WALL, TS,
  ADMIN_GIFT_MUSIC_SRC, SNIPER_SHOT_SOUND_SRC, PISTOL_SHOT_SOUND_SRC, MONSTER_DEATH_SOUND_SRC, PLAYER_WALK_SOUND_SRC, SHOP_TAB_SOUND_SRC, SHOP_BUY_SOUND_SRC,
  WEAPONS, THEMES, FLOORS, ET,
  keys, mouse, cam, camUpdate, wx, wy, inView,
  circleRect, resolveCircleRect,
  resolveWalls: collision.resolveWalls,
  isBlocked: collision.isBlocked,
  spawnParts,
};

installStateMethods(G, deps);
installCombatMethods(G, deps);
installBossAiMethods(G, deps);
installSkillMethods(G, deps);
installHazardMethods(G, deps);
installProgressionMethods(G, deps);
installShopMethods(G, deps);
installRendererMethods(G, deps);
installRenderUiMethods(G, deps);
installMinimapMethods(G, deps);
bindInput(G, deps);

// Inject minimap canvas
(function(){
  var mm=document.createElement('canvas');
  mm.id='mm'; mm.width=120; mm.height=90;
  mm.style.cssText='position:absolute;top:8px;right:8px;border:1px solid #2a2a5a;border-radius:3px;opacity:0.85;pointer-events:none;';
  document.getElementById('wrap').style.position='relative';
  document.querySelector('#wrap canvas').parentNode.style.position='relative';
  document.getElementById('cv').insertAdjacentElement('afterend',mm);
})();

// Expose G and shopTab globally so inline onclick handlers keep working.
window.G = G;
window.shopTab = function(tab){
  if(G.playShopTabSound) G.playShopTabSound();
  ['weapons','items','upgrades'].forEach(function(t){
    document.getElementById('tab-'+t+'-content').style.display=(t===tab?'block':'none');
    document.getElementById('tab-'+t).classList.toggle('shop-tab-active',t===tab);
  });
  if(tab==='items')    G.renderItemCards();
  if(tab==='weapons')  G.renderWeaponCards();
  if(tab==='upgrades') G.renderUpgradeCards();
};

G.init();
