// Everything the eye sees, drawn in code on one canvas: a layered isometric
// farm (sky, sun, clouds, far hills, an iso barn, fences and hay with real top /
// left / right faces), the turkey and the farmer, the oven and the knives, and
// the HUD and screens. The logical playfield is 1280x720 and the canvas scales
// to the window, so the art is identical at any size.
import { FIELD, FONT, GOAL_M, PALETTE, STAGES, TURKEY } from './config.js';
import { KIND_CORN, KIND_FALL_KNIFE, KIND_FEATHER, KIND_FENCE, KIND_HAY, KIND_OVEN, KIND_PUMPKIN, KIND_SWING_KNIFE } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const W = FIELD.width;
  const H = FIELD.height;

  function fit() {
    const dpr = Math.min(1, window.devicePixelRatio || 1);
    const cw = canvas.clientWidth || W;
    const ch = canvas.clientHeight || H;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform((canvas.width / W) * 1, 0, 0, (canvas.height / H) * 1, 0, 0);
  }

  // An isometric box: front face, top face, left face and right face in four
  // shades, so a barn, an oven or a hay bale reads as a solid 3D block.
  function isoBox(x, y, w, h, d, front, left, right) {
    ctx.fillStyle = front;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = left;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + d, y - d + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = right;
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + d, y - d);
    ctx.lineTo(x + w + d, y - d + h);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(front, 1.3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + d, y - d);
    ctx.lineTo(x + w + d, y - d);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
  }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
    const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
    const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
    return `rgb(${r},${g},${b})`;
  }

  function drawSky(stage, t) {
    const s = STAGES[stage];
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    grad.addColorStop(0, s.sky[0]);
    grad.addColorStop(1, s.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, FIELD.groundY + 2);
    // Low autumn sun with a warm halo.
    const sx = 1060;
    const sy = 110;
    const halo = ctx.createRadialGradient(sx, sy, 10, sx, sy, 150);
    halo.addColorStop(0, 'rgba(255,243,176,0.95)');
    halo.addColorStop(1, 'rgba(255,243,176,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(sx - 160, sy - 160, 320, 320);
    ctx.fillStyle = PALETTE.sun;
    ctx.beginPath();
    ctx.arc(sx, sy, 44, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds, two speeds for depth.
    ctx.fillStyle = PALETTE.cloud;
    for (let i = 0; i < 5; i += 1) {
      const cx = ((i * 317 + t * (8 + i * 3)) % 1450) - 80;
      const cy = 60 + i * 34;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, cy + 6, 44, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Far hills, then nearer hills, then the iso barn on the ridge.
    ctx.fillStyle = PALETTE.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, 470);
    ctx.quadraticCurveTo(300, 380, 640, 460);
    ctx.quadraticCurveTo(980, 540, 1280, 440);
    ctx.lineTo(1280, FIELD.groundY);
    ctx.lineTo(0, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.quadraticCurveTo(420, 450, 820, 520);
    ctx.quadraticCurveTo(1080, 560, 1280, 510);
    ctx.lineTo(1280, FIELD.groundY);
    ctx.lineTo(0, FIELD.groundY);
    ctx.closePath();
    ctx.fill();
    drawBarn(990, 470, 1);
    drawTree(180, 500, 0.9, t);
    drawTree(90, 520, 1.15, t);
    drawTree(1150, 505, 0.8, t);
  }

  function drawBarn(x, y, s) {
    const w = 150 * s;
    const h = 95 * s;
    const d = 26 * s;
    isoBox(x, y, w, h, d, '#b8541a', '#8a3d1e', '#6b2d14');
    // Roof: a gable triangle on the front face and its right slope.
    ctx.fillStyle = '#5d2a12';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y - 52 * s);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a3a1a';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y - 52 * s);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w + d, y - d);
    ctx.lineTo(x + w / 2 + d, y - 52 * s - d);
    ctx.closePath();
    ctx.fill();
    // Door and hayloft window.
    ctx.fillStyle = '#3a1e0c';
    ctx.fillRect(x + w * 0.38, y + h * 0.42, w * 0.24, h * 0.58);
    ctx.strokeStyle = '#e8c95a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + w * 0.38, y + h * 0.42, w * 0.24, h * 0.58);
    ctx.fillStyle = '#ffd94d';
    ctx.fillRect(x + w * 0.42, y + h * 0.12, w * 0.16, h * 0.2);
  }

  function drawTree(x, y, s, t) {
    const sway = Math.sin(t * 1.2 + x) * 3;
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(x - 4 * s, y - 46 * s, 9 * s, 46 * s);
    ctx.fillStyle = '#c96f2e';
    ctx.beginPath();
    ctx.arc(x + sway, y - 78 * s, 34 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a33c';
    ctx.beginPath();
    ctx.arc(x - 18 * s + sway, y - 62 * s, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 20 * s + sway, y - 64 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround(state, t) {
    const s = STAGES[state.stage];
    ctx.fillStyle = s.ground;
    ctx.fillRect(0, FIELD.groundY, W, H - FIELD.groundY);
    ctx.fillStyle = s.grass;
    ctx.fillRect(0, FIELD.groundY, W, 10);
    // Isometric diamond tiles scrolling past, two tones for depth.
    const off = (state.elapsed * state.speed) % 96;
    for (let x = -96; x < W + 96; x += 96) {
      const px = x - off;
      ctx.fillStyle = (Math.round(x / 96) % 2 === 0) ? PALETTE.tileLight : PALETTE.tileDark;
      ctx.beginPath();
      ctx.moveTo(px + 48, FIELD.groundY + 22);
      ctx.lineTo(px + 96, FIELD.groundY + 52);
      ctx.lineTo(px + 48, FIELD.groundY + 82);
      ctx.lineTo(px, FIELD.groundY + 52);
      ctx.closePath();
      ctx.fill();
    }
    // Scattered autumn leaves tumbling along the ground.
    ctx.fillStyle = '#e8a33c';
    for (let i = 0; i < 10; i += 1) {
      const lx = ((i * 211 + t * 60) % 1360) - 40;
      const ly = FIELD.groundY + 96 + ((i * 37) % 26);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(Math.sin(t * 3 + i) * 0.6);
      ctx.fillRect(-5, -2, 10, 4);
      ctx.restore();
    }
  }

  function drawTurkey(p, t) {
    const bob = p.onGround ? Math.abs(Math.sin(p.runPhase)) * 4 : 0;
    const x = p.x;
    const y = p.y - bob;
    ctx.save();
    if (p.invulnerable > 0 && Math.floor(t * 12) % 2 === 0) ctx.globalAlpha = 0.45;
    // Shadow on the ground, shrinking with jump height.
    const hgt = Math.max(0, FIELD.groundY - (p.y + TURKEY.height));
    const shScale = Math.max(0.4, 1 - hgt / 500);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + 37, FIELD.groundY + 8, 34 * shScale, 7 * shScale, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.hiding) {
      // Only the tail feathers poke out of the hay.
      ctx.fillStyle = PALETTE.turkeyTail[0];
      for (let i = -1; i <= 1; i += 1) {
        ctx.save();
        ctx.translate(x + 37 + i * 12, FIELD.groundY - 58);
        ctx.rotate(i * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, -14, 7, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    if (p.sliding) {
      // Low slide: body flattened, legs tucked, tail up.
      ctx.fillStyle = PALETTE.turkeyBody;
      ctx.beginPath();
      ctx.ellipse(x + 40, FIELD.groundY - 16, 42, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.turkeyTail[1];
      ctx.beginPath();
      ctx.ellipse(x + 8, FIELD.groundY - 26, 16, 9, -0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.turkeyHead;
      ctx.beginPath();
      ctx.arc(x + 76, FIELD.groundY - 22, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.turkeyBeak;
      ctx.beginPath();
      ctx.moveTo(x + 84, FIELD.groundY - 24);
      ctx.lineTo(x + 96, FIELD.groundY - 19);
      ctx.lineTo(x + 84, FIELD.groundY - 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }
    // Tail fan: three layered arcs, the turkey's signature.
    for (let i = 0; i < 5; i += 1) {
      const ang = -0.9 + i * 0.45;
      ctx.save();
      ctx.translate(x + 12, y + 34);
      ctx.rotate(ang);
      ctx.fillStyle = PALETTE.turkeyTail[i % 3];
      ctx.beginPath();
      ctx.ellipse(0, -26, 10, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade(PALETTE.turkeyTail[i % 3], 1.35);
      ctx.beginPath();
      ctx.ellipse(0, -46, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body with a shaded belly, wing, legs mid-stride.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(x + 38, y + 34, 30, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyBodyDark;
    ctx.beginPath();
    ctx.ellipse(x + 44, y + 42, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    const legSwing = p.onGround ? Math.sin(p.runPhase) * 10 : 6;
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 56);
    ctx.lineTo(x + 30 + legSwing, FIELD.groundY);
    ctx.moveTo(x + 48, y + 56);
    ctx.lineTo(x + 48 - legSwing, FIELD.groundY);
    ctx.stroke();
    ctx.fillStyle = PALETTE.turkeyWing;
    ctx.beginPath();
    ctx.ellipse(x + 32, y + 36, 16, 11, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Head, beak, wattle, worried eye.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(x + 64, y + 10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(x + 74, y + 8);
    ctx.lineTo(x + 88, y + 12);
    ctx.lineTo(x + 74, y + 16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(x + 68, y + 22, 5, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + 68, y + 7, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer(state, t) {
    const p = state.player;
    // The farmer runs behind the turkey; his screen spot is the gap behind it.
    const x = Math.max(8, p.x - state.gap - 46);
    const y = FIELD.groundY - 118;
    const bob = Math.abs(Math.sin(t * 11)) * 5;
    ctx.save();
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + 30, FIELD.groundY + 8, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs pumping, overalls, shirt, arms reaching forward.
    const swing = Math.sin(t * 11) * 12;
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 62);
    ctx.lineTo(x + 24 + swing, FIELD.groundY);
    ctx.moveTo(x + 38, y + 62);
    ctx.lineTo(x + 38 - swing, FIELD.groundY);
    ctx.stroke();
    ctx.fillStyle = PALETTE.farmerShirt;
    ctx.fillRect(x + 12, y + 26, 38, 40);
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(x + 16, y + 44, 30, 22);
    ctx.strokeStyle = PALETTE.farmerSkin;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 44, y + 34);
    ctx.lineTo(x + 62, y + 26 - swing * 0.4);
    ctx.moveTo(x + 44, y + 40);
    ctx.lineTo(x + 60, y + 44 + swing * 0.3);
    ctx.stroke();
    // Head, moustache, straw hat with a red band.
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.beginPath();
    ctx.arc(x + 32, y + 14, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(x + 22, y + 18, 20, 5);
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(x + 32, y + 2, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 18, y - 14, 28, 16);
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.fillRect(x + 18, y - 2, 28, 5);
    // His pitchfork, carried high.
    ctx.strokeStyle = '#8a5a2e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 70);
    ctx.lineTo(x - 6, y - 22);
    ctx.stroke();
    ctx.strokeStyle = '#c9ced6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 22);
    ctx.lineTo(x - 16, y - 36);
    ctx.moveTo(x - 6, y - 22);
    ctx.lineTo(x - 6, y - 38);
    ctx.moveTo(x, y - 22);
    ctx.lineTo(x + 4, y - 36);
    ctx.stroke();
    ctx.restore();
    // "HE'S COMING!" warning, centred under the HUD, when the gap gets scary.
    if (state.gap < 130) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText("HE'S RIGHT BEHIND YOU!", W / 2, 108 + Math.sin(t * 6) * 4);
    }
  }

  function drawThing(t, state, time) {
    const x = t.x;
    const y = t.y;
    if (t.kind === KIND_FENCE) {
      isoBox(x, y + t.height, t.width, t.height, 10, PALETTE.fenceWood, PALETTE.fenceWoodDark, shade(PALETTE.fenceWood, 0.75));
      ctx.fillStyle = PALETTE.fenceWood;
      ctx.fillRect(x - 8, y + 18, t.width + 16, 10);
      ctx.fillRect(x - 8, y + 52, t.width + 16, 10);
    } else if (t.kind === KIND_PUMPKIN) {
      ctx.fillStyle = PALETTE.pumpkinDark;
      ctx.beginPath();
      ctx.ellipse(x + 31, y + 34, 32, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.pumpkin;
      ctx.beginPath();
      ctx.ellipse(x + 31, y + 30, 30, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.pumpkinDark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 31, y + 8);
      ctx.quadraticCurveTo(x + 20, y + 30, x + 31, y + 50);
      ctx.moveTo(x + 31, y + 8);
      ctx.quadraticCurveTo(x + 42, y + 30, x + 31, y + 50);
      ctx.stroke();
      ctx.fillStyle = '#3d5a2a';
      ctx.fillRect(x + 28, y - 2, 6, 12);
      // A grinning jack-o'-lantern face: this one is on the farmer's side.
      ctx.fillStyle = '#3a2410';
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 24);
      ctx.lineTo(x + 24, y + 18);
      ctx.lineTo(x + 30, y + 24);
      ctx.closePath();
      ctx.moveTo(x + 34, y + 24);
      ctx.lineTo(x + 40, y + 18);
      ctx.lineTo(x + 46, y + 24);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 36);
      ctx.lineTo(x + 48, y + 36);
      ctx.lineTo(x + 40, y + 44);
      ctx.lineTo(x + 24, y + 44);
      ctx.closePath();
      ctx.fill();
    } else if (t.kind === KIND_OVEN) {
      // The dreaded oven: an iso box with a glowing door and licking flames.
      isoBox(x, y + t.height, t.width, t.height, 22, '#4a505e', '#2c303a', '#23262e');
      const flick = Math.sin(time * 14 + x) * 4;
      const glow = ctx.createRadialGradient(x + 75, y + 74, 6, x + 75, y + 74, 62);
      glow.addColorStop(0, 'rgba(255,122,46,0.9)');
      glow.addColorStop(1, 'rgba(255,122,46,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 10, y + 10, 170, 130);
      ctx.fillStyle = '#1a1210';
      ctx.fillRect(x + 28, y + 44, 94, 62);
      ctx.fillStyle = PALETTE.ovenGlow;
      ctx.beginPath();
      ctx.moveTo(x + 40, y + 100);
      ctx.quadraticCurveTo(x + 48, y + 66 + flick, x + 58, y + 100);
      ctx.quadraticCurveTo(x + 66, y + 60 - flick, x + 78, y + 100);
      ctx.quadraticCurveTo(x + 88, y + 68 + flick, x + 98, y + 100);
      ctx.quadraticCurveTo(x + 108, y + 62 - flick, x + 112, y + 100);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', x + 75, y + 28);
    } else if (t.kind === KIND_SWING_KNIFE) {
      // The carving knife on a rope, sweeping across the path like a pendulum.
      const swing = Math.sin(t.swing) * 62;
      const px = x + 15 + swing;
      const py = 300 + Math.abs(Math.cos(t.swing)) * 30;
      ctx.strokeStyle = '#3a2410';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 15, 150);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(t.swing) * 0.9);
      ctx.fillStyle = PALETTE.knifeBlade;
      ctx.beginPath();
      ctx.moveTo(-6, -52);
      ctx.lineTo(6, -52);
      ctx.lineTo(10, 34);
      ctx.lineTo(0, 52);
      ctx.lineTo(-10, 34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(-3, -48, 3, 80);
      ctx.fillStyle = PALETTE.knifeHandle;
      ctx.fillRect(-7, -68, 14, 18);
      ctx.restore();
    } else if (t.kind === KIND_FALL_KNIFE) {
      if (t.telegraph > 0) {
        // Warning: a glint and a shadow on the ground where it will land.
        ctx.fillStyle = 'rgba(229,83,75,0.85)';
        ctx.font = `bold 18px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('!', x + 13, 60 + Math.sin(time * 10) * 4);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 13, FIELD.groundY + 6, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(x + 13, y + 60);
        ctx.fillStyle = PALETTE.knifeBlade;
        ctx.beginPath();
        ctx.moveTo(-7, -60);
        ctx.lineTo(7, -60);
        ctx.lineTo(9, 40);
        ctx.lineTo(0, 58);
        ctx.lineTo(-9, 40);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PALETTE.knifeHandle;
        ctx.fillRect(-8, -78, 16, 20);
        ctx.restore();
      }
    } else if (t.kind === KIND_HAY) {
      // A hay bale to hide in: iso box with straw strokes, and a "HIDE!" hint.
      isoBox(x, y + t.height, t.width, t.height, 14, PALETTE.hay, PALETTE.hayDark, shade(PALETTE.hay, 0.7));
      ctx.strokeStyle = '#b8932a';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + 12 + i * 20, y + 12);
        ctx.lineTo(x + 8 + i * 20, y + t.height - 8);
        ctx.stroke();
      }
      ctx.fillStyle = '#3a2410';
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('HIDE!', x + 60, y - 10);
    } else if (t.kind === KIND_CORN) {
      const bobY = Math.sin(time * 5 + x) * 4;
      ctx.fillStyle = PALETTE.corn;
      ctx.beginPath();
      ctx.ellipse(x + 18, y + 18 + bobY, 13, 17, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c9a83a';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(x + 12 + i * 6, y + 10 + bobY + (i % 2) * 8, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7ddb6a';
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 32 + bobY, 10, 5, -0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.kind === KIND_FEATHER) {
      // A golden feather: rare, worth 25, and it sparkles.
      const bobY = Math.sin(time * 6 + x) * 6;
      const tw = 0.6 + Math.sin(time * 8) * 0.4;
      ctx.save();
      ctx.translate(x + 17, y + 17 + bobY);
      ctx.rotate(-0.5);
      ctx.fillStyle = PALETTE.feather;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b8932a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 20);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = `rgba(255,255,255,${tw})`;
      ctx.beginPath();
      ctx.arc(x + 6, y + 6 + bobY, 3, 0, Math.PI * 2);
      ctx.arc(x + 28, y + 26 + bobY, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPopup(popups, elapsed) {
    ctx.textAlign = 'center';
    for (const p of popups) {
      const age = elapsed - p.at;
      if (age > 1.1) continue;
      ctx.globalAlpha = 1 - age / 1.1;
      ctx.font = `bold ${p.big ? 30 : 22}px ${FONT}`;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y - age * 46);
      ctx.globalAlpha = 1;
    }
  }

  function drawHud(state, muted) {
    // Top bar: score, distance, lives as feathers, stage, farmer meter.
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, W, 64);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.fillRect(0, 64, W, 3);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 24, 42);
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    const dist = Math.floor(state.distanceM);
    ctx.fillText(`${dist} m / ${GOAL_M} m`, 300, 40);
    // Progress bar to the forest gate.
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(300, 50, 260, 7);
    ctx.fillStyle = PALETTE.ok;
    ctx.fillRect(300, 50, 260 * Math.min(1, state.distanceM / GOAL_M), 7);
    // Lives as golden feathers.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText('LIVES', 620, 40);
    for (let i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.translate(700 + i * 34, 34);
      ctx.rotate(-0.5);
      ctx.fillStyle = i < state.lives ? PALETTE.feather : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Farmer proximity meter: the closer he is, the redder it gets.
    ctx.fillStyle = PALETTE.text;
    ctx.fillText('FARMER', 830, 40);
    const closeness = 1 - Math.min(1, Math.max(0, state.gap / 290));
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(930, 26, 150, 14);
    ctx.fillStyle = closeness > 0.66 ? PALETTE.danger : closeness > 0.4 ? '#f2a541' : PALETTE.ok;
    ctx.fillRect(930, 26, 150 * closeness, 14);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(STAGES[state.stage].name, 1100, 40);
    ctx.fillText(muted ? 'M: sound OFF' : 'M: sound ON', 1100, 58);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = PALETTE.panel;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function bigText(text, x, y, size, color, shadowColor) {
    // 3D extruded title text: dark edge offset behind the bright face.
    ctx.textAlign = 'center';
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.fillStyle = shadowColor;
    ctx.fillText(text, x + 5, y + 6);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function drawTitle(state, best, time) {
    drawSky(0, time);
    drawGround(state, time);
    // A few treats and a hay bale dress the title backdrop.
    drawThing({ kind: KIND_HAY, x: 1050, y: FIELD.groundY - 66, width: 120, height: 66 }, state, time);
    drawThing({ kind: KIND_PUMPKIN, x: 150, y: FIELD.groundY - 52, width: 62, height: 52 }, state, time);
    drawFarmer(state, time);
    drawTurkey(state.player, time);
    ctx.fillStyle = 'rgba(30,16,4,0.45)';
    ctx.fillRect(0, 0, W, H);
    bigText('GOBBLE & GONE', W / 2, 168, 92, '#ffd94d', '#8a3d1e');
    bigText('THE GREAT THANKSGIVING BREAKOUT', W / 2, 222, 30, PALETTE.text, '#3a2410');
    panel(170, 260, 940, 250);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillText('The farmer wants you for dinner. Run 1,000 m to the forest gate!', 640, 306);
    ctx.font = `21px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('JUMP  Space / Up / Click  —  SLIDE  Down / Right-click', 640, 348);
    ctx.fillText('MOVE  Left / Right or A / D  —  DASH  Shift  —  HIDE in hay: hold Down at a hay bale', 640, 380);
    ctx.fillText('Dodge fences, pumpkins, ovens & carving knives. Grab corn & golden feathers.', 640, 412);
    ctx.fillText('Every stumble lets the farmer catch up. If he reaches you — dinner!', 640, 444);
    const pulse = 0.75 + Math.sin(time * 4) * 0.25;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd94d';
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText('PRESS SPACE OR CLICK TO START', 640, 486);
    ctx.globalAlpha = 1;
    if (best > 0) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText(`BEST SCORE: ${best}`, 640, 556);
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `17px ${FONT}`;
    ctx.fillText('An original game — all art drawn in code, all sound synthesised. No turkeys were harmed.', 640, 690);
  }

  function drawOver(state, best, time) {
    drawSky(state.stage, time);
    drawGround(state, time);
    ctx.fillStyle = state.escaped ? 'rgba(20,60,25,0.55)' : 'rgba(40,10,5,0.6)';
    ctx.fillRect(0, 0, W, H);
    if (state.escaped) {
      bigText('ESCAPED!', W / 2, 190, 96, '#7ddb6a', '#1e4d14');
      bigText('YOU MADE IT TO THE FOREST GATE!', W / 2, 248, 30, PALETTE.text, '#1e4d14');
      drawTurkey({ ...state.player, x: 160, y: FIELD.groundY - TURKEY.height, runPhase: time * 8, onGround: true, invulnerable: 0 }, time);
    } else {
      bigText('CAUGHT!', W / 2, 190, 96, '#ff7a5c', '#4d0e08');
      bigText('DINNER IS SERVED… AND IT IS YOU.', W / 2, 248, 30, PALETTE.text, '#4d0e08');
      // The farmer, finally holding his prize: a very worried turkey on a platter.
      drawFarmer({ ...state, gap: 60 }, time);
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.ellipse(640, 620, 130, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.turkeyBody;
      ctx.beginPath();
      ctx.ellipse(640, 596, 52, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.turkeyTail[1];
      for (let i = 0; i < 3; i += 1) {
        ctx.save();
        ctx.translate(592, 586);
        ctx.rotate(-0.7 + i * 0.35);
        ctx.beginPath();
        ctx.ellipse(0, -16, 7, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = PALETTE.turkeyHead;
      ctx.beginPath();
      ctx.arc(682, 574, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(686, 570, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    panel(390, 300, 500, 210);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText(`FINAL SCORE: ${Math.floor(state.score)}`, 640, 352);
    ctx.font = `22px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`Distance: ${Math.floor(state.distanceM)} m of ${GOAL_M} m`, 640, 392);
    ctx.fillText(`Corn eaten: ${state.cornEaten}   •   Dodges: ${state.dodges}   •   Hides: ${state.hides}`, 640, 424);
    ctx.fillText(`Best combo: ${state.bestCombo}   •   Best score: ${Math.max(best, Math.floor(state.score))}`, 640, 456);
    const pulse = 0.75 + Math.sin(time * 4) * 0.25;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd94d';
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText('PRESS SPACE OR CLICK TO RUN AGAIN', 640, 548);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `17px ${FONT}`;
    ctx.fillText(state.escaped ? 'The forest is yours. The farmer is still looking for you.' : 'Tip: hide in the hay when the farmer gets close — and never trust an oven.', 640, 690);
  }

  function drawPaused(state) {
    ctx.fillStyle = 'rgba(20,10,2,0.6)';
    ctx.fillRect(0, 0, W, H);
    bigText('PAUSED', W / 2, 300, 80, PALETTE.text, '#3a2410');
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `22px ${FONT}`;
    ctx.fillText('Press P or Space to keep running — the farmer is waiting.', 640, 360);
  }

  function draw(state, screen, best, popups, muted, time) {
    fit();
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best, time);
      return;
    }
    drawSky(state.stage, time);
    drawGround(state, time);
    for (const t of state.things) {
      if (t.active) drawThing(t, state, time);
    }
    drawFarmer(state, time);
    drawTurkey(state.player, time);
    drawPopup(popups, state.elapsed);
    drawHud(state, muted);
    // Stage banner flashes when a new stage begins.
    if (state.stageAnnounced >= 0 && state.stageAt > 0 && state.elapsed - state.stageAt < 2.2) {
      ctx.globalAlpha = Math.min(1, (2.2 - (state.elapsed - state.stageAt)) / 0.6);
      bigText(STAGES[state.stage].name, W / 2, 200, 54, '#ffd94d', '#3a2410');
      ctx.globalAlpha = 1;
    }
    if (screen === SCREEN_OVER) drawOver(state, best, time);
    else if (screen === SCREEN_PAUSED) drawPaused(state);
  }

  return { draw };
}
