// Keyboard and mouse input. Held keys steer; one-shot presses (jump, dash,
// start, pause, mute) are queued as flags and taken once by the loop, so a press
// between two frames is never lost and never counted twice.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const SLIDE_KEYS = new Set(['ArrowDown', 'KeyS']);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const DASH_KEYS = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM_KEYS = new Set(['Space', 'Enter', 'ArrowUp', 'KeyW']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const MUTE_KEYS = new Set(['KeyM']);

export function createInput(canvas) {
  let slideHeld = false;
  let leftHeld = false;
  let rightHeld = false;
  let jumpQueued = false;
  let dashQueued = false;
  let actions = 0;

  function pressJump() {
    jumpQueued = true;
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', (event) => {
    if (JUMP_KEYS.has(event.code)) {
      if (!event.repeat) pressJump();
    } else if (SLIDE_KEYS.has(event.code)) {
      slideHeld = true;
    } else if (LEFT_KEYS.has(event.code)) {
      leftHeld = true;
    } else if (RIGHT_KEYS.has(event.code)) {
      rightHeld = true;
    } else if (DASH_KEYS.has(event.code)) {
      if (!event.repeat) dashQueued = true;
    } else if (CONFIRM_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE_KEYS.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (SLIDE_KEYS.has(event.code)) slideHeld = false;
    else if (LEFT_KEYS.has(event.code)) leftHeld = false;
    else if (RIGHT_KEYS.has(event.code)) rightHeld = false;
  });
  window.addEventListener('blur', () => {
    slideHeld = false;
    leftHeld = false;
    rightHeld = false;
  });

  // Mouse: left click jumps (and starts / restarts), right click slides.
  // Pointer position also steers: holding the pointer left or right of the
  // turkey nudges it, so the whole game is playable on mouse alone.
  let pointerX = null;
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button === 2) {
      slideHeld = true;
    } else {
      pointerX = event.clientX;
      pressJump();
    }
    event.preventDefault();
  });
  canvas.addEventListener('pointerup', (event) => {
    if (event.button === 2) slideHeld = false;
    pointerX = null;
  });
  canvas.addEventListener('pointerleave', () => {
    pointerX = null;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    // -1 / 0 / 1 while sliding is held, plus mouse steering.
    slide() {
      return slideHeld;
    },
    // -1 / 0 / 1 from held A/D or arrow keys, plus mouse steering.
    move(canvasRect) {
      return (rightHeld ? 1 : 0) - (leftHeld ? 1 : 0) || this.pointerSteer(canvasRect);
    },
    pointerSteer(canvasRect) {
      if (pointerX === null || !canvasRect) return 0;
      const centre = canvasRect.left + canvasRect.width * 0.32;
      if (pointerX < centre - 60) return -1;
      if (pointerX > centre + 60) return 1;
      return 0;
    },
    takeJump() {
      const taken = jumpQueued;
      jumpQueued = false;
      return taken;
    },
    takeDash() {
      const taken = dashQueued;
      dashQueued = false;
      return taken;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
