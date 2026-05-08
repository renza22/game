import { G } from './game.js';

export function loop(){
  G.update();
  G.render();
  requestAnimationFrame(loop);
}

loop();
