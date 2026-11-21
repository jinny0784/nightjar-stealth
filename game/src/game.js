// Nightjar game: owns the campaign — floors, objectives, the alarm
// meter, coin distractions, scoring and the screen-to-screen flow.

import { LEVELS } from './levels.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { SweepCamera } from './cameras.js';
import { drawScene, drawPanel } from './render.js';
import {
  TILE, FIELD_X, FIELD_Y, COIN_TOSS_RANGE, COIN_HEARING, PHOTOGRAPH_TIME,
} from './config.js';

export class Game {
  constructor(sfx) {
    this.sfx = sfx;
    this.state = 'title'; // title | play | caught | clear | done
    this.levelIndex = 0;
    this.stats = { time: 0, spotted: 0, alarms: 0, coinsUsed: 0, floors: 0 };
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.world = new World(LEVELS[index]);
    this.player = new Player(this.world.start);
    this.guards = this.world.guardSpecs.map(spec => new Guard(spec));
    this.cameras = this.world.cameraSpecs.map(spec => new SweepCamera(spec));
    this.alarmMeter = 0;
    this.objectiveDone = false;
    this.photoProgress = 0;
    this.levelTime = 0;
    this.time = 0;
    this.fx = [];
  }

  resetCampaign() {
    this.stats = { time: 0, spotted: 0, alarms: 0, coinsUsed: 0, floors: 0 };
    this.loadLevel(0);
  }

  // Enter / click on a panel screen moves the story on.
  advance() {
    if (this.state === 'title') { this.resetCampaign(); this.state = 'play'; }
    else if (this.state === 'caught') { this.loadLevel(this.levelIndex); this.state = 'play'; }
    else if (this.state === 'clear') {
      if (this.levelIndex + 1 < LEVELS.length) { this.loadLevel(this.levelIndex + 1); this.state = 'play'; }
      else this.state = 'done';
    } else if (this.state === 'done') { this.state = 'title'; }
  }

  tossCoin(px, py) {
    if (this.state !== 'play' || this.player.coins <= 0) return;
    const x = px - FIELD_X, y = py - FIELD_Y;
    const dist = Math.hypot(x - this.player.x, y - this.player.y);
    if (dist > COIN_TOSS_RANGE) return;
    if (this.world.isSolid(Math.floor(x / TILE), Math.floor(y / TILE))) return;
    this.player.coins--;
    this.stats.coinsUsed++;
    this.fx.push({ x, y, t: 0 });
    this.sfx.play('coin');
    for (const guard of this.guards) {
      if (Math.hypot(guard.x - x, guard.y - y) < COIN_HEARING) guard.hear(x, y);
    }
  }

  raiseAlarm() {
    this.stats.alarms++;
    this.alarmMeter = 0.3;
    this.sfx.play('alarm-sting');
    for (const guard of this.guards) {
      if (guard.state !== 'chase') {
        guard.investigatePoint = { x: this.player.x, y: this.player.y };
        guard.state = 'investigate';
        guard.lookTimer = 0;
      }
    }
  }

  update(dt, input) {
    this.time += dt;
    for (const fx of this.fx) fx.t += dt;
    this.fx = this.fx.filter(fx => fx.t < 0.7);
    if (this.state !== 'play') return;

    this.levelTime += dt;
    this.stats.time += dt;
    const events = [];
    this.player.update(dt, this.world, input, events);

    for (const guard of this.guards) guard.update(dt, this.world, this.player, events);
    for (const cam of this.cameras) cam.update(dt, this.world, this.player, this);
    this.alarmMeter = Math.max(0, this.alarmMeter - 0.22 * dt);
    if (this.alarmMeter >= 1) this.raiseAlarm();

    for (const e of events) {
      if (e === 'spotted') this.stats.spotted++;
      else if (e === 'caught') {
        this.state = 'caught';
        this.sfx.play('caught');
      } else this.sfx.play(e);
    }
    if (this.state !== 'play') return;

    // Photograph the ledger: stand close and hold still for a moment.
    if (!this.objectiveDone && this.world.ledger) {
      const d = Math.hypot(this.player.x - this.world.ledger.x, this.player.y - this.world.ledger.y);
      if (d < 32 && !this.player.moving) {
        this.photoProgress += dt / PHOTOGRAPH_TIME;
        if (this.photoProgress >= 1) {
          this.objectiveDone = true;
          this.photoProgress = 0;
          this.sfx.play('page');
        }
      } else {
        this.photoProgress = Math.max(0, this.photoProgress - dt * 1.5);
      }
    }

    // Slip out.
    if (this.objectiveDone && this.world.exit) {
      const d = Math.hypot(this.player.x - this.world.exit.x, this.player.y - this.world.exit.y);
      if (d < 26) {
        this.stats.floors++;
        this.state = this.levelIndex + 1 < LEVELS.length ? 'clear' : 'done';
        this.sfx.play('clear');
      }
    }
  }

  rating() {
    const par = LEVELS.reduce((sum, l) => sum + l.par, 0);
    if (this.stats.spotted === 0 && this.stats.alarms === 0) return 'GHOST — never seen, never heard';
    if (this.stats.spotted <= 2 && this.stats.alarms === 0) return 'SHADOW — barely a rumour';
    if (this.stats.time <= par * 1.4) return 'PROFESSIONAL — messy, but paid';
    return 'SURVIVOR — the manor remembers you';
  }

  render(ctx) {
    drawScene(ctx, this);
    if (this.state === 'title') {
      drawPanel(ctx, {
        title: 'NIGHTJAR',
        lines: [
          'Ashworth Manor keeps its secrets behind guarded doors.',
          'You are Wren. Slip in, photograph each floor\u2019s ledger, vanish.',
          '',
          'Move: WASD / arrows · Sneak: hold Shift · Distract: click to toss a coin',
          'Stay out of the light cones. Shadow and patience are armour.',
        ],
        foot: 'Press Enter or click to begin',
      });
    } else if (this.state === 'caught') {
      drawPanel(ctx, {
        title: 'CAUGHT',
        lines: [
          'A guard\u2019s hand closes on your collar.',
          'The manor keeps its ledger tonight.',
        ],
        foot: 'Press Enter or click to try the floor again',
        accent: '#ff5040',
      });
    } else if (this.state === 'clear') {
      drawPanel(ctx, {
        title: 'FLOOR CLEAR',
        lines: [
          `${this.world.name} — done in ${Math.floor(this.levelTime)}s (par ${this.world.par}s).`,
          `Spotted so far: ${this.stats.spotted} · Alarms: ${this.stats.alarms}`,
        ],
        foot: 'Press Enter or click for the next floor',
        accent: '#39d98a',
      });
    } else if (this.state === 'done') {
      const mins = Math.floor(this.stats.time / 60), secs = Math.floor(this.stats.time % 60);
      drawPanel(ctx, {
        title: 'THE NIGHTJAR FILES',
        lines: [
          'All three ledgers photographed. The manor never knew.',
          '',
          `Total time ${mins}:${String(secs).padStart(2, '0')} · Spotted ${this.stats.spotted}× · Alarms ${this.stats.alarms}`,
          `Coins tossed ${this.stats.coinsUsed}`,
          '',
          `Rating: ${this.rating()}`,
        ],
        foot: 'Press Enter or click to play again',
        accent: '#39d98a',
      });
    }
  }
}
