# Gobble & Gone — The Great Thanksgiving Breakout

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/adhiejoey/makefun-turkey-run-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/adhiejoey/makefun-turkey-run-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

An original turkey escape game for the [make.fun bounty "Make the best turkey escape game"](https://make.fun/bounty/turkey-run-game-01) ($250, free entry).

## The game

You are a turkey, and the farmer wants you for Thanksgiving dinner. Run **1,000 metres** from the farmyard, through the barn and the kitchen, to the forest gate — while the farmer chases you with a pitchfork and the kitchen itself tries to stop you.

- **Three stages, one escape:** The Farmyard → The Barn → The Kitchen → The Forest Gate. The run gets faster and the dangers get meaner as you go.
- **The farmer never gives up.** He gains ground every second, and every stumble lets him catch up. Corn, clean dodges and a good hiding spot buy you daylight. If he reaches you, it's dinner.
- **Dodge, jump, hide:** fences and pumpkins to leap, a glowing **oven** to clear, **carving knives** swinging from ropes and falling from above, and hay bales to **hide in** — hold Down at a bale and the farmer loses your trail.
- **Collect:** corn cobs (+10) and rare golden feathers (+25). Dodges (+5) and hides (+15) pay too.
- **HUD:** score, distance to the gate with a progress bar, lives (feathers), a farmer-proximity meter, and the stage name.
- **End screens:** ESCAPED at the forest gate, or CAUGHT — dinner is served, and it is you. Restart with Space or a click.
- **Controls:** keyboard **and** mouse. Jump: Space / ↑ / W / left-click. Slide: ↓ / S / right-click. Move: ← / → or A / D (sidestep a falling knife). Dash: Shift. Hide: hold ↓ at a hay bale. Pause: P. Mute: M.
- **Look & sound:** an isometric 2.5D autumn farm drawn entirely in code (iso barn, fences and hay with top/left/right faces, layered parallax hills, 3D extruded title text), and a fully synthesised WebAudio soundtrack — gobbles, coin chirps, thuds and fanfares. No images, no audio files, no network requests.

## Play it

Serve `game/` with any static server and open `index.html` in a desktop browser:

```sh
npx serve game
# or: python3 -m http.server --directory game 8080
```

## Hand it in

`main.ts` (Node 22+) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

Four real renders of the game running in headless Chromium (1280×720):

1. `1-title.jpg` — title screen
2. `2-play.jpg` — a run in play, HUD live
3. `3-dodge.jpg` — a near-miss dodge
4. `4-end.jpg` — the end screen (caught)

## Files

- `game/index.html`, `game/style.css` — page shell
- `game/src/main.js` — boot, game loop, screens, `?shot=` staging
- `game/src/world.js` — rules: turkey, farmer chase, obstacles, stages, score
- `game/src/render.js` — isometric 2.5D canvas art, HUD, title/end screens
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesised WebAudio sounds
- `game/src/config.js` — all tuning numbers and the palette
- `game/src/random.js` — seeded RNG (repeatable farms)
- `game/src/shots.js` — deterministic screenshot scenes with an autopilot
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `main.ts` — the hand-in program

## License

MIT — see [LICENSE](LICENSE).
