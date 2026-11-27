// GOBBLE & GONE — boot and the one loop. Input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast one),
// and the renderer paints what is there. The game moves between four screens:
// title, play, paused and game over.
//
// ?seed=N fixes the farm's pattern. ?shot=title|play|dodge|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CAUGHT, EVENT_CORN, EVENT_DODGE, EVENT_ESCAPED, EVENT_FEATHER, EVENT_HIDE, EVENT_HIT, EVENT_STAGE } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createSound } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

// Test hooks: the play-tester and the screenshot runner read these.
window.__game = { state: world.state, screen: SCREEN_TITLE, seed };
window.__shotReady = false;

function runShot(name) {
  const scene = stageShot(name, world);
  window.__game.screen = scene.screen;
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, scene.popups || [], sound.muted, world.state.elapsed);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  const startTime = last;
  let popups = [];
  window.__game.screen = screen;

  function announce(message) {
    status.textContent = message;
  }

  function addPopup(text, color, big) {
    const p = world.state.player;
    popups.push({ text, x: p.x + 40, y: p.y - 24, at: world.state.elapsed, color: color || '#ffd94d', big: !!big });
    if (popups.length > 6) popups.shift();
  }

  function startGame() {
    sound.unlock();
    world.reset();
    popups = [];
    accumulator = 0;
    screen = SCREEN_PLAY;
    window.__game.screen = screen;
    sound.gobble();
    announce(`Playing. ${LIVES} lives. Run ${1000} metres to the forest gate.`);
  }

  function endGame(escaped) {
    screen = SCREEN_OVER;
    window.__game.screen = screen;
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    if (escaped) sound.escaped();
    else sound.caught();
    announce(escaped
      ? `Escaped! Final score ${Math.floor(world.state.score)}. Best ${best}.`
      : `Caught. Final score ${Math.floor(world.state.score)}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sound.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      sound.click();
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      window.__game.screen = screen;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      window.__game.screen = screen;
      announce('Playing.');
    }
  }

  function react(events) {
    if (events & EVENT_HIT) {
      sound.hit();
      addPopup('OUCH!', '#ff7a5c', true);
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_CORN) sound.corn();
    if (events & EVENT_FEATHER) {
      sound.feather();
      addPopup('GOLDEN FEATHER +25', '#ffd94d', false);
    }
    if (events & EVENT_DODGE) {
      sound.dodge();
      addPopup('DODGED! +5', '#7ddb6a', false);
    }
    if (events & EVENT_HIDE) {
      sound.hide();
      addPopup('HIDDEN! +15', '#7ddb6a', true);
    }
    if (events & EVENT_STAGE) {
      sound.gobble();
    }
    if (events & EVENT_CAUGHT) endGame(false);
    else if (events & EVENT_ESCAPED) endGame(true);
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { jump: false, slide: false, dash: false, move: 0 }, true);
      return;
    }
    const ctl = {
      jump: input.takeJump(),
      slide: input.slide(),
      dash: input.takeDash(),
      move: input.move(canvas.getBoundingClientRect()),
    };
    if (ctl.jump && world.state.player.onGround && !world.state.player.hiding) sound.jump();
    if (ctl.slide && world.state.player.onGround) sound.slide();
    if (ctl.dash) sound.dash();
    const events = world.step(STEP, ctl, false);
    react(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    const time = (now - startTime) / 1000;
    renderer.draw(world.state, screen, best, popups, sound.muted, time);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      window.__game.screen = screen;
      announce('Paused.');
    }
  });

  announce('Gobble and Gone. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
