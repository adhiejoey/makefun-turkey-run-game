// GOBBLE & GONE — tuning, palette and stage table.
// One place holds every number the rules use, so a play-tester can retune the
// whole game without touching the simulation or the renderer.
export const FIELD = { width: 1280, height: 720, groundY: 596 };

export const STEP = 1 / 60;
export const PX_PER_M = 25; // world pixels per metre of escape distance
export const GOAL_M = 1000; // reach the forest gate to escape
export const TURKEY_X = 250;

export const TURKEY = {
  width: 74,
  height: 62,
  runSpeed: 0, // the turkey holds its screen spot; the world scrolls past it
  moveSpeed: 460, // px/s sidestepping left / right with A/D or the arrows
  minX: 110,
  maxX: 620,
  gravity: 2800,
  jumpVelocity: -1020,
  slideTime: 0.55,
  hideTime: 1.3,
  invulnerable: 1.6,
};

export const FARMER = {
  startGap: 230, // pixels of daylight between the farmer and the turkey
  creep: 4, // px/s the farmer gains just by being relentless
  hitGain: 78, // px he gains when the turkey stumbles
  cornLoss: 10, // px he loses per corn cob eaten on the run
  dodgeLoss: 9,
  hideLoss: 95, // px he loses when the turkey vanishes into the hay
  catchGap: 26, // gap at or below this means dinner
};

export const LIVES = 3;

export const SCORE = { corn: 10, feather: 25, dodge: 5, metre: 1, hide: 15 };

export const SPEED = { base: 380, perStage: 55, perSecond: 1.1, max: 660 };

// Seconds between spawns shrink as the run goes on; spawnGap is the floor.
export const SPAWN = { first: 1.2, interval: 1.3, minInterval: 0.55, cornEvery: 2.1 };

export const STAGES = [
  { from: 0, to: 300, name: 'THE FARMYARD', sky: ['#ffd98a', '#ff9e57'], ground: '#7a4a21', grass: '#7fae4c' },
  { from: 300, to: 650, name: 'THE BARN', sky: ['#f7b267', '#c96f3b'], ground: '#5d3a1a', grass: '#6d8f3e' },
  { from: 650, to: 900, name: 'THE KITCHEN', sky: ['#e88a5a', '#8f4a3a'], ground: '#4a2c22', grass: '#5c7a35' },
  { from: 900, to: 1000, name: 'THE FOREST GATE', sky: ['#a8d8a0', '#4f8f5a'], ground: '#3d5a2a', grass: '#4c8a3f' },
];

export const PALETTE = {
  skyTop: '#ffd98a',
  skyBottom: '#ff9e57',
  sun: '#fff3b0',
  cloud: 'rgba(255,250,235,0.92)',
  hillFar: '#b98a4e',
  hillNear: '#8a5f30',
  groundTop: '#8a5a2b',
  ground: '#6b4423',
  groundDark: '#54341a',
  tileLight: '#9c6b34',
  tileDark: '#7c5226',
  turkeyBody: '#8a5a2e',
  turkeyBodyDark: '#6b4423',
  turkeyWing: '#a9713d',
  turkeyTail: ['#c96f2e', '#e8a33c', '#8a3d1e'],
  turkeyHead: '#e8e0d0',
  turkeyWattle: '#e5534b',
  turkeyBeak: '#f2a541',
  farmerShirt: '#3f6fb5',
  farmerOveralls: '#2e4a7a',
  farmerSkin: '#e8b98a',
  farmerHat: '#d9b23c',
  ovenBody: '#3a3f4a',
  ovenGlow: '#ff7a2e',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#5a3a1e',
  fenceWood: '#a9713d',
  fenceWoodDark: '#7c5226',
  pumpkin: '#e8722a',
  pumpkinDark: '#b8541a',
  hay: '#e8c95a',
  hayDark: '#c9a83a',
  corn: '#f2c94c',
  feather: '#ffd94d',
  text: '#fff7e8',
  textDark: '#3a2410',
  muted: '#ffe9c4',
  panel: 'rgba(46,26,10,0.82)',
  panelEdge: '#ffb347',
  danger: '#e5534b',
  ok: '#7ddb6a',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const BEST_KEY = 'gobble-and-gone.best';
export const MUTE_KEY = 'gobble-and-gone.muted';
