# nightjar-stealth

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/jinny0784/nightjar-stealth/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/jinny0784/nightjar-stealth/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Nightjar** is a top-down stealth game set in Ashworth Manor. You are Wren, a nightjar of an infiltrator: slip through three guarded floors, photograph each floor's ledger, and reach the exit unseen.

Guards walk learnable patrol routes and see with true vision cones — line of sight is raycast against walls, crates and hedges, so cover really works. Detection is a meter, not a switch: it fills faster up close, faster in lamplight, slower in shadow and slower while you sneak, and it drains when you break sight, so a near miss can still be recovered. Guards investigate noises — your footsteps carry, and a tossed coin (three per floor) pulls a guard where you want him. Sweeping security cameras fill a house alarm meter that sends every guard to your position. Get caught and the floor restarts; finish all three floors for a rating — Ghost if you were never seen at all.

**How to play:** WASD or arrow keys move, hold **Shift** to sneak (slow, silent, harder to see), **click** to toss a coin to that spot, stand still beside the golden ledger to photograph it, then reach the green EXIT. Everything runs offline from static files; all sound is synthesized in WebAudio.

The source is split one job per file under `game/src/`: `world.js` (tiles, collision, sight lines), `vision.js` (cones and the detection model), `guards.js` (the patrol/suspicion/chase state machine), `cameras.js`, `player.js`, `levels.js` (the three floors), `render.js`, `audio.js`, `game.js` (campaign flow and scoring) and `shots.js` (the staged `?shot=` scenes used for the screenshots).

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

Hand the entry in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
