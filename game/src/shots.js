// The screenshot scenes behind ?shot=title|play|dodge|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by
// a simple autopilot (jump when a danger is close and the turkey is grounded,
// slide under a falling knife, hide in hay when the farmer is close), so the
// frame is what a real game looks like and the same seed always gives the same
// frame. The dodge scene stops on the first near miss: a danger that slips past
// within a whisker of the turkey.
import { FIELD, STEP, TURKEY } from './config.js';
import { EVENT_CAUGHT, EVENT_ESCAPED, KIND_FALL_KNIFE, KIND_HAY } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;

/** Is a danger close enough ahead that the turkey must act now? */
function dangerAhead(state, horizonPx) {
  const p = state.player;
  let best = null;
  for (const t of state.things) {
    if (!t.active) continue;
    if (t.kind === KIND_HAY) continue;
    const gap = t.x - (p.x + p.width);
    if (gap < 0 || gap > horizonPx) continue;
    if (best === null || gap < best.gap) best = { t, gap };
  }
  return best;
}

function hayAhead(state, horizonPx) {
  const p = state.player;
  for (const t of state.things) {
    if (!t.active || t.kind !== KIND_HAY) continue;
    const gap = t.x - (p.x + p.width);
    if (gap >= -20 && gap <= horizonPx) return t;
  }
  return null;
}

/**
 * One autopilot decision: { jump, slide, dash }. `skill` 1 plays well, 0 plays
 * like a hurried first-timer (late jumps, never hides, never dashes).
 */
function autopilot(state, skill) {
  const p = state.player;
  const ctl = { jump: false, slide: false, dash: false, move: 0 };
  // Falling knife overhead? Sidestep out from under it — the turkey can move.
  for (const t of state.things) {
    if (!t.active || t.kind !== KIND_FALL_KNIFE) continue;
    const overlapsX = t.x + t.width > p.x - 30 && t.x < p.x + p.width + 30;
    if (overlapsX) {
      ctl.move = (t.x + t.width / 2) < (p.x + p.width / 2) ? 1 : -1;
      if (p.x + ctl.move * 40 < TURKEY.minX || p.x + ctl.move * 40 > TURKEY.maxX) ctl.move = -ctl.move;
      return ctl;
    }
  }
  const horizon = skill === 1 ? 340 : 150;
  const danger = dangerAhead(state, horizon);
  if (danger && p.onGround && !p.hiding) {
    ctl.jump = true;
  }
  if (skill === 1 && state.gap < 150) {
    const hay = hayAhead(state, 200);
    if (hay && p.onGround) ctl.slide = true; // hold slide into the hay to hide
    else if (p.dashCooldown <= 0) ctl.dash = true;
  }
  return ctl;
}

/**
 * Set `world` to the named scene and return the screen to draw over it, the
 * best score to show, and any popups the frame should carry.
 */
export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name !== 'play' && name !== 'dodge' && name !== 'end') {
    // Title: let the farm scroll behind the menu for a few seconds.
    for (let i = 0; i < 4 / SAMPLE; i += 1) world.step(SAMPLE, { jump: false, slide: false, dash: false, move: 0 }, true);
    return { screen: SCREEN_TITLE, best: 0, popups: [] };
  }
  const skill = name === 'end' ? 0 : 1;
  const maxSeconds = name === 'end' ? 240 : name === 'dodge' ? 120 : 16;
  const popups = [];
  let nearMiss = false;
  for (let i = 0; i < maxSeconds / SAMPLE; i += 1) {
    const before = state.dodges;
    const events = world.step(SAMPLE, autopilot(state, skill), false);
    if (events & (EVENT_CAUGHT | EVENT_ESCAPED)) break;
    // Dodge scene: stop right after a danger passes within a whisker.
    if (name === 'dodge' && state.dodges > before) {
      const p = state.player;
      popups.push({ text: 'CLOSE ONE! +5', x: p.x + 40, y: p.y - 30, at: state.elapsed, color: '#ffd94d', big: true });
      nearMiss = true;
      break;
    }
    if (name === 'play' && state.distanceM > 175) break;
  }
  const over = state.over;
  const screen = over ? SCREEN_OVER : SCREEN_PLAY;
  const best = over ? Math.floor(state.score) : Math.floor(state.score);
  return { screen, best, popups, nearMiss };
}
