// Nightjar guards: a patrol state machine with a detection meter.
// patrol → suspicious (meter rising) → chase (meter full) → investigate
// (lost the player, or heard a noise) → return to the patrol route.
// A guard who touches the player ends the run.

import {
  TILE, GUARD_RADIUS, GUARD_PATROL_SPEED, GUARD_SEARCH_SPEED, GUARD_CHASE_SPEED,
  VISION_RANGE, VISION_HALF_ANGLE, DETECT_DECAY, SUSPICIOUS_AT, LOSE_SIGHT_TIME,
} from './config.js';
import { canSee, detectionRate, angleDelta } from './vision.js';

const centre = ([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });

export class Guard {
  constructor(spec) {
    this.r = GUARD_RADIUS;
    this.path = spec.path.map(centre);
    this.waitTime = spec.wait ?? 0.8;
    this.wp = 0;
    const home = this.path[0];
    this.x = home.x; this.y = home.y;
    const next = this.path[1] ?? home;
    this.angle = Math.atan2(next.y - home.y, next.x - home.x);
    this.state = 'patrol';
    this.meter = 0;
    this.waiting = 0;
    this.stuck = 0;
    this.lastSeen = null;
    this.investigatePoint = null;
    this.lookTimer = 0;
    this.loseTimer = 0;
    this.hearCooldown = 0;
    this.countedSpot = false; // one "spotted" stat per chase
  }

  hear(x, y) {
    if (this.state === 'chase' || this.hearCooldown > 0) return;
    this.investigatePoint = { x, y };
    this.state = 'investigate';
    this.lookTimer = 0;
    this.hearCooldown = 1.2;
    if (this.meter < SUSPICIOUS_AT) this.meter = SUSPICIOUS_AT;
  }

  moveToward(world, tx, ty, speed, dt) {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const want = Math.atan2(dy, dx);
    this.angle += clampTurn(angleDelta(want, this.angle), dt * 7);
    const step = Math.min(dist, speed * dt);
    const before = { x: this.x, y: this.y };
    world.moveCircle(this, Math.cos(this.angle) * step, Math.sin(this.angle) * step);
    const moved = Math.hypot(this.x - before.x, this.y - before.y);
    this.stuck = moved < step * 0.25 ? this.stuck + dt : 0;
    return dist <= Math.max(6, step + 2);
  }

  update(dt, world, player, events) {
    this.hearCooldown = Math.max(0, this.hearCooldown - dt);
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const sees = canSee(world, this.x, this.y, this.angle, VISION_RANGE, VISION_HALF_ANGLE, player.x, player.y);

    // --- the detection meter -------------------------------------------
    if (sees) {
      this.meter = Math.min(1, this.meter + detectionRate(world, player, distToPlayer, VISION_RANGE) * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.loseTimer = 0;
    } else {
      this.meter = Math.max(0, this.meter - DETECT_DECAY * dt);
      this.loseTimer += dt;
    }

    if (this.meter >= 1 && this.state !== 'chase') {
      this.state = 'chase';
      if (!this.countedSpot) { events.push('spotted'); this.countedSpot = true; }
      events.push('alarm-sting');
    }

    // --- hearing: a walking player's steps carry ------------------------
    if (player.noise > 0 && this.state !== 'chase' && distToPlayer < player.noise + this.r) {
      this.hear(player.x, player.y);
    }

    // --- behaviour -------------------------------------------------------
    switch (this.state) {
      case 'patrol': {
        if (this.meter >= SUSPICIOUS_AT) {
          this.state = 'suspicious';
          break;
        }
        if (this.waiting > 0) { this.waiting -= dt; break; }
        const target = this.path[this.wp];
        if (this.moveToward(world, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
          this.wp = (this.wp + 1) % this.path.length;
          this.waiting = this.waitTime;
        }
        break;
      }
      case 'suspicious': {
        // Stop and stare at whatever caught the eye.
        if (this.lastSeen) {
          const want = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
          this.angle += clampTurn(angleDelta(want, this.angle), dt * 5);
        }
        if (this.meter <= 0.05) { this.state = 'return'; }
        else if (!sees && this.loseTimer > 0.9) {
          this.investigatePoint = this.lastSeen;
          this.state = 'investigate';
          this.lookTimer = 0;
        }
        break;
      }
      case 'investigate': {
        const p = this.investigatePoint ?? this.lastSeen;
        if (!p) { this.state = 'return'; break; }
        if (this.lookTimer > 0 || this.moveToward(world, p.x, p.y, GUARD_SEARCH_SPEED, dt)) {
          this.lookTimer += dt;
          this.angle += Math.sin(this.lookTimer * 2.6) * dt * 1.9; // sweep the room
          if (this.lookTimer > 1.7) { this.state = 'return'; this.lookTimer = 0; this.meter = Math.min(this.meter, 0.3); }
        }
        if (this.stuck > 1.1) { this.state = 'return'; this.stuck = 0; }
        if (this.meter >= SUSPICIOUS_AT && sees) this.state = 'suspicious';
        break;
      }
      case 'chase': {
        const target = sees || this.loseTimer < 0.4 ? player : this.lastSeen;
        if (target) this.moveToward(world, target.x, target.y, GUARD_CHASE_SPEED, dt);
        if (distToPlayer < this.r + player.r + 2) { events.push('caught'); return; }
        if (this.loseTimer > LOSE_SIGHT_TIME) {
          this.state = 'investigate';
          this.investigatePoint = this.lastSeen;
          this.lookTimer = 0;
          this.meter = 0.55;
          this.countedSpot = false;
        }
        if (this.stuck > 1.4) { this.state = 'investigate'; this.investigatePoint = this.lastSeen; this.lookTimer = 0; this.stuck = 0; }
        break;
      }
      case 'return': {
        // Head for the nearest waypoint, then fall back into the route.
        let best = 0, bestDist = Infinity;
        this.path.forEach((p, i) => {
          const d = Math.hypot(p.x - this.x, p.y - this.y);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        if (this.moveToward(world, this.path[best].x, this.path[best].y, GUARD_SEARCH_SPEED, dt) || this.stuck > 1.1) {
          this.wp = best;
          this.state = 'patrol';
          this.stuck = 0;
          this.meter = Math.min(this.meter, 0.2);
        }
        break;
      }
    }
  }
}

function clampTurn(delta, maxTurn) {
  return Math.max(-maxTurn, Math.min(maxTurn, delta));
}
