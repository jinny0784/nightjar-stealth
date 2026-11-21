// Nightjar cameras: wall-mounted eyes that sweep a fixed arc. They cannot
// chase — standing in a camera's cone fills the house alarm meter, and a
// full meter sends every guard to the player's position.

import { TILE, CAMERA_RANGE, CAMERA_HALF_ANGLE, CAMERA_DETECT, DETECT_BASE } from './config.js';
import { canSee, detectionRate } from './vision.js';

export class SweepCamera {
  constructor(spec) {
    this.x = spec.tile[0] * TILE + TILE / 2;
    this.y = spec.tile[1] * TILE + TILE / 2;
    this.from = spec.from;
    this.to = spec.to;
    this.speed = spec.speed;
    this.phase = 0;
    this.angle = spec.from;
    this.seesPlayer = false;
  }

  update(dt, world, player, game) {
    this.phase += dt * this.speed;
    const t = (Math.sin(this.phase) + 1) / 2; // ease back and forth
    this.angle = this.from + (this.to - this.from) * t;
    this.seesPlayer = canSee(world, this.x, this.y, this.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, player.x, player.y);
    if (this.seesPlayer) {
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      const scaled = (detectionRate(world, player, dist, CAMERA_RANGE) / DETECT_BASE) * CAMERA_DETECT;
      game.alarmMeter = Math.min(1, game.alarmMeter + scaled * dt);
    }
  }
}
