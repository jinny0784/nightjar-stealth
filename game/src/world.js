// Nightjar world: turns a level's letter grid into tiles the rest of the
// game can query — solidity for movement, opacity for sight, and the
// special tiles (start, ledger, exit) the objectives hang off.

import { TILE, COLS, ROWS } from './config.js';

const SOLID = new Set(['#', 'C', 'H']);   // blocks movement and sight
const OPAQUE = new Set(['#', 'C', 'H', 'D']); // doorways block sight lines

export class World {
  constructor(level) {
    this.name = level.name;
    this.brief = level.brief;
    this.par = level.par;
    this.tiles = [];
    this.start = null;
    this.ledger = null;
    this.exit = null;
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) {
        const ch = level.grid[y][x];
        row.push(ch);
        const centre = { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
        if (ch === 'P') this.start = centre;
        if (ch === 'O') this.ledger = centre;
        if (ch === 'X') this.exit = centre;
      }
      this.tiles.push(row);
    }
    this.guardSpecs = level.guards;
    this.cameraSpecs = level.cameras;
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return this.tiles[ty][tx];
  }

  tileAtPixel(px, py) {
    return this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE));
  }

  isSolid(tx, ty) { return SOLID.has(this.tileAt(tx, ty)); }
  isOpaque(tx, ty) { return OPAQUE.has(this.tileAt(tx, ty)); }

  // Move a circle by (dx, dy), sliding along walls axis by axis.
  moveCircle(body, dx, dy) {
    if (dx !== 0) {
      const nx = body.x + dx;
      if (!this.circleHits(nx, body.y, body.r)) body.x = nx;
    }
    if (dy !== 0) {
      const ny = body.y + dy;
      if (!this.circleHits(body.x, ny, body.r)) body.y = ny;
    }
  }

  circleHits(px, py, r) {
    const minTx = Math.floor((px - r) / TILE), maxTx = Math.floor((px + r) / TILE);
    const minTy = Math.floor((py - r) / TILE), maxTy = Math.floor((py + r) / TILE);
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (!this.isSolid(tx, ty)) continue;
        const cx = Math.max(tx * TILE, Math.min(px, tx * TILE + TILE));
        const cy = Math.max(ty * TILE, Math.min(py, ty * TILE + TILE));
        const ddx = px - cx, ddy = py - cy;
        if (ddx * ddx + ddy * ddy < r * r) return true;
      }
    }
    return false;
  }

  // Straight-line sight between two points, sampled finely enough that a
  // single opaque tile anywhere along the line blocks the view.
  sightClear(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 6));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.isOpaque(Math.floor((x0 + dx * t) / TILE), Math.floor((y0 + dy * t) / TILE))) return false;
    }
    return true;
  }

  // How far a sight ray travels before it hits something opaque.
  rayDistance(x, y, angle, maxDist) {
    const step = 5;
    let d = step;
    while (d < maxDist) {
      const px = x + Math.cos(angle) * d, py = y + Math.sin(angle) * d;
      if (this.isOpaque(Math.floor(px / TILE), Math.floor(py / TILE))) return d;
      d += step;
    }
    return maxDist;
  }
}
