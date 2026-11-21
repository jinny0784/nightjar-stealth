// Nightjar boot: canvas, keyboard and mouse, the frame loop, and the
// ?shot= screenshot mode. Everything else lives in the modules it wires.

import { Game } from './game.js';
import { SoundFX } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');
const sfx = new SoundFX(!shotMode);
const game = new Game(sfx);

const input = { keys: new Set() };

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  input.keys.add(k === 'shift' ? 'shift' : k);
  sfx.unlock();
  if ((k === 'enter' || k === ' ') && game.state !== 'play') game.advance();
});
addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  input.keys.delete(k === 'shift' ? 'shift' : k);
});
canvas.addEventListener('mousedown', (e) => {
  sfx.unlock();
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  if (game.state !== 'play') game.advance();
  else game.tossCoin(x, y);
});

if (shotMode) {
  stageShot(game, shotMode);
  game.render(ctx);
} else {
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(dt, input);
    game.render(ctx);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// Handle for the maker's headless play tests.
window.__nightjar = { game, input };
