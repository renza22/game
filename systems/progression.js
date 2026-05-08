const bindDeps = (deps) => {
  const { spawnParts } = deps;
  return { spawnParts };
};

export function installProgressionMethods(G, deps) {
  const { spawnParts } = bindDeps(deps);

  G.handleLevelUp = function(p){
    if(p.xp>=p.level*60){
      p.xp-=p.level*60; p.level++;
      p.maxHp+=20;p.hp=Math.min(p.maxHp,p.hp+25);
      p.maxMp+=8;p.mp=Math.min(p.maxMp,p.mp+12);
      p.def+=1;p.spd+=0.08;
      spawnParts(p.x,p.y,'#ffff44',14,'LEVEL UP!');
    }
  };
}
