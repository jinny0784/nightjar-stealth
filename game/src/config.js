// Nightjar tuning: every speed, range and rate the game runs on lives here.

export const TILE = 40;               // pixels per map tile
export const COLS = 28;               // map width in tiles
export const ROWS = 17;               // map height in tiles
export const FIELD_X = 20;            // playfield offset on the canvas
export const FIELD_Y = 52;
export const CANVAS_W = 1160;
export const CANVAS_H = 740;

export const PLAYER_RADIUS = 13;
export const WALK_SPEED = 134;        // px per second, quiet steps
export const SNEAK_SPEED = 76;        // px per second while holding Shift
export const WALK_NOISE = 40;         // hearing radius while walking
export const SNEAK_NOISE = 0;         // sneaking is silent

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_SEARCH_SPEED = 96;
export const GUARD_CHASE_SPEED = 148;

export const VISION_RANGE = 168;      // guard sight distance, px
export const VISION_HALF_ANGLE = 0.56; // radians, ~32 degrees each side
export const CAMERA_RANGE = 150;
export const CAMERA_HALF_ANGLE = 0.42;

export const DETECT_BASE = 0.55;      // detection fill per second at mid range
export const DETECT_CLOSE = 1.9;      // extra fill when very close
export const DETECT_DECAY = 0.5;      // meter drain per second when unseen
export const SUSPICIOUS_AT = 0.45;     // meter level where a guard investigates
export const CAMERA_DETECT = 0.34;    // cameras fill the alarm meter slower

export const LIGHT_MULT = 1.65;       // detection multiplier standing in lamplight
export const SHADOW_MULT = 0.42;      // detection multiplier hiding in shadow
export const SNEAK_MULT = 0.55;       // detection multiplier while sneaking
export const COIN_HEARING = 190;      // guards within this of a coin toss investigate
export const COIN_TOSS_RANGE = 280;   // how far the player can throw
export const COINS_PER_LEVEL = 3;

export const PHOTOGRAPH_TIME = 1.2;   // seconds standing on the ledger to copy it
export const LOSE_SIGHT_TIME = 2.4;   // seconds unseen before a chase cools down

export const COLOURS = {
  floorA: '#2a2f3a', floorB: '#262b35',
  carpet: '#4a2436', carpetEdge: '#5d2d44',
  wall: '#12151d', wallTop: '#3d4457', wallFace: '#1b1f2a',
  cover: '#6b543a', coverTop: '#8a6d4b',
  hedge: '#274a2c', hedgeTop: '#356b3c',
  shadow: 'rgba(6,8,14,0.55)',
  lightPool: 'rgba(255,196,92,0.16)',
  exit: '#39d98a', ledger: '#ffd75e',
  player: '#e8ecf4', playerCoat: '#31517d',
  guard: '#c94f4f', guardDark: '#8e3232',
  camera: '#d8b13c',
  coneCalm: 'rgba(255,214,102,0.20)',
  coneSuspicious: 'rgba(255,150,60,0.30)',
  coneAlert: 'rgba(255,70,60,0.34)',
  cameraCone: 'rgba(120,200,255,0.16)',
  ink: '#e8ecf4', dim: '#9aa4b5', accent: '#ffd75e',
};
