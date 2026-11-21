// Nightjar player: Wren, the infiltrator. Arrow keys or WASD to move,
// Shift to sneak (slow, silent, harder to see), mouse click tosses a coin.

import {
  PLAYER_RADIUS, WALK_SPEED, SNEAK_SPEED, WALK_NOISE, SNEAK_NOISE, COINS_PER_LEVEL,
} from './config.js';

export class Player {
  constructor(start) {
    this.r = PLAYER_RADIUS;
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.noise = 0;
    this.coins = COINS_PER_LEVEL;
    this.stepTimer = 0;
  }

  update(dt, world, input, events) {
    let mx = 0, my = 0;
    if (input.keys.has('arrowleft') || input.keys.has('a')) mx -= 1;
    if (input.keys.has('arrowright') || input.keys.has('d')) mx += 1;
    if (input.keys.has('arrowup') || input.keys.has('w')) my -= 1;
    if (input.keys.has('arrowdown') || input.keys.has('s')) my += 1;
    this.sneaking = input.keys.has('shift');
    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      world.moveCircle(this, (mx / len) * speed * dt, (my / len) * speed * dt);
      this.angle = Math.atan2(my, mx);
      this.noise = this.sneaking ? SNEAK_NOISE : WALK_NOISE;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        events.push(this.sneaking ? 'step-soft' : 'step');
        this.stepTimer = this.sneaking ? 0.42 : 0.3;
      }
    } else {
      this.noise = 0;
    }
  }
}
