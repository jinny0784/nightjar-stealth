// Nightjar renderer: draws the manor floor, light and shadow, vision
// cones clipped by walls, the cast, and every screen (title, caught,
// floor clear, campaign complete) onto the one canvas.

import {
  TILE, COLS, ROWS, FIELD_X, FIELD_Y, CANVAS_W, CANVAS_H, COLOURS,
  VISION_RANGE, VISION_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE,
} from './config.js';
import { conePolygon } from './vision.js';

function tileRect(tx, ty) {
  return [FIELD_X + tx * TILE, FIELD_Y + ty * TILE, TILE, TILE];
}

export function drawScene(ctx, game) {
  const world = game.world;
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // --- floor ------------------------------------------------------------
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = world.tileAt(tx, ty);
      const [x, y, w, h] = tileRect(tx, ty);
      if (ch === '#') continue;
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLOURS.floorA : COLOURS.floorB;
      ctx.fillRect(x, y, w, h);
      if (ch === ',') {
        ctx.fillStyle = COLOURS.carpet;
        ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
        ctx.strokeStyle = COLOURS.carpetEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
      }
      if (ch === 'D') {
        ctx.fillStyle = '#3a4152';
        ctx.fillRect(x, y, w, h);
      }
      if (ch === 's') {
        ctx.fillStyle = COLOURS.shadow;
        ctx.fillRect(x, y, w, h);
      }
      if (ch === 'L') {
        const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, TILE * 0.95);
        g.addColorStop(0, 'rgba(255,205,100,0.34)');
        g.addColorStop(1, 'rgba(255,205,100,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - TILE / 2, y - TILE / 2, w + TILE, h + TILE);
        ctx.fillStyle = '#ffcf6e';
        ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 3.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // --- exit and ledger ----------------------------------------------------
  drawExit(ctx, world);
  if (world.ledger) drawLedger(ctx, world.ledger, game.objectiveDone, game.time);

  // --- vision cones (under the actors) ------------------------------------
  for (const cam of game.cameras) {
    fillCone(ctx, world, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, COLOURS.cameraCone);
  }
  for (const guard of game.guards) {
    const colour = guard.state === 'chase' ? COLOURS.coneAlert
      : guard.meter >= 0.45 ? COLOURS.coneSuspicious : COLOURS.coneCalm;
    fillCone(ctx, world, guard.x, guard.y, guard.angle, VISION_RANGE, VISION_HALF_ANGLE, colour);
  }

  // --- cover and walls ------------------------------------------------------
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const ch = world.tileAt(tx, ty);
      const [x, y, w, h] = tileRect(tx, ty);
      if (ch === 'C') {
        ctx.fillStyle = COLOURS.cover;
        ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
        ctx.fillStyle = COLOURS.coverTop;
        ctx.fillRect(x + 3, y + 3, w - 6, 7);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
        ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + w - 4, y + h - 4);
        ctx.moveTo(x + w - 4, y + 4); ctx.lineTo(x + 4, y + h - 4); ctx.stroke();
      } else if (ch === 'H') {
        ctx.fillStyle = COLOURS.hedge;
        ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w / 2 - 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLOURS.hedgeTop;
        ctx.beginPath(); ctx.arc(x + w / 2 - 5, y + h / 2 - 6, 9, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w / 2 + 8, y + h / 2 + 3, 7, 0, Math.PI * 2); ctx.fill();
      } else if (ch === '#') {
        ctx.fillStyle = COLOURS.wallFace;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = COLOURS.wallTop;
        ctx.fillRect(x, y, w, 5);
        ctx.fillStyle = COLOURS.wall;
        ctx.fillRect(x, y + h - 4, w, 4);
      }
    }
  }

  // --- coin distractions ----------------------------------------------------
  for (const fx of game.fx) {
    const t = fx.t / 0.7;
    ctx.strokeStyle = `rgba(255,215,94,${1 - t})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(fx.x, fx.y, 6 + t * 46, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath(); ctx.arc(fx.x, fx.y, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  // --- cameras, guards, player ---------------------------------------------
  for (const cam of game.cameras) drawCamera(ctx, cam);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, game.player, game);

  drawHud(ctx, game);
}

function fieldX(px) { return FIELD_X + px; }
function fieldY(py) { return FIELD_Y + py; }

function fillCone(ctx, world, x, y, angle, range, half, colour) {
  const pts = conePolygon(world, x, y, angle, range, half);
  ctx.fillStyle = colour;
  ctx.beginPath();
  pts.forEach(([px, py], i) => {
    const X = fieldX(px), Y = fieldY(py);
    if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
  });
  ctx.closePath(); ctx.fill();
}

function drawExit(ctx, world) {
  if (!world.exit) return;
  const x = fieldX(world.exit.x), y = fieldY(world.exit.y);
  ctx.fillStyle = 'rgba(57,217,138,0.18)';
  ctx.fillRect(x - TILE / 2, y - TILE / 2, TILE, TILE);
  ctx.strokeStyle = COLOURS.exit;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - TILE / 2 + 4, y - TILE / 2 + 4, TILE - 8, TILE - 8);
  ctx.fillStyle = COLOURS.exit;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x, y + 4);
}

function drawLedger(ctx, ledger, done, time) {
  const x = fieldX(ledger.x), y = fieldY(ledger.y);
  if (!done) {
    const pulse = 0.6 + 0.4 * Math.sin(time * 3.2);
    ctx.strokeStyle = `rgba(255,215,94,${0.35 + 0.3 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 17 + 3 * pulse, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = done ? '#7d8aa0' : COLOURS.ledger;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.fillRect(-10, -7, 20, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-2, -7, 3, 14);
  ctx.restore();
  ctx.fillStyle = done ? '#39d98a' : '#0b0e14';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(done ? '✓' : '§', x, y + 3.5);
}

function drawCamera(ctx, cam) {
  const x = fieldX(cam.x), y = fieldY(cam.y);
  ctx.fillStyle = '#20242e';
  ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLOURS.camera;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = cam.seesPlayer ? '#ff5040' : COLOURS.camera;
  ctx.beginPath();
  ctx.arc(x + Math.cos(cam.angle) * 6, y + Math.sin(cam.angle) * 6, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, guard) {
  const x = fieldX(guard.x), y = fieldY(guard.y);
  // body
  ctx.fillStyle = guard.state === 'chase' ? '#e05555' : COLOURS.guard;
  ctx.beginPath(); ctx.arc(x, y, guard.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLOURS.guardDark;
  ctx.beginPath(); ctx.arc(x, y, guard.r - 5, 0, Math.PI * 2); ctx.fill();
  // face / facing tick
  ctx.fillStyle = '#f2d8c9';
  ctx.beginPath();
  ctx.arc(x + Math.cos(guard.angle) * 5, y + Math.sin(guard.angle) * 5, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5f7fa';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(guard.angle) * (guard.r + 5), y + Math.sin(guard.angle) * (guard.r + 5));
  ctx.stroke();
  // detection meter
  if (guard.meter > 0.02) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 15, y - guard.r - 15, 30, 5);
    ctx.fillStyle = guard.meter >= 1 ? '#ff4030' : guard.meter >= 0.45 ? '#ff963c' : '#ffd75e';
    ctx.fillRect(x - 14, y - guard.r - 14, 28 * Math.min(1, guard.meter), 3);
  }
  // state mark
  if (guard.state === 'chase') mark(ctx, x, y - guard.r - 24, '!', '#ff5040');
  else if (guard.state === 'suspicious' || guard.state === 'investigate') mark(ctx, x, y - guard.r - 24, '?', '#ffb03a');
}

function mark(ctx, x, y, text, colour) {
  ctx.fillStyle = colour;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawPlayer(ctx, player, game) {
  const x = fieldX(player.x), y = fieldY(player.y);
  if (player.noise > 0) {
    ctx.strokeStyle = 'rgba(232,236,244,0.20)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, player.noise, 0, Math.PI * 2); ctx.stroke();
  }
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(140,180,255,0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(x, y, player.r + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = COLOURS.playerCoat;
  ctx.beginPath(); ctx.arc(x, y, player.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2d8c9';
  ctx.beginPath();
  ctx.arc(x + Math.cos(player.angle) * 4, y + Math.sin(player.angle) * 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.player;
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WREN', x, y - player.r - 6);
  // photograph channel ring
  if (game.photoProgress > 0 && !game.objectiveDone) {
    ctx.strokeStyle = COLOURS.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, player.r + 9, -Math.PI / 2, -Math.PI / 2 + game.photoProgress * Math.PI * 2);
    ctx.stroke();
  }
}

// --- HUD and full-screen panels --------------------------------------------

function drawHud(ctx, game) {
  ctx.fillStyle = '#10131b';
  ctx.fillRect(0, 0, CANVAS_W, FIELD_Y - 6);
  ctx.fillStyle = COLOURS.accent;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('NIGHTJAR', FIELD_X, 32);
  ctx.fillStyle = COLOURS.ink;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(game.world.name, 130, 32);
  // objective
  ctx.textAlign = 'center';
  ctx.fillStyle = game.objectiveDone ? '#39d98a' : COLOURS.ink;
  ctx.font = 'bold 14px system-ui, sans-serif';
  const objective = game.objectiveDone ? 'Ledger copied — reach the EXIT' : 'Photograph the ledger (§), then reach the EXIT';
  ctx.fillText(objective, CANVAS_W / 2 + 60, 32);
  // coins + time + eye
  ctx.textAlign = 'right';
  ctx.fillStyle = COLOURS.dim;
  ctx.font = '13px system-ui, sans-serif';
  const secs = Math.floor(game.levelTime);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  ctx.fillText(`coins ●×${game.player.coins}    ${clock}`, CANVAS_W - 150, 32);
  const danger = Math.max(game.alarmMeter, ...game.guards.map(g => g.meter), 0);
  ctx.fillStyle = danger > 0.66 ? '#ff5040' : danger > 0.25 ? '#ffb03a' : '#5b6a80';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(danger > 0.02 ? `👁 ${Math.round(danger * 100)}%` : '👁 —', CANVAS_W - 20, 32);
  // alarm bar
  if (game.alarmMeter > 0.01) {
    ctx.fillStyle = 'rgba(255,80,64,0.25)';
    ctx.fillRect(0, FIELD_Y - 6, CANVAS_W * game.alarmMeter, 4);
  }
}

export function drawPanel(ctx, { title, lines, foot, accent = COLOURS.accent }) {
  ctx.fillStyle = 'rgba(5,7,11,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const w = 640, h = 120 + lines.length * 30 + 70;
  const x = (CANVAS_W - w) / 2, y = (CANVAS_H - h) / 2;
  ctx.fillStyle = '#141926';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, CANVAS_W / 2, y + 68);
  ctx.fillStyle = COLOURS.ink;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, CANVAS_W / 2, y + 112 + i * 30));
  if (foot) {
    ctx.fillStyle = COLOURS.dim;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(foot, CANVAS_W / 2, y + h - 22);
  }
}
