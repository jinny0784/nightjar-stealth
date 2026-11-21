// Nightjar staged scenes for screenshots: ?shot=<name> freezes the game
// into a composed, deterministic frame (the maker's screenshot rig, also
// handy for eyeballing a level). Names match shots.json at the repo root.

import { TILE } from './config.js';

const at = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });

export function stageShot(game, name) {
  if (name === 'start') {
    game.loadLevel(0);
    game.state = 'title';
    return;
  }
  if (name === 'play') {
    game.loadLevel(0);
    game.state = 'play';
    // Wren sneaks along the grand corridor behind a crate while the
    // corridor guard walks toward her, cone sweeping the lamplight.
    const p = at(9, 8);
    game.player.x = p.x; game.player.y = p.y;
    game.player.sneaking = true;
    game.player.angle = 0;
    const g = game.guards[0];
    const gp = at(16, 6);
    g.x = gp.x; g.y = gp.y;
    g.angle = Math.PI; // walking west, toward Wren
    g.meter = 0.3;
    const g2 = game.guards[1];
    const g2p = at(23, 2);
    g2.x = g2p.x; g2.y = g2p.y;
    g2.angle = Math.PI / 2;
    game.levelTime = 34;
    return;
  }
  if (name === 'alert') {
    game.loadLevel(1);
    game.state = 'play';
    // The gallery guard has half-seen Wren by the vault door: "?" up,
    // meter high, camera cone swinging across the corridor.
    const p = at(21, 12);
    game.player.x = p.x; game.player.y = p.y;
    game.player.angle = -Math.PI / 2;
    const g = game.guards[1];
    const gp = at(23, 11);
    g.x = gp.x; g.y = gp.y;
    g.angle = Math.atan2(p.y - gp.y, p.x - gp.x);
    g.state = 'suspicious';
    g.meter = 0.72;
    g.lastSeen = { x: p.x, y: p.y };
    game.cameras[0].angle = 1.1;
    game.cameras[0].seesPlayer = false;
    game.alarmMeter = 0.4;
    game.levelTime = 61;
    return;
  }
  if (name === 'end') {
    game.loadLevel(2);
    game.stats = { time: 296, spotted: 1, alarms: 0, coinsUsed: 4, floors: 3 };
    game.state = 'done';
    return;
  }
  game.loadLevel(0);
  game.state = 'title';
}
