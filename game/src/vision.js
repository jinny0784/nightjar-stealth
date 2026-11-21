// Nightjar vision: who can see the player, and how fast they are noticed.
// Detection is a meter, not a switch — distance, lamplight, shadow and
// sneaking all bend the rate, so a near miss is recoverable.

import {
  DETECT_BASE, DETECT_CLOSE, LIGHT_MULT, SHADOW_MULT, SNEAK_MULT,
} from './config.js';

export function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the target stands inside the observer's cone with a clear line.
export function canSee(world, ox, oy, facing, range, halfAngle, tx, ty) {
  const dx = tx - ox, dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist > 14 && Math.abs(angleDelta(Math.atan2(dy, dx), facing)) > halfAngle) return false;
  return world.sightClear(ox, oy, tx, ty);
}

// Detection fill per second for an observer who can see the player.
export function detectionRate(world, player, dist, range) {
  const closeness = 1 - Math.min(1, dist / range);
  let rate = DETECT_BASE + DETECT_CLOSE * closeness * closeness;
  const tile = world.tileAtPixel(player.x, player.y);
  if (tile === 'L') rate *= LIGHT_MULT;
  if (tile === 's') rate *= SHADOW_MULT;
  if (player.sneaking) rate *= SNEAK_MULT;
  return rate;
}

// The polygon of a vision cone, clipped by walls — drawn by the renderer
// and shaped exactly like the sight test above.
export function conePolygon(world, x, y, facing, range, halfAngle) {
  const points = [[x, y]];
  const rays = 26;
  for (let i = 0; i <= rays; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / rays;
    const d = world.rayDistance(x, y, a, range);
    points.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
  }
  return points;
}
