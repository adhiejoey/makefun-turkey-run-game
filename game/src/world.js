// The game's rules and state, with no drawing and no browser in it: the turkey,
// the farmer closing in behind, the obstacles and treats scrolling past, the
// three stages, the score, the lives and the escape. step() advances one fixed
// step and returns what happened as bit flags, so the caller can react (sound,
// popups, screens) without the world knowing about any of them.
import {
  FARMER, FIELD, GOAL_M, LIVES, PX_PER_M, SCORE, SPAWN, SPEED, STAGES, TURKEY, TURKEY_X,
} from './config.js';
import { weightedPick } from './random.js';

export const KIND_FENCE = 0;
export const KIND_PUMPKIN = 1;
export const KIND_OVEN = 2;
export const KIND_SWING_KNIFE = 3;
export const KIND_FALL_KNIFE = 4;
export const KIND_HAY = 5;
export const KIND_CORN = 6;
export const KIND_FEATHER = 7;

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_FEATHER = 4;
export const EVENT_DODGE = 8;
export const EVENT_HIDE = 16;
export const EVENT_CAUGHT = 32;
export const EVENT_ESCAPED = 64;
export const EVENT_STAGE = 128;

export const POOL_SIZE = 48;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function stageFor(distanceM) {
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (distanceM >= STAGES[i].from) return i;
  }
  return 0;
}

export function createWorld(random) {
  const player = {
    x: TURKEY_X, y: FIELD.groundY - TURKEY.height, width: TURKEY.width, height: TURKEY.height,
    vy: 0, onGround: true, sliding: false, slideTimer: 0, hiding: false, hideTimer: 0,
    invulnerable: 0, dashTimer: 0, dashCooldown: 0, runPhase: 0,
  };
  const things = [];
  for (let i = 0; i < POOL_SIZE; i += 1) {
    things.push({
      active: false, kind: KIND_FENCE, x: 0, y: 0, width: 0, height: 0,
      passed: false, scored: false, swing: 0, fallSpeed: 0, telegraph: 0,
    });
  }
  const state = {
    player, things, score: 0, lives: LIVES, distanceM: 0, stage: 0,
    elapsed: 0, speed: SPEED.base, gap: FARMER.startGap, over: false, escaped: false,
    spawnTimer: SPAWN.first, cornTimer: SPAWN.cornEvery, cornEaten: 0, dodges: 0,
    hides: 0, bestCombo: 0, combo: 0, stageAnnounced: -1, stageAt: 0,
  };

  function reset() {
    player.x = TURKEY_X;
    player.y = FIELD.groundY - TURKEY.height;
    player.vy = 0;
    player.onGround = true;
    player.sliding = false;
    player.slideTimer = 0;
    player.hiding = false;
    player.hideTimer = 0;
    player.invulnerable = 0;
    player.dashTimer = 0;
    player.dashCooldown = 0;
    player.runPhase = 0;
    for (const t of things) t.active = false;
    state.score = 0;
    state.lives = LIVES;
    state.distanceM = 0;
    state.stage = 0;
    state.elapsed = 0;
    state.speed = SPEED.base;
    state.gap = FARMER.startGap;
    state.over = false;
    state.escaped = false;
    state.spawnTimer = SPAWN.first;
    state.cornTimer = SPAWN.cornEvery;
    state.cornEaten = 0;
    state.dodges = 0;
    state.hides = 0;
    state.bestCombo = 0;
    state.combo = 0;
    state.stageAnnounced = 0;
    state.stageAt = 0;
  }

  function freeThing() {
    for (let i = 0; i < things.length; i += 1) if (!things[i].active) return things[i];
    return null;
  }

  function place(t, kind, width, height) {
    t.active = true;
    t.kind = kind;
    t.width = width;
    t.height = height;
    t.x = FIELD.width + 60 + random() * 120;
    t.y = FIELD.groundY - height;
    t.passed = false;
    t.scored = false;
    t.swing = random() * Math.PI * 2;
    t.fallSpeed = 0;
    t.telegraph = 0;
  }

  function spawnObstacle() {
    const t = freeThing();
    if (!t) return;
    const table = state.stage === 2
      ? [[3, KIND_OVEN], [3, KIND_SWING_KNIFE], [2, KIND_FALL_KNIFE], [2, KIND_FENCE], [1, KIND_PUMPKIN], [1, KIND_HAY]]
      : state.stage === 1
        ? [[3, KIND_FENCE], [2, KIND_PUMPKIN], [2, KIND_SWING_KNIFE], [1, KIND_FALL_KNIFE], [2, KIND_HAY]]
        : [[3, KIND_FENCE], [3, KIND_PUMPKIN], [2, KIND_HAY], [1, KIND_SWING_KNIFE]];
    const kind = weightedPick(random, table);
    if (kind === KIND_FENCE) place(t, kind, 34, 96);
    else if (kind === KIND_PUMPKIN) place(t, kind, 62, 52);
    else if (kind === KIND_OVEN) place(t, kind, 150, 118);
    else if (kind === KIND_SWING_KNIFE) { place(t, kind, 30, 150); t.y = 150; }
    else if (kind === KIND_FALL_KNIFE) { place(t, kind, 26, 120); t.y = -140; t.telegraph = 0.55; }
    else place(t, KIND_HAY, 120, 66);
  }

  function spawnTreat() {
    const t = freeThing();
    if (!t) return;
    if (random() < 0.16) {
      place(t, KIND_FEATHER, 34, 34);
      t.y = FIELD.groundY - 190 - random() * 90;
    } else {
      place(t, KIND_CORN, 36, 36);
      // Corn comes in little arcs: low, mid or high, so jumps earn treats.
      t.y = FIELD.groundY - 46 - Math.floor(random() * 3) * 78;
    }
  }

  function turkeyBox() {
    if (player.hiding) return { x: player.x + 14, y: FIELD.groundY - 20, width: 46, height: 20 };
    if (player.sliding) return { x: player.x + 4, y: FIELD.groundY - 30, width: 82, height: 30 };
    return { x: player.x + 8, y: player.y + 6, width: 58, height: player.height - 6 };
  }

  function hitBoxOf(t) {
    if (t.kind === KIND_SWING_KNIFE) {
      // The blade sweeps; its danger box follows the swing angle.
      const swing = Math.sin(t.swing) * 62;
      return { x: t.x + swing - 8, y: 300, width: 16, height: 210 };
    }
    if (t.kind === KIND_FALL_KNIFE) {
      return { x: t.x, y: t.y, width: t.width, height: t.height };
    }
    if (t.kind === KIND_OVEN) return { x: t.x + 6, y: t.y + 10, width: t.width - 12, height: t.height - 10 };
    if (t.kind === KIND_HAY) return { x: t.x + 8, y: t.y + 8, width: t.width - 16, height: t.height - 8 };
    return { x: t.x + 4, y: t.y + 4, width: t.width - 8, height: t.height - 4 };
  }

  // One fixed step. `ctl` carries the frame's controls: { jump, slide, dash, move }.
  // `harmless` is the title screen's attract mode: things scroll, nothing scores.
  function step(dt, ctl, harmless) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;
    player.runPhase += dt * (state.speed / 34);

    // Sidestep: the turkey can run left and right across the lane, which is
    // how a falling knife is dodged — by simply not being underneath it.
    if (!player.hiding && ctl.move) {
      player.x = Math.min(TURKEY.maxX, Math.max(TURKEY.minX, player.x + ctl.move * TURKEY.moveSpeed * dt));
    }

    // Speed ramps with stage and time; a dash briefly doubles it.
    const stage = stageFor(state.distanceM);
    if (stage !== state.stage) {
      state.stage = stage;
      if (!harmless && state.stageAnnounced !== stage) {
        state.stageAnnounced = stage;
        state.stageAt = state.elapsed;
        events |= EVENT_STAGE;
      }
    }
    let speed = Math.min(SPEED.max, SPEED.base + SPEED.perStage * state.stage + SPEED.perSecond * state.elapsed);
    if (player.dashTimer > 0) {
      player.dashTimer -= dt;
      speed *= 1.55;
    }
    if (player.dashCooldown > 0) player.dashCooldown -= dt;
    state.speed = speed;

    // --- turkey vertical physics + slide + hide ---
    if (ctl.jump && player.onGround && !player.hiding) {
      player.vy = TURKEY.jumpVelocity;
      player.onGround = false;
    }
    if (!player.onGround) {
      player.vy += TURKEY.gravity * dt;
      player.y += player.vy * dt;
      if (player.y >= FIELD.groundY - TURKEY.height) {
        player.y = FIELD.groundY - TURKEY.height;
        player.vy = 0;
        player.onGround = true;
      }
    }
    if (ctl.slide && player.onGround && !player.hiding) {
      player.sliding = true;
      player.slideTimer = TURKEY.slideTime;
    }
    if (player.sliding) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0 || !player.onGround) player.sliding = false;
    }
    if (player.invulnerable > 0) player.invulnerable -= dt;

    // Hiding: hold slide while overlapping a hay bale and the turkey ducks in.
    if (player.hideTimer > 0) {
      player.hideTimer -= dt;
      player.hiding = player.hideTimer > 0;
    }

    // --- dash: a burst of speed that also buys a little daylight ---
    if (ctl.dash && player.dashCooldown <= 0 && !player.hiding) {
      player.dashTimer = 0.45;
      player.dashCooldown = 2.2;
      state.gap = Math.min(FARMER.startGap + 60, state.gap + 26);
    }

    // --- the farmer: he gains ground every second, faster after a stumble ---
    if (!harmless) {
      state.gap -= FARMER.creep * dt;
      if (state.gap <= FARMER.catchGap) {
        state.over = true;
        state.escaped = false;
        return events | EVENT_CAUGHT;
      }
    }

    // --- distance and score ---
    if (!harmless) {
      const metres = (speed * dt) / PX_PER_M;
      state.distanceM += metres;
      state.score += metres * SCORE.metre;
      if (state.distanceM >= GOAL_M) {
        state.distanceM = GOAL_M;
        state.over = true;
        state.escaped = true;
        state.score += 500;
        return events | EVENT_ESCAPED;
      }
    }

    // --- spawns ---
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnObstacle();
      const level = Math.min(4, state.stage + Math.floor(state.elapsed / 25));
      state.spawnTimer = Math.max(SPAWN.minInterval, SPAWN.interval - 0.09 * level) * (0.8 + random() * 0.45);
    }
    state.cornTimer -= dt;
    if (state.cornTimer <= 0) {
      spawnTreat();
      state.cornTimer = SPAWN.cornEvery * (0.8 + random() * 0.5);
    }

    // --- move things, collide, count dodges ---
    const box = turkeyBox();
    for (const t of things) {
      if (!t.active) continue;
      t.x -= speed * dt;
      if (t.kind === KIND_SWING_KNIFE) t.swing += dt * (2.4 + state.stage * 0.35);
      if (t.kind === KIND_FALL_KNIFE) {
        if (t.telegraph > 0) {
          t.telegraph -= dt;
        } else {
          t.fallSpeed += 2600 * dt;
          t.y += t.fallSpeed * dt;
        }
      }
      if (t.x + t.width < -80) {
        t.active = false;
        continue;
      }
      // A danger that slips past the turkey unhit is a dodge worth points.
      if (!t.passed && t.x + t.width < player.x) {
        t.passed = true;
        if (!harmless && t.kind !== KIND_CORN && t.kind !== KIND_FEATHER && t.kind !== KIND_HAY) {
          state.score += SCORE.dodge;
          state.dodges += 1;
          state.combo += 1;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          state.gap = Math.min(FARMER.startGap + 60, state.gap + FARMER.dodgeLoss);
          events |= EVENT_DODGE;
        }
      }
      if (harmless || player.invulnerable > 0 || player.hiding) {
        // Hiding in hay: the turkey cannot be hit, and treats pass uncollected.
        if (!harmless && player.hiding && t.kind === KIND_HAY && overlaps(box, hitBoxOf(t))) {
          // already hidden; nothing to do
        }
        continue;
      }
      const hb = hitBoxOf(t);
      if (t.kind === KIND_CORN || t.kind === KIND_FEATHER) {
        if (overlaps(box, hb)) {
          t.active = false;
          if (t.kind === KIND_CORN) {
            state.score += SCORE.corn;
            state.cornEaten += 1;
            state.gap = Math.min(FARMER.startGap + 60, state.gap + FARMER.cornLoss);
            events |= EVENT_CORN;
          } else {
            state.score += SCORE.feather;
            state.gap = Math.min(FARMER.startGap + 60, state.gap + 30);
            events |= EVENT_FEATHER;
          }
        }
        continue;
      }
      if (t.kind === KIND_HAY) {
        // Holding slide while touching hay ducks the turkey inside it.
        if (ctl.slide && player.onGround && overlaps(box, hb) && player.hideTimer <= 0) {
          player.hideTimer = TURKEY.hideTime;
          player.hiding = true;
          state.hides += 1;
          state.score += SCORE.hide;
          state.gap = Math.min(FARMER.startGap + 60, state.gap + FARMER.hideLoss);
          events |= EVENT_HIDE;
        }
        continue;
      }
      if (overlaps(box, hb)) {
        t.active = false;
        state.lives -= 1;
        state.combo = 0;
        state.gap -= FARMER.hitGain;
        player.invulnerable = TURKEY.invulnerable;
        events |= EVENT_HIT;
        if (state.lives <= 0 || state.gap <= FARMER.catchGap) {
          state.over = true;
          state.escaped = false;
          return events | EVENT_CAUGHT;
        }
      }
    }
    return events;
  }

  reset();
  return { state, reset, step, stageFor };
}
