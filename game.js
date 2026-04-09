// version 2.0.1


const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startButton = document.getElementById("start-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 5200;
const GRAVITY = 0.62;
const ATTACK_DURATION = 14;
const ATTACK_CHAIN_WINDOW = 6;
const TOTAL_STAGES = 5;
const COYOTE_FRAMES = 7;
const JUMP_BUFFER_FRAMES = 8;
const JUMP_CUT_MULTIPLIER = 0.72;
const FALL_GRAVITY_MULTIPLIER = 1.42;
const MAX_FALL_SPEED = 18.5;
const JUMP_HOLD_FRAMES = 5;
const JUMP_HOLD_FORCE = 0.22;

const keys = new Set();

// Platforms define the traversable path across the whole stage.
const levelPlatforms = [
  { x: 0, y: 460, w: 640, h: 80, type: "ground" },
  { x: 710, y: 420, w: 130, h: 24, type: "stone" },
  { x: 890, y: 370, w: 160, h: 24, type: "stone" },
  { x: 1110, y: 460, w: 360, h: 80, type: "ground" },
  { x: 1540, y: 400, w: 140, h: 24, type: "stone" },
  { x: 1730, y: 345, w: 170, h: 24, type: "stone" },
  { x: 1960, y: 460, w: 380, h: 80, type: "ground" },
  { x: 2420, y: 405, w: 120, h: 24, type: "stone" },
  { x: 2590, y: 355, w: 120, h: 24, type: "stone" },
  { x: 2760, y: 305, w: 120, h: 24, type: "stone" },
  { x: 2930, y: 460, w: 510, h: 80, type: "ground" },
  { x: 3510, y: 395, w: 140, h: 24, type: "stone" },
  { x: 3700, y: 340, w: 140, h: 24, type: "stone" },
  { x: 3880, y: 285, w: 150, h: 24, type: "stone" },
  { x: 4070, y: 460, w: 430, h: 80, type: "ground" },
  { x: 4570, y: 405, w: 130, h: 24, type: "stone" },
  { x: 4740, y: 355, w: 130, h: 24, type: "stone" },
  { x: 4920, y: 460, w: 280, h: 80, type: "ground" }
];

const enemyBlueprints = [
  { id: 1, x: 500, y: 412, minX: 300, maxX: 610, speed: 1.1 },
  { id: 2, x: 1210, y: 412, minX: 1130, maxX: 1420, speed: 1.2 },
  { id: 3, x: 1600, y: 352, minX: 1550, maxX: 1660, speed: 1.05 },
  { id: 4, x: 2050, y: 412, minX: 1980, maxX: 2290, speed: 1.3 },
  { id: 5, x: 2460, y: 357, minX: 2420, maxX: 2510, speed: 1.15 },
  { id: 6, x: 3020, y: 412, minX: 2970, maxX: 3380, speed: 1.45 },
  { id: 7, x: 3550, y: 347, minX: 3520, maxX: 3630, speed: 1.2 },
  { id: 8, x: 4140, y: 412, minX: 4090, maxX: 4470, speed: 1.55 },
  { id: 9, x: 4600, y: 357, minX: 4580, maxX: 4680, speed: 1.35 },
  { id: 10, x: 4970, y: 412, minX: 4940, maxX: 5140, speed: 1.7 }
];

const decorations = [
  { x: 180, y: 394, w: 70, h: 66, color: "#7fb069" },
  { x: 860, y: 340, w: 82, h: 120, color: "#7fb069" },
  { x: 1520, y: 388, w: 70, h: 72, color: "#6d9f71" },
  { x: 2350, y: 386, w: 90, h: 74, color: "#6d9f71" },
  { x: 2750, y: 398, w: 72, h: 62, color: "#7fb069" },
  { x: 3340, y: 386, w: 88, h: 74, color: "#87b76b" },
  { x: 3960, y: 394, w: 76, h: 66, color: "#6d9f71" },
  { x: 4460, y: 374, w: 96, h: 86, color: "#7fb069" },
  { x: 5030, y: 396, w: 74, h: 64, color: "#87b76b" }
];

let state = "menu";
let lastTime = 0;
let cameraX = 0;
let lootDrops = [];
let bossProjectiles = [];
let enemyProjectiles = [];
let stageHazards = [];
let stageHazardTimer = 110;
const DUNGEON_START = 3320;
let currentStage = 1;
let stagePhase = "field";
let boss = null;

const bossBlueprints = [
  { name: "Wildroot Stag", color: "#4f772d", accent: "#dda15e", speed: 1.55, health: 22, damage: 2, size: 80, primaryAttack: "thorn" },
  { name: "Cavern Nocturne", color: "#3d405b", accent: "#a8dadc", speed: 1.7, health: 30, damage: 2, size: 78, primaryAttack: "bat" },
  { name: "Magma Behemoth", color: "#bc3908", accent: "#ffb703", speed: 1.65, health: 38, damage: 3, size: 88, primaryAttack: "fire" },
  { name: "Crystal Maw", color: "#7b8faf", accent: "#d7e3fc", speed: 1.75, health: 46, damage: 3, size: 86, primaryAttack: "shard" },
  { name: "Ancient Colossus", color: "#6b705c", accent: "#ddb892", speed: 1.85, health: 56, damage: 4, size: 94, primaryAttack: "boulder" }
];

const bossAttackStyles = {
  thorn: {
    windup: 34,
    cooldown: 88,
    fill: "#ffb3c6",
    stroke: "#8f2d56",
    warningFill: "rgba(255, 179, 198, 0.28)",
    warningStroke: "#ff8fab"
  },
  rock: {
    windup: 40,
    cooldown: 82,
    fill: "#90e0ef",
    stroke: "#005f73",
    warningFill: "rgba(144, 224, 239, 0.22)",
    warningStroke: "#48cae4"
  },
  bat: {
    windup: 28,
    cooldown: 72,
    fill: "#d8f3ff",
    stroke: "#1d3557",
    warningFill: "rgba(216, 243, 255, 0.2)",
    warningStroke: "#90e0ef"
  },
  fire: {
    windup: 32,
    cooldown: 68,
    fill: "#9bf6ff",
    stroke: "#1d3557",
    warningFill: "rgba(155, 246, 255, 0.24)",
    warningStroke: "#48cae4"
  },
  shard: {
    windup: 34,
    cooldown: 74,
    fill: "#eff6ff",
    stroke: "#5c677d",
    warningFill: "rgba(239, 246, 255, 0.24)",
    warningStroke: "#d7e3fc"
  },
  boulder: {
    windup: 38,
    cooldown: 78,
    fill: "#d4a373",
    stroke: "#6f4e37",
    warningFill: "rgba(212, 163, 115, 0.22)",
    warningStroke: "#ddb892"
  },
  slash: {
    windup: 26,
    cooldown: 58,
    fill: "#fef3c7",
    stroke: "#9a3412",
    warningFill: "rgba(254, 243, 199, 0.2)",
    warningStroke: "#f59e0b"
  },
  beam: {
    windup: 40,
    cooldown: 96,
    fill: "#c4b5fd",
    stroke: "#4338ca",
    warningFill: "rgba(196, 181, 253, 0.18)",
    warningStroke: "#a78bfa"
  },
  summon: {
    windup: 34,
    cooldown: 88,
    fill: "#ddd6fe",
    stroke: "#5b21b6",
    warningFill: "rgba(221, 214, 254, 0.18)",
    warningStroke: "#8b5cf6"
  },
  dash: {
    windup: 24,
    cooldown: 84,
    fill: "#f1fa8c",
    stroke: "#606c38",
    warningFill: "rgba(241, 250, 140, 0.18)",
    warningStroke: "#f1fa8c"
  }
};

const bossArenas = {
  1: { width: 1500, platforms: [{ x: 0, y: 460, w: 1500, h: 80, type: "ground" }, { x: 340, y: 380, w: 120, h: 24, type: "stone" }, { x: 1040, y: 380, w: 120, h: 24, type: "stone" }], background: ["#345c3f", "#5f8f4f", "#bdd9a2"], theme: "wilds" },
  2: { width: 1500, platforms: [{ x: 0, y: 460, w: 1500, h: 80, type: "ground" }, { x: 250, y: 400, w: 160, h: 24, type: "stone" }, { x: 560, y: 330, w: 160, h: 24, type: "stone" }, { x: 1080, y: 400, w: 160, h: 24, type: "stone" }], background: ["#1f2833", "#324a5f", "#6c8aa4"], theme: "cavern" },
  3: { width: 1500, platforms: [{ x: 0, y: 460, w: 1500, h: 80, type: "ground" }, { x: 310, y: 360, w: 130, h: 24, type: "stone" }, { x: 1060, y: 320, w: 130, h: 24, type: "stone" }], background: ["#4a0d0d", "#8d2000", "#f48c06"], theme: "volcano" },
  4: { width: 1500, platforms: [{ x: 0, y: 460, w: 1500, h: 80, type: "ground" }, { x: 220, y: 390, w: 150, h: 24, type: "stone" }, { x: 620, y: 300, w: 180, h: 24, type: "stone" }, { x: 1120, y: 390, w: 150, h: 24, type: "stone" }], background: ["#243b55", "#4d648d", "#b8c6db"], theme: "stalactite" },
  5: { width: 1600, platforms: [{ x: 0, y: 460, w: 1600, h: 80, type: "ground" }, { x: 260, y: 390, w: 140, h: 24, type: "stone" }, { x: 520, y: 320, w: 140, h: 24, type: "stone" }, { x: 780, y: 250, w: 140, h: 24, type: "stone" }, { x: 1160, y: 390, w: 140, h: 24, type: "stone" }], background: ["#5b4b3a", "#8c7b6b", "#d8c3a5"], theme: "ruins" }
};

const stageMaps = {
  1: {
    platforms: levelPlatforms,
    enemies: enemyBlueprints,
    decorations,
    dungeonStart: 3320,
    torchXs: [3440, 3840, 4250, 4700]
  },
  2: {
    platforms: [
      { x: 0, y: 460, w: 540, h: 80, type: "ground" },
      { x: 610, y: 405, w: 140, h: 24, type: "stone" },
      { x: 800, y: 355, w: 180, h: 24, type: "stone" },
      { x: 1040, y: 460, w: 310, h: 80, type: "ground" },
      { x: 1420, y: 420, w: 100, h: 24, type: "stone" },
      { x: 1570, y: 370, w: 110, h: 24, type: "stone" },
      { x: 1730, y: 320, w: 120, h: 24, type: "stone" },
      { x: 1910, y: 460, w: 420, h: 80, type: "ground" },
      { x: 2390, y: 400, w: 150, h: 24, type: "stone" },
      { x: 2600, y: 345, w: 150, h: 24, type: "stone" },
      { x: 2820, y: 460, w: 300, h: 80, type: "ground" },
      { x: 3200, y: 390, w: 130, h: 24, type: "stone" },
      { x: 3390, y: 340, w: 150, h: 24, type: "stone" },
      { x: 3590, y: 460, w: 340, h: 80, type: "ground" },
      { x: 4000, y: 410, w: 130, h: 24, type: "stone" },
      { x: 4180, y: 360, w: 130, h: 24, type: "stone" },
      { x: 4360, y: 310, w: 150, h: 24, type: "stone" },
      { x: 4560, y: 460, w: 640, h: 80, type: "ground" }
    ],
    enemies: [
      { id: 21, x: 420, y: 412, minX: 220, maxX: 500, speed: 1.2 },
      { id: 22, x: 1100, y: 412, minX: 1060, maxX: 1300, speed: 1.25 },
      { id: 23, x: 1600, y: 322, minX: 1575, maxX: 1810, speed: 1.15 },
      { id: 24, x: 2100, y: 412, minX: 1940, maxX: 2280, speed: 1.35 },
      { id: 25, x: 2440, y: 352, minX: 2400, maxX: 2525, speed: 1.15 },
      { id: 26, x: 2890, y: 412, minX: 2840, maxX: 3080, speed: 1.5 },
      { id: 27, x: 3230, y: 342, minX: 3210, maxX: 3320, speed: 1.2 },
      { id: 28, x: 3700, y: 412, minX: 3610, maxX: 3900, speed: 1.55 },
      { id: 29, x: 4210, y: 362, minX: 4190, maxX: 4300, speed: 1.25 },
      { id: 30, x: 4700, y: 412, minX: 4600, maxX: 5120, speed: 1.7 }
    ],
    decorations: [
      { x: 140, y: 394, w: 68, h: 66, color: "#84a98c" },
      { x: 960, y: 360, w: 80, h: 100, color: "#84a98c" },
      { x: 2140, y: 390, w: 88, h: 70, color: "#6b9080" },
      { x: 3000, y: 395, w: 76, h: 65, color: "#52796f" },
      { x: 4680, y: 378, w: 92, h: 82, color: "#84a98c" }
    ],
    dungeonStart: 3000,
    torchXs: [3120, 3480, 3920, 4400]
  },
  3: {
    platforms: [
      { x: 0, y: 460, w: 460, h: 80, type: "ground" },
      { x: 540, y: 390, w: 110, h: 24, type: "stone" },
      { x: 700, y: 330, w: 110, h: 24, type: "stone" },
      { x: 860, y: 270, w: 110, h: 24, type: "stone" },
      { x: 1030, y: 460, w: 420, h: 80, type: "ground" },
      { x: 1510, y: 415, w: 120, h: 24, type: "stone" },
      { x: 1680, y: 365, w: 140, h: 24, type: "stone" },
      { x: 1870, y: 315, w: 120, h: 24, type: "stone" },
      { x: 2040, y: 460, w: 360, h: 80, type: "ground" },
      { x: 2470, y: 400, w: 130, h: 24, type: "stone" },
      { x: 2660, y: 350, w: 130, h: 24, type: "stone" },
      { x: 2840, y: 300, w: 130, h: 24, type: "stone" },
      { x: 3020, y: 250, w: 130, h: 24, type: "stone" },
      { x: 3210, y: 460, w: 450, h: 80, type: "ground" },
      { x: 3720, y: 410, w: 120, h: 24, type: "stone" },
      { x: 3880, y: 360, w: 120, h: 24, type: "stone" },
      { x: 4040, y: 310, w: 120, h: 24, type: "stone" },
      { x: 4200, y: 260, w: 120, h: 24, type: "stone" },
      { x: 4380, y: 460, w: 820, h: 80, type: "ground" }
    ],
    enemies: [
      { id: 31, x: 250, y: 412, minX: 100, maxX: 430, speed: 1.1 },
      { id: 32, x: 720, y: 282, minX: 710, maxX: 960, speed: 1.2 },
      { id: 33, x: 1210, y: 412, minX: 1060, maxX: 1410, speed: 1.3 },
      { id: 34, x: 1700, y: 317, minX: 1690, maxX: 1980, speed: 1.2 },
      { id: 35, x: 2160, y: 412, minX: 2060, maxX: 2370, speed: 1.4 },
      { id: 36, x: 2660, y: 352, minX: 2480, maxX: 3140, speed: 1.55 },
      { id: 37, x: 3340, y: 412, minX: 3240, maxX: 3630, speed: 1.45 },
      { id: 38, x: 3900, y: 362, minX: 3730, maxX: 4180, speed: 1.6 },
      { id: 39, x: 4460, y: 412, minX: 4400, maxX: 4780, speed: 1.65 },
      { id: 40, x: 4910, y: 412, minX: 4820, maxX: 5140, speed: 1.85 }
    ],
    decorations: [
      { x: 120, y: 395, w: 80, h: 65, color: "#9a8c98" },
      { x: 1110, y: 386, w: 84, h: 74, color: "#c9ada7" },
      { x: 2230, y: 394, w: 76, h: 66, color: "#9a8c98" },
      { x: 3400, y: 384, w: 88, h: 76, color: "#c9ada7" },
      { x: 4600, y: 390, w: 84, h: 70, color: "#9a8c98" }
    ],
    dungeonStart: 2600,
    torchXs: [2740, 3180, 3660, 4300, 4740]
  },
  4: {
    platforms: [
      { x: 0, y: 460, w: 520, h: 80, type: "ground" },
      { x: 590, y: 420, w: 120, h: 24, type: "stone" },
      { x: 760, y: 370, w: 120, h: 24, type: "stone" },
      { x: 930, y: 320, w: 120, h: 24, type: "stone" },
      { x: 1090, y: 460, w: 300, h: 80, type: "ground" },
      { x: 1480, y: 410, w: 160, h: 24, type: "stone" },
      { x: 1700, y: 360, w: 160, h: 24, type: "stone" },
      { x: 1910, y: 460, w: 300, h: 80, type: "ground" },
      { x: 2280, y: 390, w: 120, h: 24, type: "stone" },
      { x: 2450, y: 340, w: 120, h: 24, type: "stone" },
      { x: 2620, y: 290, w: 120, h: 24, type: "stone" },
      { x: 2790, y: 240, w: 120, h: 24, type: "stone" },
      { x: 2970, y: 460, w: 380, h: 80, type: "ground" },
      { x: 3400, y: 405, w: 130, h: 24, type: "stone" },
      { x: 3580, y: 355, w: 130, h: 24, type: "stone" },
      { x: 3760, y: 305, w: 130, h: 24, type: "stone" },
      { x: 3940, y: 255, w: 130, h: 24, type: "stone" },
      { x: 4130, y: 460, w: 1070, h: 80, type: "ground" }
    ],
    enemies: [
      { id: 41, x: 320, y: 412, minX: 120, maxX: 470, speed: 1.2 },
      { id: 42, x: 780, y: 382, minX: 770, maxX: 1040, speed: 1.25 },
      { id: 43, x: 1180, y: 412, minX: 1110, maxX: 1360, speed: 1.4 },
      { id: 44, x: 1540, y: 362, minX: 1490, maxX: 1840, speed: 1.35 },
      { id: 45, x: 2070, y: 412, minX: 1930, maxX: 2180, speed: 1.45 },
      { id: 46, x: 2460, y: 342, minX: 2290, maxX: 2890, speed: 1.65 },
      { id: 47, x: 3050, y: 412, minX: 2990, maxX: 3330, speed: 1.5 },
      { id: 48, x: 3610, y: 357, minX: 3410, maxX: 4080, speed: 1.75 },
      { id: 49, x: 4300, y: 412, minX: 4160, maxX: 4660, speed: 1.7 },
      { id: 50, x: 4880, y: 412, minX: 4700, maxX: 5140, speed: 1.95 }
    ],
    decorations: [
      { x: 180, y: 394, w: 72, h: 66, color: "#e76f51" },
      { x: 1300, y: 384, w: 78, h: 76, color: "#f4a261" },
      { x: 2070, y: 396, w: 82, h: 64, color: "#e76f51" },
      { x: 3180, y: 388, w: 78, h: 72, color: "#f4a261" },
      { x: 4510, y: 382, w: 90, h: 78, color: "#e76f51" }
    ],
    dungeonStart: 2300,
    torchXs: [2440, 2960, 3440, 3900, 4380]
  },
  5: {
    platforms: [
      { x: 0, y: 460, w: 400, h: 80, type: "ground" },
      { x: 470, y: 410, w: 110, h: 24, type: "stone" },
      { x: 620, y: 360, w: 110, h: 24, type: "stone" },
      { x: 770, y: 310, w: 110, h: 24, type: "stone" },
      { x: 920, y: 260, w: 110, h: 24, type: "stone" },
      { x: 1080, y: 460, w: 260, h: 80, type: "ground" },
      { x: 1420, y: 390, w: 130, h: 24, type: "stone" },
      { x: 1600, y: 340, w: 130, h: 24, type: "stone" },
      { x: 1780, y: 290, w: 130, h: 24, type: "stone" },
      { x: 1960, y: 240, w: 130, h: 24, type: "stone" },
      { x: 2140, y: 460, w: 310, h: 80, type: "ground" },
      { x: 2520, y: 405, w: 150, h: 24, type: "stone" },
      { x: 2720, y: 355, w: 150, h: 24, type: "stone" },
      { x: 2920, y: 305, w: 150, h: 24, type: "stone" },
      { x: 3120, y: 255, w: 150, h: 24, type: "stone" },
      { x: 3320, y: 460, w: 400, h: 80, type: "ground" },
      { x: 3790, y: 400, w: 130, h: 24, type: "stone" },
      { x: 3960, y: 350, w: 130, h: 24, type: "stone" },
      { x: 4130, y: 300, w: 130, h: 24, type: "stone" },
      { x: 4300, y: 250, w: 130, h: 24, type: "stone" },
      { x: 4480, y: 460, w: 720, h: 80, type: "ground" }
    ],
    enemies: [
      { id: 51, x: 210, y: 412, minX: 80, maxX: 360, speed: 1.25 },
      { id: 52, x: 650, y: 372, minX: 630, maxX: 1020, speed: 1.35 },
      { id: 53, x: 1180, y: 412, minX: 1100, maxX: 1320, speed: 1.45 },
      { id: 54, x: 1620, y: 352, minX: 1430, maxX: 2080, speed: 1.6 },
      { id: 55, x: 2260, y: 412, minX: 2160, maxX: 2420, speed: 1.55 },
      { id: 56, x: 2740, y: 367, minX: 2540, maxX: 3260, speed: 1.8 },
      { id: 57, x: 3480, y: 412, minX: 3340, maxX: 3680, speed: 1.65 },
      { id: 58, x: 3980, y: 362, minX: 3800, maxX: 4440, speed: 1.85 },
      { id: 59, x: 4620, y: 412, minX: 4500, maxX: 4860, speed: 1.85 },
      { id: 60, x: 5030, y: 412, minX: 4900, maxX: 5170, speed: 2.0 }
    ],
    decorations: [
      { x: 120, y: 394, w: 74, h: 66, color: "#8ecae6" },
      { x: 1150, y: 386, w: 82, h: 74, color: "#219ebc" },
      { x: 2380, y: 388, w: 76, h: 72, color: "#8ecae6" },
      { x: 3550, y: 390, w: 84, h: 70, color: "#219ebc" },
      { x: 4730, y: 382, w: 92, h: 78, color: "#8ecae6" }
    ],
    dungeonStart: 1800,
    torchXs: [1920, 2460, 3000, 3540, 4080, 4620]
  }
};

// Each stage theme provides a cohesive palette so the procedural layout can still
// feel like a deliberately-authored location instead of a generic random map.
const stageVisuals = {
  1: {
    name: "野外",
    theme: "wilds",
    sky: ["#7fd3ff", "#d8f3ff", "#f7e5b7"],
    depth: ["#d1eef8", "#98c9ad", "#6da56f"],
    platform: { ground: "#7a5a3a", top: "#98c26f", stone: "#8f7b63", trim: "#2d2217" },
    deco: ["#6fa96c", "#7ebf68", "#5b8f57"]
  },
  2: {
    name: "洞窟",
    theme: "cavern",
    sky: ["#162032", "#23334b", "#314662"],
    depth: ["#344a5f", "#2b394b", "#1e2834"],
    platform: { ground: "#48525e", top: "#7d8a96", stone: "#66717d", trim: "#1c232b" },
    deco: ["#5d7689", "#7c93a6", "#445869"]
  },
  3: {
    name: "火山",
    theme: "volcano",
    sky: ["#451313", "#7a1e16", "#cf5c36"],
    depth: ["#5f1b15", "#89251a", "#31110f"],
    platform: { ground: "#5a3420", top: "#d97706", stone: "#7c3f21", trim: "#2c160d" },
    deco: ["#ff7b00", "#ff5400", "#c2410c"]
  },
  4: {
    name: "鐘乳石洞",
    theme: "stalactite",
    sky: ["#0f172a", "#1e293b", "#334155"],
    depth: ["#475569", "#64748b", "#1e293b"],
    platform: { ground: "#56657a", top: "#cbd5e1", stone: "#7b8ba1", trim: "#1f2937" },
    deco: ["#cbd5e1", "#94a3b8", "#e2e8f0"]
  },
  5: {
    name: "古代遺跡",
    theme: "ruins",
    sky: ["#20334a", "#355070", "#6d597a"],
    depth: ["#495f77", "#6c757d", "#2a2f3a"],
    platform: { ground: "#6b5b45", top: "#d4b483", stone: "#8b7d65", trim: "#2f2418" },
    deco: ["#b08968", "#ddb892", "#a98467"]
  }
};

let activeStageMap = null;

function createSeededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function randomRange(rand, min, max) {
  return min + rand() * (max - min);
}

function makePlatform(x, y, w, h, type = "stone", moving = false, axis = "x", range = 0, speed = 0, phase = 0) {
  return {
    x,
    y,
    w,
    h,
    type,
    moving,
    axis,
    range,
    speed,
    phase,
    currentX: x,
    currentY: y,
    deltaX: 0,
    deltaY: 0
  };
}

function hasPlatformClearanceConflict(platforms, candidate, minGapX = 36, minGapY = 42) {
  return platforms.some((platform) => {
    const leftGap = candidate.x - (platform.x + platform.w);
    const rightGap = platform.x - (candidate.x + candidate.w);
    const horizontalGap = Math.max(leftGap, rightGap);
    const topGap = candidate.y - (platform.y + platform.h);
    const bottomGap = platform.y - (candidate.y + candidate.h);
    const verticalGap = Math.max(topGap, bottomGap);
    const overlapsX = horizontalGap < minGapX;
    const overlapsY = verticalGap < minGapY;
    return overlapsX && overlapsY;
  });
}

function buildStagePlatforms(stageNumber, rand) {
  const platforms = [makePlatform(0, 460, 520, 80, "ground")];
  let x = 420;
  let laneY = 390 - stageNumber * 8;
  let routeIndex = 0;
  let lastMainEnd = 520;
  const stageDifficulty = clamp((stageNumber - 1) / 4, 0, 1);
  const gapMin = lerp(126, 176, stageDifficulty);
  const gapMax = lerp(172, 244, stageDifficulty);
  const earlyGapMin = lerp(118, 146, stageDifficulty);
  const earlyGapMax = lerp(162, 196, stageDifficulty);
  const laneSwing = lerp(24, 54, stageDifficulty);
  const earlyLaneSwing = lerp(20, 32, stageDifficulty);
  const minLaneY = lerp(292, 248, stageDifficulty);
  const widthMin = lerp(172, 118, stageDifficulty);
  const widthMax = lerp(228, 182, stageDifficulty);
  const movingChance = lerp(0.08, 0.24, stageDifficulty);
  const movingRangeX = lerp(28, 58, stageDifficulty);
  const movingRangeY = lerp(14, 30, stageDifficulty);
  const movingSpeedMin = lerp(0.0032, 0.0054, stageDifficulty);
  const movingSpeedMax = lerp(0.0064, 0.0105, stageDifficulty);
  const supportChance = lerp(0.55, 0.24, stageDifficulty);
  const upperPlatformChance = lerp(0.1, 0.28, stageDifficulty);

  // The main route is generated left-to-right with small height swings so stages
  // stay readable while still changing shape every run.
  while (x < WORLD_WIDTH - 520) {
    const earlyRoute = routeIndex < 4;
    x = Math.round(lastMainEnd + randomRange(rand, earlyRoute ? earlyGapMin : gapMin, earlyRoute ? earlyGapMax : gapMax));
    laneY = clamp(
      laneY + randomRange(rand, earlyRoute ? -earlyLaneSwing : -laneSwing, earlyRoute ? earlyLaneSwing : laneSwing),
      earlyRoute ? Math.max(290, minLaneY + 34) : minLaneY,
      410
    );
    const width = Math.round(randomRange(rand, widthMin, widthMax));
    const moving = !earlyRoute && rand() < movingChance;
    const axis = rand() < 0.65 ? "x" : "y";
    const range = moving ? Math.round(randomRange(rand, 18, axis === "x" ? movingRangeX : movingRangeY)) : 0;
    const speed = moving ? randomRange(rand, movingSpeedMin, movingSpeedMax) : 0;
    const mainPlatform = makePlatform(Math.round(x), Math.round(laneY), width, 24, "stone", moving, axis, range, speed, rand() * Math.PI * 2);
    platforms.push(mainPlatform);
    lastMainEnd = mainPlatform.x + mainPlatform.w;

    if (earlyRoute || rand() < supportChance) {
      const supportWidth = Math.round(randomRange(rand, 150, 250));
      const supportX = clamp(
        Math.round(mainPlatform.x + mainPlatform.w / 2 - supportWidth / 2 + randomRange(rand, -20, 20)),
        0,
        WORLD_WIDTH - supportWidth
      );
      const supportPlatform = makePlatform(supportX, 460, supportWidth, 80, "ground");
      if (!hasPlatformClearanceConflict(platforms, supportPlatform, 26, 18)) {
        platforms.push(supportPlatform);
      }
    }

    if (rand() < upperPlatformChance) {
      const upperY = clamp(laneY - randomRange(rand, 70, 110), 220, 360);
      const upperPlatform = makePlatform(
        Math.round(x + randomRange(rand, -10, 34)),
        Math.round(upperY),
        Math.round(randomRange(rand, 84, 120)),
        22,
        "stone"
      );
      if (!hasPlatformClearanceConflict(platforms, upperPlatform, 54, 46)) {
        platforms.push(upperPlatform);
      }
    }

    routeIndex += 1;
  }

  platforms.push(makePlatform(WORLD_WIDTH - 720, 460, 720, 80, "ground"));
  return platforms.sort((a, b) => a.x - b.x);
}

function buildStageDecorations(stageNumber, rand) {
  const visuals = stageVisuals[stageNumber];
  const decorations = [];
  for (let i = 0; i < 7; i++) {
    decorations.push({
      x: 120 + i * 760 + Math.round(randomRange(rand, -80, 80)),
      y: 378 + Math.round(randomRange(rand, -10, 18)),
      w: Math.round(randomRange(rand, 70, 100)),
      h: Math.round(randomRange(rand, 62, 92)),
      color: visuals.deco[i % visuals.deco.length]
    });
  }
  return decorations;
}

function buildStageEnemies(stageNumber, platforms, rand) {
  const stonePlatforms = platforms.filter((platform) => platform.type === "stone");
  const enemies = [];
  let id = stageNumber * 100;

  // Ground enemies claim selected platforms, while flyers are layered on top so
  // the stage always mixes movement challenges with ranged pressure.
  for (let index = 0; index < stonePlatforms.length; index += 2) {
    const platform = stonePlatforms[index];
    enemies.push({
      id: ++id,
      x: platform.x + platform.w * 0.5 - 18,
      y: platform.y - 48,
      minX: platform.x + 8,
      maxX: platform.x + platform.w - 8,
      speed: 1.05 + stageNumber * 0.08 + (index % 3) * 0.1
    });
  }

  const flyersPerStage = 2 + Math.floor(stageNumber / 2);
  for (let index = 0; index < flyersPerStage; index++) {
    const anchorX = 820 + index * 980 + Math.round(randomRange(rand, -120, 120));
    enemies.push({
      id: ++id,
      x: clamp(anchorX, 260, WORLD_WIDTH - 260),
      y: 170 + (index % 3) * 46 + Math.round(randomRange(rand, -12, 12)),
      minX: clamp(anchorX - 120, 160, WORLD_WIDTH - 340),
      maxX: clamp(anchorX + 120, 300, WORLD_WIDTH - 100),
      speed: 1.15 + stageNumber * 0.1,
      flying: true,
      shootCooldownBase: 118 - stageNumber * 6
    });
  }

  return enemies;
}

function buildStageMap(stageNumber) {
  const rand = createSeededRandom(Math.floor(Date.now() / 1000) + stageNumber * 7919);
  const platforms = buildStagePlatforms(stageNumber, rand);
  const visuals = stageVisuals[stageNumber];
  return {
    platforms,
    enemies: buildStageEnemies(stageNumber, platforms, rand),
    decorations: buildStageDecorations(stageNumber, rand),
    torchXs: platforms.filter((platform) => platform.type === "ground").slice(1, 7).map((platform) => platform.x + 30),
    dungeonStart: Math.floor(WORLD_WIDTH * 0.58),
    theme: visuals.theme,
    themeName: visuals.name,
    visuals
  };
}

function damagePlayer(amount, sourceX, knockback = 5.6, lift = -4.8, message = "You were overwhelmed by the hazards.") {
  if (player.invincibleTimer > 0 || state !== "playing") return false;
  player.health -= amount;
  player.hurtTimer = 14;
  player.invincibleTimer = 70;
  player.vx = sourceX > player.x ? -knockback : knockback;
  player.vy = lift;
  if (player.health <= 0) {
    triggerLoss(message);
  }
  return true;
}

function spawnStageHazard() {
  if (stagePhase !== "field") return;
  const stageMap = getStageMap();
  const centerX = clamp(player.x + player.w / 2 + player.vx * 14, 120, WORLD_WIDTH - 120);
  const dir = player.facing > 0 ? 1 : -1;

  if (currentStage === 2) {
    const startX = clamp(centerX + (Math.random() - 0.5) * 240, 90, WORLD_WIDTH - 90);
    const targetX = clamp(centerX + (Math.random() - 0.5) * 80, 80, WORLD_WIDTH - 80);
    const targetY = clamp(player.y + 16, 220, 410);
    stageHazards.push({
      type: "batDive",
      x: startX,
      y: -42,
      w: 34,
      h: 26,
      vx: clamp((targetX - startX) / 42, -4.2, 4.2),
      vy: clamp((targetY + 30) / 36, 2.8, 5.2),
      life: 150,
      damage: 1
    });
    stageHazardTimer = 130 + Math.floor(Math.random() * 90);
    return;
  }

  if (currentStage === 3) {
    const grounds = stageMap.platforms.filter((platform) => platform.type === "ground");
    const ground = grounds.find((platform) => centerX > platform.x + 36 && centerX < platform.x + platform.w - 36) || grounds[Math.floor(Math.random() * grounds.length)];
    const ventX = clamp(centerX + (Math.random() - 0.5) * 90, ground.x + 34, ground.x + ground.w - 34);
    stageHazards.push({
      type: "lavaGeyser",
      x: ventX - 18,
      y: 330,
      w: 36,
      h: 130,
      warmup: 26,
      life: 72,
      damage: 1
    });
    stageHazardTimer = 105 + Math.floor(Math.random() * 70);
    return;
  }

  if (currentStage === 4) {
    const dropX = clamp(centerX + (Math.random() - 0.5) * 120, 70, WORLD_WIDTH - 70);
    stageHazards.push({
      type: "stalactite",
      x: dropX - 12,
      y: 18,
      w: 24,
      h: 42,
      vy: 0,
      warmup: 24,
      life: 150,
      damage: 2
    });
    stageHazardTimer = 110 + Math.floor(Math.random() * 85);
    return;
  }

  if (currentStage === 5) {
    const fromLeft = Math.random() < 0.5;
    stageHazards.push({
      type: "rollingStone",
      x: fromLeft ? -52 : WORLD_WIDTH + 12,
      y: 412,
      w: 42,
      h: 42,
      vx: fromLeft ? 4.2 : -4.2,
      vy: 0,
      spin: 0,
      life: 260,
      damage: 2
    });
    stageHazardTimer = 145 + Math.floor(Math.random() * 95);
  }
}

function updateStageHazards() {
  if (stagePhase !== "field") return;
  stageHazardTimer--;
  if (currentStage >= 2 && stageHazardTimer <= 0) {
    spawnStageHazard();
  }

  for (const hazard of stageHazards) {
    hazard.life--;
    if (hazard.type === "batDive") {
      hazard.x += hazard.vx;
      hazard.y += hazard.vy;
      hazard.vy = Math.min(hazard.vy + 0.04, 6.2);
    } else if (hazard.type === "lavaGeyser") {
      if (hazard.warmup > 0) {
        hazard.warmup--;
      } else {
        hazard.h = 110 + Math.sin((72 - hazard.life) * 0.22) * 24;
      }
    } else if (hazard.type === "stalactite") {
      if (hazard.warmup > 0) {
        hazard.warmup--;
      } else {
        hazard.vy += 0.26;
        hazard.y += hazard.vy;
      }
    } else if (hazard.type === "rollingStone") {
      hazard.x += hazard.vx;
      hazard.spin += hazard.vx * 0.08;
    }

    let hitbox = hazard;
    if (hazard.type === "lavaGeyser") {
      hitbox = {
        x: hazard.x + 4,
        y: 460 - hazard.h,
        w: hazard.w - 8,
        h: hazard.warmup > 0 ? 0 : hazard.h
      };
    }

    if (hazard.type === "batDive" || hazard.type === "stalactite" || hazard.type === "rollingStone" || (hazard.type === "lavaGeyser" && hazard.warmup === 0)) {
      if (rectsOverlap(player, hitbox)) {
        damagePlayer(hazard.damage, hazard.x, 6, hazard.type === "lavaGeyser" ? -6.2 : -5.2, "You were defeated by the stage hazards.");
        hazard.life = 0;
      }
    }

    if (hazard.type === "stalactite" && hazard.y > 460) {
      hazard.life = 0;
    }
    if (hazard.type === "batDive" && (hazard.y > HEIGHT + 60 || hazard.x < -120 || hazard.x > WORLD_WIDTH + 120)) {
      hazard.life = 0;
    }
    if (hazard.type === "rollingStone" && (hazard.x < -120 || hazard.x > WORLD_WIDTH + 120)) {
      hazard.life = 0;
    }
  }

  stageHazards = stageHazards.filter((hazard) => hazard.life > 0);
}

function getStageMap() {
  return activeStageMap || stageMaps[currentStage];
}

function getActivePlatforms() {
  if (stagePhase === "boss" && boss) {
    return bossArenas[currentStage].platforms;
  }
  return getStageMap().platforms;
}

function getActiveWorldWidth() {
  if (stagePhase === "boss" && boss) {
    return bossArenas[currentStage].width;
  }
  return WORLD_WIDTH;
}

function createPlayer() {
  return {
    x: 90,
    y: 340,
    w: 40,
    h: 56,
    vx: 0,
    vy: 0,
    speed: 3.8,
    jumpPower: 15.8,
    onGround: false,
    facing: 1,
    health: 5,
    maxHealth: 5,
    level: 1,
    score: 0,
    lives: 5,
    coins: 0,
    relics: 0,
    xp: 0,
    nextLevelXp: 100,
    attackPower: 1,
    hitEnemies: new Set(),
    attackTimer: 0,
    attackStage: 0,
    queuedAttack: false,
    hurtTimer: 0,
    invincibleTimer: 0,
    levelUpFlash: 0,
    stepCycle: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jumpHeld: false,
    jumpHoldTimer: 0,
    defeatTimer: 0,
    defeatTilt: 0
  };
}

function createEnemies() {
  const stageMap = getStageMap();
  // Rebuild enemies from immutable blueprints whenever the run restarts.
  return stageMap.enemies.map((enemy) => ({
    ...enemy,
    stageTier: getStageTier(enemy.x),
    y: enemy.y,
    w: enemy.flying ? 32 : 34,
    h: enemy.flying ? 34 : 48,
    vx: (enemy.flying ? enemy.speed * 0.72 : enemy.speed) * (1 + getStageTier(enemy.x) * 0.15 + (currentStage - 1) * 0.12),
    contactDamage: 1 + Math.floor(getStageTier(enemy.x) / 2) + Math.floor((currentStage - 1) / 2),
    health: 3 + getStageTier(enemy.x) * 2 + (currentStage - 1) * 2,
    maxHealth: 3 + getStageTier(enemy.x) * 2 + (currentStage - 1) * 2,
    alive: true,
    hurtTimer: 0,
    baseY: enemy.y,
    hoverPhase: enemy.id * 0.37,
    shootCooldown: enemy.flying ? (enemy.shootCooldownBase || 120) - Math.floor((enemy.id % 3) * 10) : 0
  }));
}

let player = createPlayer();
activeStageMap = buildStageMap(currentStage);
let enemies = createEnemies();

const finish = { x: WORLD_WIDTH - 90, y: 300, w: 22, h: 160 };

function resetGame() {
  currentStage = 1;
  stagePhase = "field";
  player = createPlayer();
  activeStageMap = buildStageMap(currentStage);
  enemies = createEnemies();
  lootDrops = [];
  bossProjectiles = [];
  enemyProjectiles = [];
  stageHazards = [];
  stageHazardTimer = 110;
  boss = null;
  cameraX = 0;
  state = "playing";
  overlay.classList.add("hidden");
}

function setupStage(stageNumber) {
  currentStage = stageNumber;
  stagePhase = "field";
  activeStageMap = buildStageMap(currentStage);
  enemies = createEnemies();
  lootDrops = [];
  bossProjectiles = [];
  enemyProjectiles = [];
  stageHazards = [];
  stageHazardTimer = 90;
  boss = null;
  player.x = 90;
  player.y = 340;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.hitEnemies.clear();
  player.attackTimer = 0;
  player.attackStage = 0;
  player.queuedAttack = false;
  player.hurtTimer = 0;
  player.invincibleTimer = 0;
  player.jumpHeld = false;
  player.jumpHoldTimer = 0;
  player.coyoteTimer = 0;
  player.jumpBufferTimer = 0;
  // Each new stage starts with refreshed health so progression feels fair.
  player.health = player.maxHealth;
  cameraX = 0;
  state = "playing";
  overlay.classList.add("hidden");
}

function restartCurrentStage() {
  player.health = player.maxHealth; // 重置血量
  player.defeatTimer = 0;           // 清除死亡動畫計時
  if (stagePhase === "boss") {
    beginBossFight();
    overlay.classList.add("hidden");
    return;
  }
  setupStage(currentStage);
}

function createBoss(stageNumber) {
  const blueprint = bossBlueprints[stageNumber - 1];
  const arena = bossArenas[stageNumber];
  return {
    ...blueprint,
    stage: stageNumber,
    x: arena.width - 280,
    y: 460 - blueprint.size,
    w: blueprint.size,
    h: blueprint.size,
    minX: 180,
    maxX: arena.width - 80,
    vx: blueprint.speed,
    health: blueprint.health,
    maxHealth: blueprint.health,
    alive: true,
    hurtTimer: 0,
    attackCooldown: 70,
    dashTimer: 0,
    airDash: false,
    transformed: false,
    armorDefense: stageNumber === 5 ? 0 : 0,
    windupTimer: 0,
    castTimer: 0,
    attackCycle: 0,
    pendingAttack: null
  };
}

function beginBossFight() {
  stagePhase = "boss";
  boss = createBoss(currentStage);
  enemies = [];
  lootDrops = [];
  bossProjectiles = [];
  enemyProjectiles = [];
  stageHazards = [];
  player.x = 120;
  player.y = 340;
  player.vx = 0;
  player.vy = 0;

  // 重置玩家受傷狀態，避免死掉重來後立刻被判斷死亡
  player.health = player.maxHealth; 
  player.defeatTimer = 0;

  player.hitEnemies.clear();
  player.attackTimer = 0;
  player.attackStage = 0;
  player.queuedAttack = false;
  player.invincibleTimer = 0;
  cameraX = clamp(player.x - WIDTH * 0.38, 0, getActiveWorldWidth() - WIDTH);
  state = "playing";
}

function setOverlay(title, text, buttonText = "Try Again") {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function hurtBoxFor(entity, insetX = 0, insetY = 0) {
  return {
    x: entity.x + insetX,
    y: entity.y + insetY,
    w: Math.max(6, entity.w - insetX * 2),
    h: Math.max(6, entity.h - insetY * 2)
  };
}

function playerHurtBox() {
  return hurtBoxFor(player, 8, 8);
}

function enemyHurtBox(enemy) {
  return hurtBoxFor(enemy, enemy.flying ? 7 : 6, enemy.flying ? 7 : 6);
}

function bossHurtBox(bossEntity) {
  return hurtBoxFor(bossEntity, 10, 8);
}

function attackBoxFor(playerEntity) {
  const progress = getAttackProgress(playerEntity);
  const isSecondSlash = playerEntity.attackStage === 2;
  const windup = progress < 0.35;
  const active = progress >= 0.35 && progress < 0.78;
  const recover = progress >= 0.78;
  const reach = windup ? (isSecondSlash ? 18 : 14) : active ? (isSecondSlash ? 50 : 44) : (isSecondSlash ? 24 : 20);
  const width = windup ? (isSecondSlash ? 18 : 14) : active ? (isSecondSlash ? 30 : 26) : (isSecondSlash ? 20 : 16);
  const height = windup ? (isSecondSlash ? 18 : 16) : active ? (isSecondSlash ? 26 : 24) : (isSecondSlash ? 18 : 16);
  const yOffset = windup ? (isSecondSlash ? 12 : 16) : active ? (isSecondSlash ? 10 : 14) : (isSecondSlash ? 18 : 20);
  // Attack range follows the sword line more closely so edge touches don't count as full hits.
  return {
    x: playerEntity.facing > 0 ? playerEntity.x + playerEntity.w - 2 + reach * 0.18 : playerEntity.x - reach - width * 0.18 + 2,
    y: playerEntity.y + yOffset,
    w: width + reach * 0.42,
    h: height
  };
}

function getAttackProgress(playerEntity) {
  if (playerEntity.attackTimer <= 0) return 0;
  return 1 - playerEntity.attackTimer / ATTACK_DURATION;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeInOutCubic(value) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }
  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getStageTier(x) {
  return clamp(Math.floor((x / WORLD_WIDTH) * 5), 0, 4);
}

function getPlatformRect(platform) {
  return {
    x: platform.currentX ?? platform.x,
    y: platform.currentY ?? platform.y,
    w: platform.w,
    h: platform.h
  };
}

function updateMovingPlatforms() {
  if (stagePhase !== "field") return;
  for (const platform of getStageMap().platforms) {
    const prevX = platform.currentX ?? platform.x;
    const prevY = platform.currentY ?? platform.y;
    if (platform.moving) {
      const swing = Math.sin(lastTime * platform.speed + platform.phase) * platform.range;
      platform.currentX = platform.x + (platform.axis === "x" ? swing : 0);
      platform.currentY = platform.y + (platform.axis === "y" ? swing : 0);
    } else {
      platform.currentX = platform.x;
      platform.currentY = platform.y;
    }
    platform.deltaX = platform.currentX - prevX;
    platform.deltaY = platform.currentY - prevY;
  }
}

function awardPoints(points) {
  player.score += points;
}

function awardXp(amount) {
  player.xp += amount;
  while (player.xp >= player.nextLevelXp) {
    player.xp -= player.nextLevelXp;
    levelUpPlayer();
  }
}

function levelUpPlayer() {
  player.level += 1;
  player.nextLevelXp = Math.round(player.nextLevelXp * 1.35);
  player.maxHealth += 1;
  player.health = Math.min(player.maxHealth, player.health + 1);
  player.attackPower += 1;
  player.speed += 0.3;
  player.jumpPower += 0.45;
  player.levelUpFlash = 50;
}

function damageEnemy(enemy, damage, knockbackDirection, points = 10, xp = 20) {
  enemy.health -= damage;
  enemy.hurtTimer = 8;
  enemy.x += knockbackDirection * 18;
  awardPoints(points);
  awardXp(xp);
  if (enemy.health <= 0) {
    enemy.alive = false;
    awardPoints(100);
    awardXp(45);
    spawnLoot(enemy);
  }
}

function canStompEnemy(enemy) {
  const previousBottom = player.y + player.h - player.vy;
  const enemyBox = enemyHurtBox(enemy);
  const stompBand = enemyBox.y + 12;
  const horizontalOverlap =
    player.x + player.w - 8 > enemyBox.x &&
    player.x + 8 < enemyBox.x + enemyBox.w;

  return player.vy > 1.8 && previousBottom <= stompBand && horizontalOverlap;
}

function getEquipmentPalette(level) {
  if (level >= 7) {
    return {
      tunic: "#4c6ef5",
      tunicStroke: "#243c84",
      hat: "#3b5bdb",
      hatStroke: "#22326f",
      trim: "#ffd166",
      sword: "#f1f3f5",
      swordStroke: "#6c757d",
      shield: "#7c3aed",
      shieldStroke: "#4c1d95"
    };
  }

  if (level >= 4) {
    return {
      tunic: "#2b8a3e",
      tunicStroke: "#1f5f2f",
      hat: "#2f9e44",
      hatStroke: "#135724",
      trim: "#ffe066",
      sword: "#dee2e6",
      swordStroke: "#5c677d",
      shield: "#3a86ff",
      shieldStroke: "#224b6b"
    };
  }

  return {
    tunic: "#2f9e44",
    tunicStroke: "#1f5f2f",
    hat: "#22863a",
    hatStroke: "#135724",
    trim: "#c77d3b",
    sword: "#d9e2ec",
    swordStroke: "#5c677d",
    shield: "#4d7ea8",
    shieldStroke: "#224b6b"
  };
}

function spawnLoot(enemy) {
  const baseCoinCount = 2 + enemy.stageTier;
  for (let index = 0; index < baseCoinCount; index++) {
    lootDrops.push({
      type: "coin",
      x: enemy.x + enemy.w / 2 + (index - baseCoinCount / 2) * 10,
      y: enemy.y + 8,
      w: 16,
      h: 16,
      vy: -4.5 - Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 2.8,
      value: 15 + enemy.stageTier * 5,
      bounce: 0.34,
      collected: false
    });
  }

  if (Math.random() < 0.45 + enemy.stageTier * 0.12) {
    lootDrops.push({
      type: "relic",
      x: enemy.x + enemy.w / 2 - 10,
      y: enemy.y - 4,
      w: 20,
      h: 20,
      vy: -6.2,
      vx: (Math.random() - 0.5) * 2,
      value: 120 + enemy.stageTier * 40,
      xp: 35 + enemy.stageTier * 10,
      bounce: 0.18,
      collected: false
    });
  }
}

function spawnBossLoot(defeatedBoss) {
  for (let i = 0; i < 8 + defeatedBoss.stage; i++) {
    lootDrops.push({
      type: "coin",
      x: defeatedBoss.x + defeatedBoss.w / 2 + (Math.random() - 0.5) * 46,
      y: defeatedBoss.y + defeatedBoss.h / 2,
      w: 16,
      h: 16,
      vy: -5.8 - Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 4.2,
      value: 30 + defeatedBoss.stage * 10,
      bounce: 0.3,
      collected: false
    });
  }

  lootDrops.push({
    type: "relic",
    x: defeatedBoss.x + defeatedBoss.w / 2 - 12,
    y: defeatedBoss.y,
    w: 24,
    h: 24,
    vy: -7.2,
    vx: 0,
    value: 220 + defeatedBoss.stage * 60,
    xp: 90 + defeatedBoss.stage * 20,
    bounce: 0.12,
    collected: false
  });
}

function createBossAttackPlan(attackType) {
  if (!boss || !boss.alive) return null;
  const arena = bossArenas[boss.stage];
  const dir = player.x > boss.x ? 1 : -1;
  const centerX = boss.x + boss.w / 2;
  const centerY = boss.y + boss.h / 2;
  const targetCenterX = clamp(player.x + player.w / 2 + player.vx * 10, 90, arena.width - 90);

  if (attackType === "thorn") {
    return {
      type: attackType,
      windup: bossAttackStyles.thorn.windup,
      targetX: targetCenterX,
      markers: [{ shape: "roots", x: targetCenterX - 22, y: 410, w: 44, h: 52 }]
    };
  }

  if (attackType === "rock") {
    const impactXs = [
      clamp(targetCenterX - dir * 36, 90, arena.width - 90),
      clamp(targetCenterX + dir * 54, 90, arena.width - 90)
    ];
    return {
      type: attackType,
      windup: bossAttackStyles.rock.windup,
      impacts: impactXs,
      markers: impactXs.map((impactX, index) => ({
        shape: "impact",
        x: impactX,
        y: 436,
        r: 18 - index * 2
      }))
    };
  }

  if (attackType === "bat") {
    return {
      type: attackType,
      windup: bossAttackStyles.bat.windup,
      dir,
      markers: [
        { shape: "wing", x: centerX + dir * 36, y: centerY - 48, r: 18 },
        { shape: "wing", x: centerX + dir * 78, y: centerY - 26, r: 14 }
      ]
    };
  }

  if (attackType === "fire") {
    const ventXs = [
      clamp(centerX + dir * 80, 100, arena.width - 100),
      clamp(centerX + dir * 165, 100, arena.width - 100)
    ];
    return {
      type: attackType,
      windup: bossAttackStyles.fire.windup,
      dir,
      vents: ventXs,
      markers: ventXs.map((ventX) => ({ shape: "vent", x: ventX, y: 438, r: 20 }))
    };
  }

  if (attackType === "shard") {
    return {
      type: attackType,
      windup: bossAttackStyles.shard.windup,
      impacts: [
        clamp(targetCenterX - 42, 90, arena.width - 90),
        clamp(targetCenterX + 18, 90, arena.width - 90),
        clamp(targetCenterX + 76, 90, arena.width - 90)
      ],
      markers: [
        { shape: "crystal", x: clamp(targetCenterX - 42, 90, arena.width - 90), y: 436, r: 14 },
        { shape: "crystal", x: clamp(targetCenterX + 18, 90, arena.width - 90), y: 436, r: 16 },
        { shape: "crystal", x: clamp(targetCenterX + 76, 90, arena.width - 90), y: 436, r: 12 }
      ]
    };
  }

  if (attackType === "boulder") {
    return {
      type: attackType,
      windup: bossAttackStyles.boulder.windup,
      dir,
      markers: [{
        shape: "trail",
        x1: centerX,
        y1: 438,
        x2: clamp(player.x + player.w / 2, 110, arena.width - 110),
        y2: 438
      }, {
        shape: "impact",
        x: centerX + dir * 28,
        y: 430,
        r: 18
      }]
    };
  }

  if (attackType === "slash") {
    return {
      type: attackType,
      windup: bossAttackStyles.slash.windup,
      dir,
      markers: [{
        shape: "arc",
        x: centerX + dir * 58,
        y: centerY + 6,
        r: 42
      }]
    };
  }

  if (attackType === "beam") {
    return {
      type: attackType,
      windup: bossAttackStyles.beam.windup,
      dir,
      markers: [{
        shape: "beam",
        x1: centerX + dir * 20,
        y1: centerY - 8,
        x2: clamp(player.x + player.w / 2 + dir * 30, 90, arena.width - 90),
        y2: centerY - 8
      }]
    };
  }

  if (attackType === "summon") {
    return {
      type: attackType,
      windup: bossAttackStyles.summon.windup,
      summonXs: [clamp(centerX - 140, 120, arena.width - 120), clamp(centerX + 140, 120, arena.width - 120)],
      markers: [
        { shape: "summon", x: clamp(centerX - 140, 120, arena.width - 120), y: 438, r: 22 },
        { shape: "summon", x: clamp(centerX + 140, 120, arena.width - 120), y: 438, r: 22 }
      ]
    };
  }

  if (attackType === "dash") {
    return {
      type: attackType,
      windup: bossAttackStyles.dash.windup,
      dir,
      markers: [{
        shape: "trail",
        x1: centerX,
        y1: centerY + 6,
        x2: clamp(player.x + player.w / 2, 80, arena.width - 80),
        y2: centerY + 6
      }]
    };
  }

  return null;
}

function beginBossAttackWindup(attackType) {
  if (!boss || !boss.alive) return;
  const plan = createBossAttackPlan(attackType);
  if (!plan) return;
  boss.pendingAttack = plan;
  boss.windupTimer = plan.windup;
  boss.castTimer = plan.windup;
}

function spawnBossAttack(plan = boss?.pendingAttack) {
  if (!boss || !boss.alive) return;
  const attackPlan = plan || createBossAttackPlan("thorn");
  const attackType = attackPlan.type;
  const dir = attackPlan.dir ?? (player.x > boss.x ? 1 : -1);
  const centerX = boss.x + boss.w / 2;
  const centerY = boss.y + boss.h / 2;

  if (attackType === "thorn") {
    bossProjectiles.push({
      type: "thorn",
      x: (attackPlan.targetX ?? centerX) - 11,
      y: 430,
      w: 22,
      h: 32,
      vx: 0,
      vy: 0,
      damage: 1,
      life: 90,
      fill: bossAttackStyles.thorn.fill,
      stroke: bossAttackStyles.thorn.stroke
    });
  } else if (attackType === "rock") {
    for (const [index, impactX] of attackPlan.impacts.entries()) {
      bossProjectiles.push({
        type: "rock",
        x: impactX - 10,
        y: -40 - index * 30,
        w: 20,
        h: 20,
        vx: dir * (index === 0 ? 0.8 : 0.45),
        vy: 2.6 + index * 0.6,
        damage: 1,
        life: 120,
        fill: bossAttackStyles.rock.fill,
        stroke: bossAttackStyles.rock.stroke
      });
    }
  } else if (attackType === "bat") {
    bossProjectiles.push({
      type: "bat",
      x: centerX + dir * 18,
      y: centerY - 38,
      w: 28,
      h: 22,
      vx: dir * 3.8,
      vy: 1.6,
      damage: 2,
      life: 110,
      fill: bossAttackStyles.bat.fill,
      stroke: bossAttackStyles.bat.stroke
    });
    bossProjectiles.push({
      type: "bat",
      x: centerX + dir * 46,
      y: centerY - 14,
      w: 24,
      h: 20,
      vx: dir * 3.2,
      vy: 0.9,
      damage: 1,
      life: 96,
      fill: bossAttackStyles.bat.fill,
      stroke: bossAttackStyles.bat.stroke
    });
  } else if (attackType === "fire") {
    for (const [index, ventX] of attackPlan.vents.entries()) {
      bossProjectiles.push({
        type: "fire",
        x: ventX - 10,
        y: 420 - index * 18,
        w: 20,
        h: 20,
        vx: dir * (2.8 + index * 0.45),
        vy: -3.8 + index * 1.2,
        damage: 2,
        life: 110,
        fill: bossAttackStyles.fire.fill,
        stroke: bossAttackStyles.fire.stroke
      });
    }
  } else if (attackType === "shard") {
    for (const [index, impactX] of attackPlan.impacts.entries()) {
      bossProjectiles.push({
        type: "shard",
        x: impactX - 12,
        y: -60 - index * 26,
        w: 24,
        h: 40,
        vx: dir * 0.18,
        vy: 2.8 + index * 0.45,
        damage: 2,
        life: 120,
        fill: bossAttackStyles.shard.fill,
        stroke: bossAttackStyles.shard.stroke
      });
    }
  } else if (attackType === "boulder") {
    bossProjectiles.push({
      type: "boulder",
      x: centerX + dir * 24,
      y: 410,
      w: 34,
      h: 34,
      vx: dir * 4.2,
      vy: 0,
      damage: 2,
      spin: 0,
      life: 170,
      fill: bossAttackStyles.boulder.fill,
      stroke: bossAttackStyles.boulder.stroke
    });
  } else if (attackType === "slash") {
    bossProjectiles.push({
      type: "slash",
      x: centerX + dir * 26 - (dir > 0 ? 0 : 48),
      y: centerY - 24,
      w: 52,
      h: 56,
      vx: 0,
      vy: 0,
      damage: 2,
      life: 16,
      dir,
      fill: bossAttackStyles.slash.fill,
      stroke: bossAttackStyles.slash.stroke
    });
  } else if (attackType === "beam") {
    const beamLength = Math.max(180, Math.abs((attackPlan.x2 ?? centerX) - centerX));
    bossProjectiles.push({
      type: "beam",
      x: dir > 0 ? centerX + 12 : centerX - beamLength - 12,
      y: centerY - 18,
      w: beamLength + 12,
      h: 24,
      vx: 0,
      vy: 0,
      damage: 3,
      life: 26,
      dir,
      fill: bossAttackStyles.beam.fill,
      stroke: bossAttackStyles.beam.stroke
    });
  } else if (attackType === "summon") {
    for (const summonX of attackPlan.summonXs || []) {
      enemies.push({
        id: Date.now() + Math.random(),
        x: summonX - 17,
        y: 412,
        minX: Math.max(40, summonX - 110),
        maxX: Math.min(getActiveWorldWidth() - 40, summonX + 110),
        speed: 1.45 + (boss.transformed ? 0.25 : 0),
        stageTier: 4,
        w: 34,
        h: 48,
        vx: (Math.random() < 0.5 ? -1 : 1) * (1.45 + (boss.transformed ? 0.25 : 0)),
        contactDamage: boss.transformed ? 3 : 2,
        health: boss.transformed ? 8 : 5,
        maxHealth: boss.transformed ? 8 : 5,
        alive: true,
        hurtTimer: 0,
        baseY: 412,
        hoverPhase: 0,
        shootCooldown: 0,
        summoned: true
      });
    }
  }
}

function updateBossProjectiles() {
  for (const projectile of bossProjectiles) {
    projectile.life--;
    if (projectile.type === "rock" || projectile.type === "fire" || projectile.type === "shard") {
      projectile.vy += projectile.type === "fire" ? 0.1 : 0.2;
    }
    if (projectile.type === "bat") {
      projectile.vy += 0.05;
    }
    if (projectile.type === "boulder") {
      projectile.spin = (projectile.spin || 0) + projectile.vx * 0.12;
    }
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;

    if (projectile.type === "boulder") {
      projectile.y = 410;
    }

    if (player.invincibleTimer === 0 && rectsOverlap(playerHurtBox(), projectile)) {
      damagePlayer(projectile.damage, projectile.x, 5.5, -4.6, `You were defeated by ${boss.name}.`);
      if (projectile.type !== "beam") projectile.life = 0;
      if (state !== "playing") return;
    }

    if (projectile.type === "rock" || projectile.type === "fire" || projectile.type === "shard") {
      if (projectile.y > HEIGHT + 60) projectile.life = 0;
    }
  }

  bossProjectiles = bossProjectiles.filter((projectile) => projectile.life > 0);
}

function drawPixelRect(x, y, w, h, fill, stroke = "#1a1a1a") {
  ctx.fillStyle = stroke;
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, Math.round(w) + 2, Math.round(h) + 2);
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawRoundedRect(x, y, w, h, radius, fill, stroke = "#1a1a1a", lineWidth = 2) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawLimb(x1, y1, x2, y2, width, fill, stroke = "#1a1a1a") {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width + 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

function drawOrb(x, y, rx, ry, fill, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function drawStoneBlock(x, y, w, h, base, top, stroke) {
  drawRoundedRect(x, y, w, h, 6, base, stroke, 2);
  drawRoundedRect(x + 4, y + 3, w - 8, 8, 3, top, stroke, 1);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x + 6, y + 14, Math.max(10, w * 0.28), 4);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(x + 8, y + h - 10, w - 16, 4);
}

function drawKiteShield(x, y, w, h, facing, fill, stroke, trim = "#dfe7f2") {
  const outerLeft = facing > 0 ? x : x + w;
  const outerRight = facing > 0 ? x + w : x;
  const centerX = x + w / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, y);
  ctx.lineTo(outerRight, y + h * 0.24);
  ctx.lineTo(outerRight - facing * 2, y + h * 0.62);
  ctx.quadraticCurveTo(centerX, y + h, outerLeft + facing * 2, y + h * 0.62);
  ctx.lineTo(outerLeft, y + h * 0.24);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, y + 4);
  ctx.lineTo(centerX + facing * (w * 0.2), y + h * 0.5);
  ctx.lineTo(centerX, y + h - 6);
  ctx.lineTo(centerX - facing * (w * 0.2), y + h * 0.5);
  ctx.closePath();
  ctx.fillStyle = trim;
  ctx.fill();
}

function drawTorch(x, y) {
  drawPixelRect(x, y, 8, 20, "#6b4f3b");
  ctx.fillStyle = "rgba(255, 196, 84, 0.22)";
  ctx.beginPath();
  ctx.arc(x + 4, y - 2, 18, 0, Math.PI * 2);
  ctx.fill();
  drawPixelRect(x - 2, y - 8, 12, 10, "#ffb703", "#7a3b00");
}

function updateLoot() {
  const platforms = getActivePlatforms();
  for (const loot of lootDrops) {
    if (loot.collected) continue;

    loot.vy += GRAVITY * 0.65;
    loot.x += loot.vx;
    loot.y += loot.vy;

    for (const platform of platforms) {
      const landing =
        loot.x + loot.w > platform.x &&
        loot.x < platform.x + platform.w &&
        loot.y + loot.h >= platform.y &&
        loot.y + loot.h - loot.vy <= platform.y;

      if (landing && loot.vy >= 0) {
        loot.y = platform.y - loot.h;
        loot.vy *= -loot.bounce;
        if (Math.abs(loot.vy) < 0.8) loot.vy = 0;
      }
    }

    if (rectsOverlap(player, loot)) {
      loot.collected = true;
      if (loot.type === "coin") {
        player.coins += 1;
        awardPoints(loot.value);
      } else {
        player.relics += 1;
        awardPoints(loot.value);
        awardXp(loot.xp);
        player.health = Math.min(player.maxHealth, player.health + 1);
      }
    }
  }

  lootDrops = lootDrops.filter((loot) => !loot.collected);
}

function updatePlayer() {
  const moveLeft = keys.has("a") || keys.has("arrowleft");
  const moveRight = keys.has("d") || keys.has("arrowright");

  if (moveLeft && !moveRight) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (moveRight && !moveLeft) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.72;
    if (Math.abs(player.vx) < 0.08) player.vx = 0;
  }

  if (player.attackTimer > 0) {
    player.attackTimer--;
    if (player.attackTimer === 0) {
      if (player.queuedAttack) {
        player.attackTimer = ATTACK_DURATION;
        player.attackStage = 2;
        player.queuedAttack = false;
        player.hitEnemies.clear();
      } else {
        player.attackStage = 0;
      }
    }
  }
  if (player.hurtTimer > 0) player.hurtTimer--;
  if (player.invincibleTimer > 0) player.invincibleTimer--;
  if (player.levelUpFlash > 0) player.levelUpFlash--;
  player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - 1);
  player.coyoteTimer = player.onGround ? COYOTE_FRAMES : Math.max(0, player.coyoteTimer - 1);
  if (player.onGround && Math.abs(player.vx) > 0.2) {
    player.stepCycle += Math.abs(player.vx) * 0.22;
  } else {
    player.stepCycle += 0.045;
  }

  const rising = player.vy < 0;
  const falling = player.vy > 0;
  if (player.jumpHeld && player.jumpHoldTimer > 0 && rising) {
    player.vy -= JUMP_HOLD_FORCE;
    player.jumpHoldTimer--;
  } else if (!player.jumpHeld) {
    player.jumpHoldTimer = 0;
  }
  const gravityScale = falling ? FALL_GRAVITY_MULTIPLIER : (!player.jumpHeld && rising ? JUMP_CUT_MULTIPLIER : 1);
  player.vy = Math.min(player.vy + GRAVITY * gravityScale, MAX_FALL_SPEED);
  player.x += player.vx;
  handleHorizontalBounds(player);
  player.y += player.vy;
  player.onGround = false;
  // Vertical collision is resolved after movement so landing feels stable.
  resolvePlatformCollisions(player);

  if (player.onGround && player.jumpBufferTimer > 0) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.jumpHoldTimer = JUMP_HOLD_FRAMES;
  }

  if (player.y > HEIGHT + 140) {
    player.health = 0;
    triggerLoss("You fell into the pit. The stage starts over.");
  }
}

function handleHorizontalBounds(entity) {
  entity.x = clamp(entity.x, 0, getActiveWorldWidth() - entity.w);
}

function resolvePlatformCollisions(entity) {
  for (const platform of getActivePlatforms()) {
    const rect = getPlatformRect(platform);
    // Only resolve landing from above to keep platforms one-way.
    const intersects =
      entity.x + entity.w > rect.x &&
      entity.x < rect.x + rect.w &&
      entity.y + entity.h >= rect.y &&
      entity.y + entity.h - entity.vy <= rect.y;

    if (intersects && entity.vy >= 0) {
      entity.y = rect.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
      if (platform.deltaX || platform.deltaY) {
        entity.x += platform.deltaX || 0;
        entity.y += platform.deltaY || 0;
      }
    }
  }
}

function updateEnemies() {
  const platforms = getActivePlatforms();
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    enemy.hurtTimer = Math.max(0, enemy.hurtTimer - 1);
    if (enemy.flying) {
      // Flyers ignore platform gravity and instead hover within a short lane,
      // then open fire once the player enters their engagement range.
      enemy.x += enemy.vx;
      if (enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX) {
        enemy.vx *= -1;
      }
      enemy.y = enemy.baseY + Math.sin(lastTime * 0.005 + enemy.hoverPhase) * 18;
      enemy.shootCooldown = Math.max(0, enemy.shootCooldown - 1);
      const distanceX = Math.abs((enemy.x + enemy.w / 2) - (player.x + player.w / 2));
      if (enemy.shootCooldown === 0 && distanceX < 430) {
        const dir = player.x > enemy.x ? 1 : -1;
        enemyProjectiles.push({
          x: enemy.x + enemy.w / 2 - 5,
          y: enemy.y + enemy.h / 2 - 3,
          w: 14,
          h: 6,
          vx: dir * 4.8,
          vy: clamp((player.y - enemy.y) * 0.015, -1.4, 1.4),
          damage: 1 + Math.floor((currentStage - 1) / 2),
          life: 130,
          fill: "#fca311",
          stroke: "#5f0f40"
        });
        enemy.shootCooldown = (enemy.shootCooldownBase || 120) - currentStage * 4;
      }
    } else {
      // Ground enemies still obey the active platform layout, including moving
      // platforms that can carry them around the arena.
      enemy.x += enemy.vx;
      if (enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX) {
        enemy.vx *= -1;
      }

      // Enemies patrol on their current platform and fall if they walk off.
      const platform = platforms.find((item) => {
        const rect = getPlatformRect(item);
        return enemy.x + enemy.w > rect.x && enemy.x < rect.x + rect.w && Math.abs(rect.y - (enemy.y + enemy.h)) < 3;
      });
      if (!platform) {
        enemy.vy = (enemy.vy || 0) + GRAVITY;
        enemy.y += enemy.vy;
        resolvePlatformCollisions(enemy);
      } else {
        enemy.vy = 0;
        enemy.x += platform.deltaX || 0;
        enemy.y += platform.deltaY || 0;
      }
    }

    if (
      player.attackTimer > 0 &&
      !player.hitEnemies.has(enemy.id) &&
      rectsOverlap(attackBoxFor(player), enemy)
    ) {
      player.hitEnemies.add(enemy.id);
      damageEnemy(enemy, player.attackPower, player.facing);
    }

    if (
      enemy.alive &&
      rectsOverlap(playerHurtBox(), enemyHurtBox(enemy))
    ) {
      if (canStompEnemy(enemy)) {
        player.vy = -9.4;
        player.onGround = false;
        damageEnemy(enemy, Math.max(1, player.attackPower), player.facing, 14, 24);
        continue;
      }

      if (player.invincibleTimer > 0) {
        continue;
      }

      // Short invincibility prevents instant repeated damage on contact.
      player.health -= enemy.contactDamage;
      player.hurtTimer = 14;
      player.invincibleTimer = 70;
      player.vx = enemy.x > player.x ? -5.5 : 5.5;
      player.vy = -5.5;

      if (player.health <= 0) {
        triggerLoss("You ran out of health. The enemies pushed you back.");
        return;
      }
    }
  }
}

function updateEnemyProjectiles() {
  for (const projectile of enemyProjectiles) {
    projectile.life--;
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    if (player.invincibleTimer === 0 && rectsOverlap(player, projectile)) {
      player.health -= projectile.damage;
      player.hurtTimer = 12;
      player.invincibleTimer = 66;
      player.vx = projectile.vx > 0 ? 4.8 : -4.8;
      player.vy = -4.4;
      projectile.life = 0;
      if (player.health <= 0) {
        triggerLoss("You were overwhelmed by enemy darts.");
        return;
      }
    }
  }
  enemyProjectiles = enemyProjectiles.filter((projectile) => projectile.life > 0);
}

function updateBoss() {
  if (!boss || !boss.alive) return;

  boss.hurtTimer = Math.max(0, boss.hurtTimer - 1);
  boss.attackCooldown = Math.max(0, boss.attackCooldown - 1);
  boss.castTimer = Math.max(0, boss.castTimer - 1);
  if (boss.dashTimer > 0) {
    boss.dashTimer--;
  }
  boss.x += boss.vx;
  if (boss.x <= boss.minX || boss.x + boss.w >= boss.maxX) {
    boss.vx *= -1;
  }

  const distanceToPlayer = Math.abs((boss.x + boss.w / 2) - (player.x + player.w / 2));
  if (boss.pendingAttack) {
    boss.windupTimer = Math.max(0, boss.windupTimer - 1);
    if (boss.windupTimer === 0) {
      const releasedAttack = boss.pendingAttack;
      boss.pendingAttack = null;
      if (releasedAttack.type === "dash") {
        boss.vx = releasedAttack.dir * (boss.stage === 3 ? 7.6 : 6.8);
        boss.dashTimer = boss.stage === 3 ? 24 : 18;
        if (boss.stage === 3) {
          boss.airDash = true;
          boss.vy = -8.2;
        }
        boss.attackCooldown = bossAttackStyles.dash.cooldown;
      } else {
        spawnBossAttack(releasedAttack);
        boss.attackCooldown = bossAttackStyles[releasedAttack.type].cooldown;
      }
    }
  } else if (boss.attackCooldown === 0) {
    let nextAttack = boss.primaryAttack;
    if (boss.stage === 5) {
      const phaseOnePattern = ["summon", "slash", "boulder", "dash"];
      const phaseTwoPattern = ["beam", "slash", "boulder", "dash", "summon"];
      const pattern = boss.transformed ? phaseTwoPattern : phaseOnePattern;
      nextAttack = pattern[boss.attackCycle % pattern.length];
      if (nextAttack === "dash" && distanceToPlayer < 120) {
        nextAttack = boss.transformed ? "beam" : "slash";
      }
    } else {
      const shouldDash = distanceToPlayer > 160 && boss.attackCycle % 3 === 2;
      nextAttack = shouldDash ? "dash" : boss.primaryAttack;
    }
    beginBossAttackWindup(nextAttack);
    boss.attackCycle++;
  }
  if (boss.airDash) {
    boss.vy += 0.34;
    boss.y += boss.vy;
    const floorY = 460 - boss.h;
    if (boss.y >= floorY) {
      boss.y = floorY;
      boss.vy = 0;
      boss.airDash = false;
    }
  }
  if (boss.dashTimer === 0 && !boss.airDash) {
    boss.vx = boss.vx > 0 ? bossBlueprints[boss.stage - 1].speed : -bossBlueprints[boss.stage - 1].speed;
  }

  if (
    player.attackTimer > 0 &&
    !player.hitEnemies.has(`boss-${boss.stage}`) &&
    rectsOverlap(attackBoxFor(player), boss)
  ) {
    player.hitEnemies.add(`boss-${boss.stage}`);
    const damage = Math.max(1, player.attackPower - (boss.armorDefense || 0));
    boss.health -= damage;
    boss.hurtTimer = 10;
    boss.x += player.facing * 18;
    awardPoints(40);
    awardXp(40);

    if (boss.health <= 0) {
      if (boss.stage === 5 && !boss.transformed) {
        boss.transformed = true;
        boss.health = 48;
        boss.maxHealth = 48;
        boss.damage += 1;
        boss.speed += 0.35;
        boss.primaryAttack = "beam";
        boss.attackCooldown = 84;
        boss.hurtTimer = 24;
        boss.armorDefense = 1;
        boss.x = Math.max(240, Math.min(getActiveWorldWidth() - 240, boss.x));
        setOverlay("Ancient Colossus Transforms", "The colossus rises again in radiant armor. Its defenses harden and it begins firing beams.", "Continue");
        overlay.classList.remove("hidden");
        state = "playing";
        return;
      }
      boss.alive = false;
      awardPoints(600 + boss.stage * 120);
      awardXp(160 + boss.stage * 40);
      spawnBossLoot(boss);

      if (currentStage >= TOTAL_STAGES) {
        state = "won";
        setOverlay("Maze Adventure Clear", `You defeated ${boss.name} and cleared all ${TOTAL_STAGES} stages with ${player.score} score.`, "Play Again");
      } else {
        state = "stage-clear";
        setOverlay(`Boss Down - Stage ${currentStage}`, `You defeated ${boss.name}. Press the button or Space to enter Stage ${currentStage + 1}.`, `Stage ${currentStage + 1}`);
      }
      return;
    }
  }

  if (
    boss.alive &&
    player.invincibleTimer === 0 &&
    rectsOverlap(playerHurtBox(), bossHurtBox(boss))
  ) {
    player.health -= boss.damage;
    player.hurtTimer = 16;
    player.invincibleTimer = 75;
    player.vx = boss.x > player.x ? -6.2 : 6.2;
    player.vy = -5.8;

    if (player.health <= 0) {
      triggerLoss(`You were defeated by ${boss.name}.`);
    }
  }
}

function triggerLoss(message) {
  player.defeatTimer = 42;
  player.defeatTilt = player.facing > 0 ? -1.15 : 1.15;
  player.lives -= 1;
  state = "lost";
  if (player.lives > 0) {
    setOverlay("Stage Failed", `${message} Lives left: ${player.lives}.`, "Continue");
    return;
  }
  setOverlay("Game Over", `${message} All 5 lives were used up.`, "Restart");
}

function triggerWin() {
  beginBossFight();
  setOverlay(`Boss Fight - Stage ${currentStage}`, `The gate opens and ${boss.name} appears. Defeat the boss to reach the next stage.`, "Enter Boss Arena");
}

function handleOverlayAction() {
  if (state === "stage-clear") {
    setupStage(currentStage + 1);
    return;
  }

  if (state === "playing" && stagePhase === "boss") {
    overlay.classList.add("hidden");
    return;
  }

  if (state === "lost" && player.lives > 0) {
    restartCurrentStage();
    return;
  }

  resetGame();
}

function updateCamera() {
  const target = player.x - WIDTH * 0.38;
  // Smooth follow keeps the player slightly left of center to show more of the path ahead.
  cameraX += (clamp(target, 0, getActiveWorldWidth() - WIDTH) - cameraX) * 0.12;
}

function updateDefeatAnimation() {
  if (player.defeatTimer <= 0) return;
  player.defeatTimer--;
  player.vx *= 0.9;
  player.vy = Math.min(player.vy + GRAVITY * 0.9, 10);
  player.x += player.vx;
  handleHorizontalBounds(player);
  player.y += player.vy;
  player.onGround = false;
  resolvePlatformCollisions(player);
  if (player.onGround) {
    player.vx *= 0.8;
  }
}

function update() {
  if (state === "lost") {
    updateDefeatAnimation();
    updateCamera();
    return;
  }
  if (state !== "playing") return;

  updateMovingPlatforms();
  updatePlayer();
  if (stagePhase === "field") {
    updateEnemies();
    updateEnemyProjectiles();
    updateStageHazards();
  } else {
    updateBoss();
    if (enemies.length > 0) {
      updateEnemies();
    }
  }
  updateBossProjectiles();
  updateLoot();
  updateCamera();

  if (stagePhase === "field" && player.x + player.w >= finish.x) {
    triggerWin();
  }
}

function drawLoot() {
  for (const loot of lootDrops) {
    if (loot.collected) continue;
    const x = loot.x - cameraX;
    if (loot.type === "coin") {
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(x + loot.w / 2, loot.y + loot.h / 2, loot.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff2b2";
      ctx.fillRect(x + 5, loot.y + 4, 6, 8);
    } else {
      ctx.fillStyle = "#6ef3d6";
      ctx.beginPath();
      ctx.moveTo(x + loot.w / 2, loot.y);
      ctx.lineTo(x + loot.w, loot.y + loot.h / 2);
      ctx.lineTo(x + loot.w / 2, loot.y + loot.h);
      ctx.lineTo(x, loot.y + loot.h / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawEnemyProjectiles() {
  for (const projectile of enemyProjectiles) {
    const x = projectile.x - cameraX;
    drawRoundedRect(x, projectile.y, projectile.w, projectile.h, 3, projectile.fill, projectile.stroke, 2);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(x + 3, projectile.y + 1, 4, 2);
  }
}

function drawBossProjectiles() {
  for (const projectile of bossProjectiles) {
    const x = projectile.x - cameraX;
    const fill = projectile.fill || "#ffffff";
    const stroke = projectile.stroke || "#1a1a1a";
    if (projectile.type === "thorn") {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 1, projectile.y + projectile.h);
      ctx.lineTo(x + 5, projectile.y + 15);
      ctx.lineTo(x + 9, projectile.y + projectile.h * 0.78);
      ctx.lineTo(x + 11, projectile.y + 8);
      ctx.lineTo(x + 15, projectile.y + projectile.h * 0.82);
      ctx.lineTo(x + 18, projectile.y);
      ctx.lineTo(x + 21, projectile.y + projectile.h * 0.7);
      ctx.lineTo(x + projectile.w - 1, projectile.y + projectile.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(x + 10, projectile.y + projectile.h * 0.72);
      ctx.lineTo(x + 15, projectile.y + 10);
      ctx.lineTo(x + 17, projectile.y + projectile.h * 0.76);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(56, 38, 24, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 6, projectile.y + projectile.h * 0.88);
      ctx.lineTo(x + 7, projectile.y + 20);
      ctx.moveTo(x + 11, projectile.y + projectile.h * 0.86);
      ctx.lineTo(x + 11.5, projectile.y + 12);
      ctx.moveTo(x + 17, projectile.y + projectile.h * 0.84);
      ctx.lineTo(x + 17.5, projectile.y + 5);
      ctx.stroke();
      ctx.restore();
    } else if (projectile.type === "rock") {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, projectile.y + 2);
      ctx.lineTo(x + 14, projectile.y);
      ctx.lineTo(x + projectile.w - 2, projectile.y + 7);
      ctx.lineTo(x + projectile.w - 4, projectile.y + projectile.h - 3);
      ctx.lineTo(x + 8, projectile.y + projectile.h);
      ctx.lineTo(x, projectile.y + 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(x + 5, projectile.y + 4, 6, 3);
      ctx.restore();
    } else if (projectile.type === "bat") {
      ctx.save();
      drawOrb(x + projectile.w / 2, projectile.y + projectile.h * 0.58, projectile.w * 0.22, projectile.h * 0.26, fill);
      ctx.fillStyle = "rgba(216,243,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(x + 2, projectile.y + projectile.h * 0.52);
      ctx.quadraticCurveTo(x + 8, projectile.y - 2, x + projectile.w / 2 - 1, projectile.y + projectile.h * 0.46);
      ctx.quadraticCurveTo(x + 7, projectile.y + projectile.h * 0.7, x + 2, projectile.y + projectile.h * 0.52);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + projectile.w - 2, projectile.y + projectile.h * 0.52);
      ctx.quadraticCurveTo(x + projectile.w - 8, projectile.y - 2, x + projectile.w / 2 + 1, projectile.y + projectile.h * 0.46);
      ctx.quadraticCurveTo(x + projectile.w - 7, projectile.y + projectile.h * 0.7, x + projectile.w - 2, projectile.y + projectile.h * 0.52);
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + projectile.w * 0.44, projectile.y + projectile.h * 0.6, 1.2, 0, Math.PI * 2);
      ctx.arc(x + projectile.w * 0.56, projectile.y + projectile.h * 0.6, 1.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (projectile.type === "shard") {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + projectile.w / 2, projectile.y);
      ctx.lineTo(x + projectile.w - 2, projectile.y + projectile.h * 0.38);
      ctx.lineTo(x + projectile.w * 0.72, projectile.y + projectile.h);
      ctx.lineTo(x + projectile.w * 0.28, projectile.y + projectile.h);
      ctx.lineTo(x + 2, projectile.y + projectile.h * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + projectile.w / 2, projectile.y + 3);
      ctx.lineTo(x + projectile.w / 2, projectile.y + projectile.h - 4);
      ctx.stroke();
      ctx.restore();
    } else if (projectile.type === "fire") {
      ctx.save();
      drawOrb(x + projectile.w / 2, projectile.y + projectile.h * 0.58, projectile.w * 0.34, projectile.h * 0.34, fill);
      drawOrb(x + projectile.w / 2, projectile.y + projectile.h * 0.36, projectile.w * 0.2, projectile.h * 0.2, "#ffd166");
      ctx.fillStyle = "rgba(255,123,0,0.24)";
      ctx.beginPath();
      ctx.ellipse(x + projectile.w / 2, projectile.y + projectile.h * 0.86, projectile.w * 0.42, projectile.h * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (projectile.type === "boulder") {
      ctx.save();
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + projectile.w / 2, projectile.y + projectile.h / 2, projectile.w * 0.48, projectile.h * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 9, projectile.y + 11);
      ctx.lineTo(x + 15, projectile.y + 8);
      ctx.lineTo(x + 22, projectile.y + 12);
      ctx.moveTo(x + 11, projectile.y + 22);
      ctx.lineTo(x + 20, projectile.y + 19);
      ctx.stroke();
      ctx.restore();
    } else if (projectile.type === "slash") {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 6;
      ctx.beginPath();
      if (projectile.dir > 0) {
        ctx.arc(x + 10, projectile.y + projectile.h - 10, 34, -1.1, -0.15);
      } else {
        ctx.arc(x + projectile.w - 10, projectile.y + projectile.h - 10, 34, Math.PI + 0.15, Math.PI + 1.1);
      }
      ctx.stroke();
      ctx.strokeStyle = fill;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else if (projectile.type === "beam") {
      ctx.save();
      drawRoundedRect(x, projectile.y, projectile.w, projectile.h, 10, "rgba(196,181,253,0.32)", stroke, 2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(x + 6, projectile.y + 8, projectile.w - 12, 8);
      ctx.restore();
    }
  }
}

function drawStageHazards() {
  for (const hazard of stageHazards) {
    const x = hazard.x - cameraX;
    if (hazard.type === "batDive") {
      drawOrb(x + hazard.w / 2, hazard.y + hazard.h / 2, 10, 8, "#5c677d");
      drawOrb(x + 6, hazard.y + hazard.h * 0.55, 8, 4, "rgba(216,243,255,0.24)");
      drawOrb(x + hazard.w - 6, hazard.y + hazard.h * 0.55, 8, 4, "rgba(216,243,255,0.24)");
    } else if (hazard.type === "lavaGeyser") {
      if (hazard.warmup > 0) {
        ctx.fillStyle = "rgba(255, 183, 3, 0.28)";
        ctx.beginPath();
        ctx.arc(x + hazard.w / 2, 442, 18, 0, Math.PI * 2);
        ctx.fill();
      } else {
        drawRoundedRect(x, 460 - hazard.h, hazard.w, hazard.h, 10, "#ff7b00", "#7f1d1d", 2);
      }
    } else if (hazard.type === "stalactite") {
      if (hazard.warmup > 0) {
        ctx.strokeStyle = "rgba(215,227,252,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + hazard.w / 2, 0);
        ctx.lineTo(x + hazard.w / 2, 40);
        ctx.stroke();
      }
      ctx.fillStyle = "#d7e3fc";
      ctx.strokeStyle = "#5c677d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + hazard.w / 2, hazard.y);
      ctx.lineTo(x + hazard.w, hazard.y + hazard.h);
      ctx.lineTo(x, hazard.y + hazard.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (hazard.type === "rollingStone") {
      drawRoundedRect(x, hazard.y, hazard.w, hazard.h, 12, "#9c6644", "#582f0e", 2);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + 9, hazard.y + 8, 10, 5);
    }
  }
}

function drawBossTelegraph() {
  if (!boss || !boss.alive || !boss.pendingAttack) return;

  const style = bossAttackStyles[boss.pendingAttack.type];
  const chargeRatio = boss.castTimer > 0 ? 1 - boss.windupTimer / boss.castTimer : 1;
  const bossCenterX = boss.x - cameraX + boss.w / 2;
  const bossCenterY = boss.y + boss.h / 2;

  ctx.save();
  ctx.strokeStyle = style.warningStroke;
  ctx.fillStyle = style.warningFill;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.45 + chargeRatio * 0.45;

  for (const marker of boss.pendingAttack.markers || []) {
    if (marker.shape === "column") {
      drawRoundedRect(marker.x - cameraX, marker.y, marker.w, marker.h, 10, style.warningFill, style.warningStroke, 2);
    } else if (marker.shape === "roots") {
      const baseX = marker.x - cameraX;
      ctx.beginPath();
      ctx.moveTo(baseX + 4, marker.y + marker.h);
      ctx.lineTo(baseX + 12, marker.y + 16);
      ctx.lineTo(baseX + 18, marker.y + marker.h);
      ctx.lineTo(baseX + 22, marker.y + 10);
      ctx.lineTo(baseX + 28, marker.y + marker.h);
      ctx.lineTo(baseX + 34, marker.y + 18);
      ctx.lineTo(baseX + 40, marker.y + marker.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (marker.shape === "circle" || marker.shape === "impact") {
      const mx = marker.x - cameraX;
      ctx.beginPath();
      ctx.ellipse(mx, marker.y, marker.r * 1.18, marker.r * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(mx, marker.y - 3, marker.r * 0.56, marker.r * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (marker.shape === "wing") {
      const mx = marker.x - cameraX;
      ctx.beginPath();
      ctx.moveTo(mx - marker.r * 0.9, marker.y);
      ctx.quadraticCurveTo(mx, marker.y - marker.r, mx + marker.r * 0.9, marker.y);
      ctx.quadraticCurveTo(mx, marker.y - marker.r * 0.25, mx - marker.r * 0.9, marker.y);
      ctx.fill();
      ctx.stroke();
    } else if (marker.shape === "vent") {
      const mx = marker.x - cameraX;
      ctx.beginPath();
      ctx.ellipse(mx, marker.y, marker.r * 0.9, marker.r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx - marker.r * 0.34, marker.y - 2);
      ctx.quadraticCurveTo(mx, marker.y - marker.r * 0.7, mx + marker.r * 0.34, marker.y - 2);
      ctx.stroke();
    } else if (marker.shape === "crystal") {
      const mx = marker.x - cameraX;
      ctx.beginPath();
      ctx.moveTo(mx, marker.y - marker.r);
      ctx.lineTo(mx + marker.r * 0.55, marker.y);
      ctx.lineTo(mx, marker.y + marker.r * 0.35);
      ctx.lineTo(mx - marker.r * 0.55, marker.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (marker.shape === "arc") {
      const mx = marker.x - cameraX;
      ctx.beginPath();
      ctx.arc(mx, marker.y, marker.r, marker.r > 30 ? 3.9 : 4.2, 5.6);
      ctx.stroke();
    } else if (marker.shape === "beam") {
      ctx.beginPath();
      ctx.moveTo(marker.x1 - cameraX, marker.y1);
      ctx.lineTo(marker.x2 - cameraX, marker.y2);
      ctx.stroke();
      ctx.lineWidth = 8;
      ctx.globalAlpha = 0.18 + chargeRatio * 0.28;
      ctx.beginPath();
      ctx.moveTo(marker.x1 - cameraX, marker.y1);
      ctx.lineTo(marker.x2 - cameraX, marker.y2);
      ctx.stroke();
    } else if (marker.shape === "summon") {
      const mx = marker.x - cameraX;
      ctx.beginPath();
      ctx.ellipse(mx, marker.y, marker.r, marker.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mx, marker.y - 10, marker.r * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    } else if (marker.shape === "line" || marker.shape === "trail") {
      ctx.beginPath();
      ctx.moveTo(marker.x1 - cameraX, marker.y1);
      ctx.lineTo(marker.x2 - cameraX, marker.y2);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.28 + chargeRatio * 0.4;
  ctx.beginPath();
  ctx.arc(bossCenterX, bossCenterY, 24 + chargeRatio * 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBackground() {
  if (stagePhase === "boss" && boss) {
    const arena = bossArenas[currentStage];
    const bg = arena.background;
    const bossGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bossGradient.addColorStop(0, bg[0]);
    bossGradient.addColorStop(0.5, bg[1]);
    bossGradient.addColorStop(1, bg[2]);
    ctx.fillStyle = bossGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawParallaxLayer("rgba(255,255,255,0.08)", 0.18, [
      { x: 120, y: 120, w: 180, h: 80 },
      { x: 560, y: 90, w: 240, h: 110 },
      { x: 980, y: 130, w: 220, h: 90 }
    ]);
    drawParallaxLayer("rgba(0,0,0,0.18)", 0.38, [
      { x: 40, y: 360, w: 260, h: 140 },
      { x: 420, y: 340, w: 320, h: 160 },
      { x: 900, y: 350, w: 340, h: 150 }
    ]);
    if (arena.theme === "wilds") {
      ctx.fillStyle = "rgba(56, 102, 65, 0.28)";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(i * 320 - cameraX * 0.12, 420, 140, 120);
      }
    } else if (arena.theme === "cavern") {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(i * 220 - cameraX * 0.1, 120 + (i % 2) * 30, 70, 110);
      }
    } else if (arena.theme === "volcano") {
      ctx.fillStyle = "rgba(255,123,0,0.18)";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(i * 260 - cameraX * 0.1, 438, 120, 102);
      }
    } else if (arena.theme === "stalactite") {
      ctx.fillStyle = "rgba(215,227,252,0.15)";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(120 + i * 220 - cameraX * 0.08, 0);
        ctx.lineTo(145 + i * 220 - cameraX * 0.08, 90 + (i % 2) * 20);
        ctx.lineTo(170 + i * 220 - cameraX * 0.08, 0);
        ctx.closePath();
        ctx.fill();
      }
    } else if (arena.theme === "ruins") {
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        ctx.strokeRect(80 + i * 180 - cameraX * 0.08, 100 + (i % 2) * 40, 80, 80);
      }
    }
    return;
  }

  const stageMap = getStageMap();
  const visuals = stageMap.visuals || stageVisuals[currentStage];

  const outsideGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  outsideGradient.addColorStop(0, visuals.sky[0]);
  outsideGradient.addColorStop(0.45, visuals.sky[1]);
  outsideGradient.addColorStop(1, visuals.sky[2]);
  ctx.fillStyle = outsideGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawParallaxLayer(visuals.depth[0], 0.15, [
    { x: 40, y: 70, w: 150, h: 46 },
    { x: 360, y: 96, w: 110, h: 38 },
    { x: 690, y: 60, w: 160, h: 54 }
  ]);
  drawParallaxLayer(visuals.depth[1], 0.35, [
    { x: 0, y: 310, w: 260, h: 170 },
    { x: 370, y: 260, w: 340, h: 220 },
    { x: 790, y: 300, w: 270, h: 180 }
  ]);
  drawParallaxLayer(visuals.depth[2], 0.55, [
    { x: 120, y: 410, w: 180, h: 110 },
    { x: 620, y: 430, w: 150, h: 90 },
    { x: 1080, y: 420, w: 200, h: 100 }
  ]);

  if (visuals.theme === "volcano") {
    ctx.fillStyle = "rgba(255, 165, 0, 0.16)";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(i * 260 - cameraX * 0.1, 438, 90, 102);
    }
  } else if (visuals.theme === "stalactite") {
    ctx.fillStyle = "rgba(226, 232, 240, 0.22)";
    for (let i = 0; i < 8; i++) {
      const spikeX = 40 + i * 150 - cameraX * 0.08;
      ctx.beginPath();
      ctx.moveTo(spikeX, 0);
      ctx.lineTo(spikeX + 24, 62 + (i % 2) * 20);
      ctx.lineTo(spikeX + 48, 0);
      ctx.closePath();
      ctx.fill();
    }
  } else if (visuals.theme === "ruins") {
    ctx.strokeStyle = "rgba(240, 221, 192, 0.16)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.strokeRect(70 + i * 210 - cameraX * 0.08, 130 + (i % 2) * 34, 72, 86);
    }
  }
}

function drawParallaxLayer(color, speed, hills) {
  // Distant scenery moves slower than the foreground for a scrolling depth effect.
  ctx.fillStyle = color;
  for (const hill of hills) {
    const x = hill.x - cameraX * speed;
    ctx.beginPath();
    ctx.ellipse(x, hill.y, hill.w, hill.h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  if (stagePhase === "boss" && boss) {
    const arena = bossArenas[currentStage];
    for (const platform of arena.platforms) {
      const x = platform.x - cameraX;
      drawPixelRect(x, platform.y, platform.w, platform.h, "#4b5563", "#1f2937");
      for (let offset = 0; offset < platform.w; offset += 28) {
        drawPixelRect(x + offset, platform.y, 20, 10, "#6b7280", "#1f2937");
      }
    }
    for (const torchX of [200, 540, 900, 1240]) {
      const screenX = torchX - cameraX;
      if (screenX > -30 && screenX < WIDTH + 30) {
        drawTorch(screenX, 392);
      }
    }
    if (arena.theme === "wilds") {
      for (const rootX of [180, 460, 740, 1020, 1300]) {
        const screenX = rootX - cameraX;
        drawRoundedRect(screenX, 430, 28, 30, 8, "#6a994e", "#386641", 2);
      }
    } else if (arena.theme === "cavern") {
      for (const pillarX of [120, 700, 1280]) {
        const screenX = pillarX - cameraX;
        drawPixelRect(screenX, 320, 36, 140, "#adb5bd", "#495057");
      }
    } else if (arena.theme === "volcano") {
      ctx.fillStyle = "#ff7b00";
      for (const ventX of [180, 520, 980, 1320]) {
        const screenX = ventX - cameraX;
        ctx.fillRect(screenX, 448, 56, 12);
      }
    } else if (arena.theme === "stalactite") {
      for (const sigilX of [250, 760, 1220]) {
        const screenX = sigilX - cameraX;
        ctx.fillStyle = "rgba(215,227,252,0.22)";
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX + 18, 84);
        ctx.lineTo(screenX + 36, 0);
        ctx.closePath();
        ctx.fill();
      }
    } else if (arena.theme === "ruins") {
      for (const blockX of [220, 600, 980, 1360]) {
        const screenX = blockX - cameraX;
        drawPixelRect(screenX, 410, 44, 50, "#3a506b", "#1c2541");
      }
    }
    return;
  }

  const stageMap = getStageMap();
  const visuals = stageMap.visuals || stageVisuals[currentStage];
  // Foreground props are tinted from the stage theme so the same procedural
  // structure can read as woods, cave, lava field, or ruins.
  for (const deco of stageMap.decorations) {
    const dx = deco.x - cameraX;
    if (visuals.theme === "wilds") {
      ctx.fillStyle = "#3d2c20";
      ctx.fillRect(dx + deco.w / 2 - 7, deco.y + 18, 14, 50);
      ctx.fillStyle = "#2f2217";
      ctx.fillRect(dx + deco.w / 2 - 3, deco.y + 18, 6, 50);
      ctx.fillStyle = deco.color;
      ctx.beginPath();
      ctx.ellipse(dx + deco.w / 2, deco.y + 18, deco.w / 2, deco.h * 0.34, 0, Math.PI, 0);
      ctx.fill();
      drawOrb(dx + deco.w / 2 - 10, deco.y + 12, 12, 8, "rgba(255,255,255,0.16)");
    } else if (visuals.theme === "cavern" || visuals.theme === "stalactite") {
      drawStoneBlock(dx + 14, deco.y + 14, deco.w - 28, deco.h - 10, deco.color, "#a5b4c6", "#1b1f2a");
    } else if (visuals.theme === "volcano") {
      drawStoneBlock(dx + 18, deco.y + 20, deco.w - 36, deco.h - 12, deco.color, "#ffb36b", "#3a110c");
      drawOrb(dx + deco.w / 2, deco.y + 22, deco.w * 0.18, 6, "rgba(255,220,160,0.18)");
    } else {
      drawStoneBlock(dx + 12, deco.y + 12, deco.w - 24, deco.h - 12, deco.color, "#d6c09a", "#2f2418");
    }
  }

  for (const platform of stageMap.platforms) {
    const rect = getPlatformRect(platform);
    const x = rect.x - cameraX;
    if (platform.type === "ground") {
      drawStoneBlock(x, rect.y, rect.w, rect.h, visuals.platform.ground, visuals.platform.top, visuals.platform.trim);
    } else {
      drawStoneBlock(x, rect.y, rect.w, rect.h, visuals.platform.stone, visuals.platform.top, visuals.platform.trim);
      for (let offset = 0; offset < platform.w; offset += 28) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(x + offset + 6, rect.y + 13, 10, 4);
      }
      if (platform.moving) {
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
      }
    }
  }

  for (const torchX of stageMap.torchXs) {
    const screenX = torchX - cameraX;
    if (screenX > -30 && screenX < WIDTH + 30) {
      drawTorch(screenX, 392);
    }
  }

  drawFinishFlag();
}

function drawFinishFlag() {
  if (stagePhase === "boss") return;
  const x = finish.x - cameraX;
  ctx.fillStyle = "#3b2f2f";
  ctx.fillRect(x, finish.y, finish.w, finish.h);
  ctx.fillStyle = "#ff4d6d";
  ctx.beginPath();
  ctx.moveTo(x + finish.w, finish.y + 12);
  ctx.lineTo(x + finish.w + 54, finish.y + 32);
  ctx.lineTo(x + finish.w, finish.y + 52);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer() {
  const x = player.x - cameraX;
  const flash = player.invincibleTimer > 0 && player.invincibleTimer % 10 < 5;
  if (flash) return;
  const isDefeated = state === "lost";
  const defeatProgress = isDefeated ? 1 - player.defeatTimer / 42 : 0;

  const equipment = getEquipmentPalette(player.level);
  const tunicColor = player.hurtTimer > 0 ? "#ff8c94" : equipment.tunic;
  const hairColor = "#f4d35e";
  const skinColor = "#f4d6b0";
  const hatColor = player.levelUpFlash > 0 && player.levelUpFlash % 8 < 4 ? "#7ae582" : equipment.hat;
  const hatStroke = player.levelUpFlash > 0 && player.levelUpFlash % 8 < 4 ? "#1f7a4c" : equipment.hatStroke;
  const progress = getAttackProgress(player);
  const isAttacking = player.attackTimer > 0;
  const isSecondSlash = player.attackStage === 2;
  const isWalking = player.onGround && Math.abs(player.vx) > 0.2;
  const bodyBob = isWalking ? Math.sin(player.stepCycle) * 2.4 : Math.sin(player.stepCycle * 0.7) * 0.8;
  const armSwing = isWalking ? Math.sin(player.stepCycle) * 4 : 0;
  const legSwing = isWalking ? Math.sin(player.stepCycle) * 3.5 : 0;
  const bodyY = player.y + bodyBob;
  const frontArmX = player.facing > 0 ? x + 29 : x + 5;
  const backArmX = player.facing > 0 ? x + 5 : x + 29;
  const frontLegX = player.facing > 0 ? x + 22 : x + 12;
  const backLegX = player.facing > 0 ? x + 12 : x + 22;
  let swordX = x + 10;
  let swordY = bodyY + 14;
  let swordW = 6;
  let swordH = 22;
  let guardX = x + 8;
  let guardY = bodyY + 34;
  let guardW = 12;
  let guardH = 5;
  let handX = player.facing > 0 ? x + 29 : x + 5;
  let handY = bodyY + 31;
  let torsoShift = 0;
  let headShift = 0;
  let torsoLift = 0;
  let frontShoulderX = x + (player.facing > 0 ? 28 : 12);
  let frontShoulderY = bodyY + 31;
  let backShoulderX = x + (player.facing > 0 ? 14 : 26);
  let backShoulderY = bodyY + 31;

  ctx.save();
  if (isDefeated) {
    const pivotX = x + player.w / 2;
    const pivotY = player.y + player.h - 4;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(player.defeatTilt * Math.min(defeatProgress * 0.95, 0.95));
    ctx.globalAlpha = Math.max(0.2, 1 - defeatProgress * 0.45);
    ctx.translate(-pivotX, -pivotY);
  }

  if (isAttacking) {
    // Sword, guard, and hand positions are interpolated through authored poses
    // so the arm truly drives the slash instead of the blade teleporting alone.
    const facing = player.facing;
    const windupEnd = 0.32;
    const slashEnd = 0.74;
    const basePose = {
      swordX: x + (facing > 0 ? 10 : 24),
      swordY: bodyY + 14,
      swordW: 6,
      swordH: 22,
      guardX: x + (facing > 0 ? 8 : 22),
      guardY: bodyY + 34,
      guardW: 12,
      guardH: 5,
      handX: x + (facing > 0 ? 29 : 5),
      handY: bodyY + 31
    };
    const windupPose = isSecondSlash
      ? {
          swordX: x + (facing > 0 ? player.w + 4 : -18),
          swordY: bodyY + 22,
          swordW: 24,
          swordH: 6,
          guardX: x + (facing > 0 ? player.w : 3),
          guardY: bodyY + 20,
          guardW: 5,
          guardH: 12,
          handX: x + (facing > 0 ? 27 : 7),
          handY: bodyY + 23
        }
      : {
          swordX: x + (facing > 0 ? 22 : 12),
          swordY: bodyY + 8,
          swordW: 6,
          swordH: 20,
          guardX: x + (facing > 0 ? 19 : 15),
          guardY: bodyY + 27,
          guardW: 12,
          guardH: 5,
          handX: x + (facing > 0 ? 24 : 7),
          handY: bodyY + 28
        };
    const slashPose = isSecondSlash
      ? {
          swordX: x + (facing > 0 ? -18 : player.w + 10),
          swordY: bodyY + 4,
          swordW: 6,
          swordH: 32,
          guardX: x + (facing > 0 ? -21 : player.w + 7),
          guardY: bodyY + 31,
          guardW: 12,
          guardH: 5,
          handX: x + (facing > 0 ? 8 : 29),
          handY: bodyY + 29
        }
      : {
          swordX: x + (facing > 0 ? player.w + 10 : -16),
          swordY: bodyY + 10,
          swordW: 6,
          swordH: 28,
          guardX: x + (facing > 0 ? player.w + 7 : -19),
          guardY: bodyY + 36,
          guardW: 12,
          guardH: 5,
          handX: x + (facing > 0 ? 30 : 4),
          handY: bodyY + 34
        };
    const recoverPose = isSecondSlash
      ? {
          swordX: x + (facing > 0 ? 8 : 26),
          swordY: bodyY + 13,
          swordW: 6,
          swordH: 22,
          guardX: x + (facing > 0 ? 10 : 21),
          guardY: bodyY + 34,
          guardW: 12,
          guardH: 5,
          handX: x + (facing > 0 ? 22 : 12),
          handY: bodyY + 30
        }
      : {
          swordX: x + (facing > 0 ? player.w + 2 : -24),
          swordY: bodyY + 22,
          swordW: 24,
          swordH: 6,
          guardX: x + (facing > 0 ? player.w - 2 : 1),
          guardY: bodyY + 19,
          guardW: 5,
          guardH: 12,
          handX: x + (facing > 0 ? 28 : 6),
          handY: bodyY + 23
        };

    let fromPose = basePose;
    let toPose = windupPose;
    let segmentProgress = 0;

    if (progress < windupEnd) {
      segmentProgress = easeInOutCubic(progress / windupEnd);
    } else if (progress < slashEnd) {
      fromPose = windupPose;
      toPose = slashPose;
      segmentProgress = easeInOutCubic((progress - windupEnd) / (slashEnd - windupEnd));
    } else {
      fromPose = slashPose;
      toPose = recoverPose;
      segmentProgress = easeInOutCubic((progress - slashEnd) / (1 - slashEnd));
    }

    swordX = lerp(fromPose.swordX, toPose.swordX, segmentProgress);
    swordY = lerp(fromPose.swordY, toPose.swordY, segmentProgress);
    swordW = lerp(fromPose.swordW, toPose.swordW, segmentProgress);
    swordH = lerp(fromPose.swordH, toPose.swordH, segmentProgress);
    guardX = lerp(fromPose.guardX, toPose.guardX, segmentProgress);
    guardY = lerp(fromPose.guardY, toPose.guardY, segmentProgress);
    guardW = lerp(fromPose.guardW, toPose.guardW, segmentProgress);
    guardH = lerp(fromPose.guardH, toPose.guardH, segmentProgress);
    handX = lerp(fromPose.handX, toPose.handX, segmentProgress);
    handY = lerp(fromPose.handY, toPose.handY, segmentProgress);

    const twistPower = Math.sin(progress * Math.PI) * (isSecondSlash ? -3.8 : 3.2) * facing;
    torsoShift = twistPower;
    headShift = twistPower * 0.4;
    torsoLift = Math.abs(twistPower) * 0.35;
  }

  const headCenterX = x + 20 + headShift;
  const headCenterY = bodyY + 19 - torsoLift * 0.2;
  const torsoX = x + 9 + torsoShift;
  const torsoY = bodyY + 25 - torsoLift;
  const backElbowX = backShoulderX - torsoShift * 0.35;
  const backElbowY = bodyY + 35 - armSwing * 0.28;
  const shieldSide = player.facing > 0 ? -1 : 1;
  const shieldAnchorX = x + (player.facing > 0 ? 9 : 31) + torsoShift * 0.08;
  const shieldAnchorY = bodyY + 35 - armSwing * 0.18 - torsoLift * 0.1;
  const backHandX = shieldAnchorX + shieldSide * 4;
  const backHandY = shieldAnchorY + 7;
  frontShoulderX += torsoShift * 0.25;
  frontShoulderY = bodyY + 31 - torsoLift * 0.15;
  backShoulderX += torsoShift * 0.05;
  backShoulderY = bodyY + 31 - torsoLift * 0.12;
  const frontElbowX = lerp(frontShoulderX, handX + 3.5, 0.52) + player.facing * (isSecondSlash ? -4 : 4);
  const frontElbowY = lerp(frontShoulderY, handY + 3.5, 0.52) - (isAttacking ? 4 : -1);
  const shieldX = shieldAnchorX + (player.facing > 0 ? -15 : 1);
  const shieldY = shieldAnchorY - 13;
  const shieldW = 15;
  const shieldH = 26;

  drawOrb(headCenterX, headCenterY, 11, 12, skinColor);
  ctx.strokeStyle = "#5b4636";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(headCenterX, headCenterY, 11, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawRoundedRect(headCenterX - 10, headCenterY - 12, 20, 8, 4, hairColor, "#8d6b1f");
  drawRoundedRect(headCenterX - 13, headCenterY - 18, 26, 9, 6, hatColor, hatStroke);
  ctx.beginPath();
  if (player.facing > 0) {
    ctx.moveTo(headCenterX - 6, headCenterY - 12);
    ctx.quadraticCurveTo(headCenterX + 12, headCenterY - 22, headCenterX + 16, headCenterY - 8);
    ctx.lineTo(headCenterX + 2, headCenterY - 5);
  } else {
    ctx.moveTo(headCenterX + 6, headCenterY - 12);
    ctx.quadraticCurveTo(headCenterX - 12, headCenterY - 22, headCenterX - 16, headCenterY - 8);
    ctx.lineTo(headCenterX - 2, headCenterY - 5);
  }
  ctx.closePath();
  ctx.fillStyle = hatColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = hatStroke;
  ctx.stroke();
  ctx.beginPath();
  if (player.facing > 0) {
    ctx.moveTo(headCenterX - 1, headCenterY - 13);
    ctx.quadraticCurveTo(headCenterX + 6, headCenterY - 30, headCenterX + 14, headCenterY - 20);
    ctx.quadraticCurveTo(headCenterX + 8, headCenterY - 14, headCenterX + 1, headCenterY - 8);
  } else {
    ctx.moveTo(headCenterX + 1, headCenterY - 13);
    ctx.quadraticCurveTo(headCenterX - 6, headCenterY - 30, headCenterX - 14, headCenterY - 20);
    ctx.quadraticCurveTo(headCenterX - 8, headCenterY - 14, headCenterX - 1, headCenterY - 8);
  }
  ctx.closePath();
  ctx.fillStyle = "#d8f3dc";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#4d7c0f";
  ctx.stroke();
  ctx.strokeStyle = "rgba(77,124,15,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (player.facing > 0) {
    ctx.moveTo(headCenterX + 3, headCenterY - 12);
    ctx.lineTo(headCenterX + 9, headCenterY - 24);
  } else {
    ctx.moveTo(headCenterX - 3, headCenterY - 12);
    ctx.lineTo(headCenterX - 9, headCenterY - 24);
  }
  ctx.stroke();
  drawLimb(backShoulderX, backShoulderY, backElbowX, backElbowY, 6, "#d4b08f", "#5b4636");
  drawLimb(backElbowX, backElbowY, backHandX, backHandY, 5, "#d4b08f", "#5b4636");
  drawRoundedRect(torsoX, torsoY, 22, 25, 9, tunicColor, equipment.tunicStroke);
  drawRoundedRect(torsoX + 6, torsoY + 2, 10, 21, 5, equipment.trim, "#7a4a1c");
  drawRoundedRect(torsoX + 3, torsoY + 4, 16, 9, 5, "rgba(255,255,255,0.12)", equipment.tunicStroke, 1);
  drawKiteShield(shieldX, shieldY, shieldW, shieldH, shieldSide, equipment.shield, equipment.shieldStroke);
  drawRoundedRect(shieldAnchorX - 2, shieldAnchorY, 4, 12, 2, "#5a3415", "#3b2412", 1);
  drawLimb(frontShoulderX, frontShoulderY, frontElbowX, frontElbowY, 6, skinColor, "#5b4636");
  drawLimb(frontElbowX, frontElbowY, handX + 3.5, handY + 3.5, 5, skinColor, "#5b4636");
  drawRoundedRect(backLegX, bodyY + 45 - legSwing * 0.32, 7, 12, 3, "#b07d4f", "#6b4423");
  drawRoundedRect(frontLegX, bodyY + 45 + legSwing * 0.32, 7, 12, 3, "#c48a58", "#6b4423");
  drawRoundedRect(backLegX, bodyY + 53 - legSwing * 0.32, 7, 6, 2, "#8d5524", "#5a3415");
  drawRoundedRect(frontLegX, bodyY + 53 + legSwing * 0.32, 7, 6, 2, "#8d5524", "#5a3415");

  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.beginPath();
  ctx.ellipse(x + 20, bodyY + 41, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3a2a20";
  const eyeY = headCenterY - 1;
  if (player.facing > 0) {
    ctx.beginPath();
    ctx.arc(headCenterX - 3.5, eyeY, 1.6, 0, Math.PI * 2);
    ctx.arc(headCenterX + 3.5, eyeY, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(headCenterX - 3.1, eyeY - 0.4, 0.5, 0, Math.PI * 2);
    ctx.arc(headCenterX + 3.9, eyeY - 0.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(headCenterX - 3.5, eyeY, 1.6, 0, Math.PI * 2);
    ctx.arc(headCenterX + 3.5, eyeY, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(headCenterX - 3.1, eyeY - 0.4, 0.5, 0, Math.PI * 2);
    ctx.arc(headCenterX + 3.9, eyeY - 0.4, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#d96c6c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY + 5, 3.8, 0.3, Math.PI - 0.3);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.arc(headCenterX - 7, headCenterY - 5, 2.2, 0, Math.PI * 2);
  ctx.fill();

  if (isAttacking) {
    const attack = attackBoxFor(player);
    ctx.fillStyle = progress < 0.35 ? "rgba(255, 209, 102, 0.16)" : isSecondSlash ? "rgba(157, 239, 255, 0.32)" : "rgba(255, 209, 102, 0.32)";
    ctx.fillRect(attack.x - cameraX, attack.y, attack.w, attack.h);
    drawOrb(handX + 3.5, handY + 3.5, 4, 4, skinColor);
    drawRoundedRect(swordX, swordY, swordW, swordH, 3, equipment.sword, equipment.swordStroke, 2);
    drawRoundedRect(guardX, guardY, guardW, guardH, 3, equipment.trim, "#7a5c00", 2);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(swordX + 1, swordY + 2, Math.max(2, swordW - 3), Math.max(2, swordH * 0.18));

    if (progress >= 0.26 && progress < 0.8) {
      const slashAlpha = 0.16 + Math.sin(((progress - 0.26) / 0.54) * Math.PI) * 0.22;
      ctx.fillStyle = isSecondSlash
        ? `rgba(188, 246, 255, ${slashAlpha.toFixed(3)})`
        : `rgba(255, 244, 204, ${slashAlpha.toFixed(3)})`;
      ctx.beginPath();
      if (player.facing > 0 && !isSecondSlash) {
        ctx.ellipse(x + player.w + 17, player.y + 26, 24, 17, 0.24, -1.2, 1.08);
      } else if (player.facing < 0 && !isSecondSlash) {
        ctx.ellipse(x - 7, player.y + 26, 24, 17, -0.24, 2.06, 4.28);
      } else if (player.facing > 0) {
        ctx.ellipse(x - 3, player.y + 20, 26, 18, -0.32, 1.96, 4.2);
      } else {
        ctx.ellipse(x + player.w + 3, player.y + 20, 26, 18, 0.32, -1.06, 1.16);
      }
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const x = enemy.x - cameraX;
    const palette = ["#9b2226", "#b3472a", "#7b2cbf", "#3a0ca3", "#14213d"];
    const bodyColor = enemy.hurtTimer > 0 ? "#ffd166" : palette[enemy.stageTier];
    const skin = enemy.stageTier >= 3 ? "#c8d0ff" : "#e7d8c9";
    if (enemy.flying) {
      drawOrb(x + enemy.w / 2, enemy.y + enemy.h / 2 + 1, 12, 11, bodyColor);
      ctx.strokeStyle = "#2a1a1a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x + enemy.w / 2, enemy.y + enemy.h / 2 + 1, 12, 11, 0, 0, Math.PI * 2);
      ctx.stroke();
      drawRoundedRect(x + 10, enemy.y + 6, enemy.w - 20, 11, 6, skin, "#3d2b1f");
      drawOrb(x + 8, enemy.y + 19, 8, 5, "rgba(201, 255, 255, 0.35)");
      drawOrb(x + enemy.w - 8, enemy.y + 19, 8, 5, "rgba(201, 255, 255, 0.35)");
      ctx.fillStyle = "#1b1022";
      ctx.beginPath();
      ctx.arc(x + enemy.w * 0.4, enemy.y + 13, 1.4, 0, Math.PI * 2);
      ctx.arc(x + enemy.w * 0.6, enemy.y + 13, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7a1e3a";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(x + enemy.w / 2, enemy.y + enemy.h / 2 + 4, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x, enemy.y - 8, enemy.w, 4);
      ctx.fillStyle = "#7ae582";
      ctx.fillRect(x, enemy.y - 8, enemy.w * (enemy.health / enemy.maxHealth), 4);
      continue;
    }
    drawOrb(x + enemy.w / 2, enemy.y + 16, 11, 10, skin);
    ctx.strokeStyle = "#3d2b1f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + enemy.w / 2, enemy.y + 16, 11, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawRoundedRect(x + 6, enemy.y + 22, enemy.w - 12, enemy.h - 16, 9, bodyColor, "#2a1a1a");
    drawRoundedRect(x + 10, enemy.y + 26, enemy.w - 20, 12, 5, "#f2a65a", "#7a4a1c");
    drawLimb(x + 10, enemy.y + 30, x + 5, enemy.y + 40, 4, skin, "#3d2b1f");
    drawLimb(x + enemy.w - 10, enemy.y + 30, x + enemy.w - 5, enemy.y + 40, 4, skin, "#3d2b1f");
    drawLimb(x + 12, enemy.y + 42, x + 10, enemy.y + 53, 5, "#6b4a33", "#362012");
    drawLimb(x + enemy.w - 12, enemy.y + 42, x + enemy.w - 10, enemy.y + 53, 5, "#6b4a33", "#362012");
    ctx.fillStyle = "#1b1022";
    ctx.beginPath();
    ctx.arc(x + enemy.w / 2 - 3, enemy.y + 15, 1.3, 0, Math.PI * 2);
    ctx.arc(x + enemy.w / 2 + 3, enemy.y + 15, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6b1d1d";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + enemy.w / 2, enemy.y + 20, 3.2, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x, enemy.y - 8, enemy.w, 4);
    ctx.fillStyle = "#7ae582";
    ctx.fillRect(x, enemy.y - 8, enemy.w * (enemy.health / enemy.maxHealth), 4);
  }
}

function drawBoss() {
  if (!boss || !boss.alive) return;
  const x = boss.x - cameraX;
  const y = boss.y;
  const bossCenterX = x + boss.w / 2;
  const bossCenterY = y + boss.h / 2;
  const bodyColor = boss.hurtTimer > 0 ? "#ffd166" : boss.color;
  const legColor = boss.stage >= 4 ? "#5a3a28" : "#6b4423";
  if (boss.pendingAttack) {
    const style = bossAttackStyles[boss.pendingAttack.type];
    ctx.fillStyle = style.warningFill;
    ctx.beginPath();
    ctx.ellipse(x + boss.w / 2, y + boss.h / 2, boss.w * 0.46, boss.h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawOrb(bossCenterX, y + 23, boss.w * 0.22, 15, boss.accent);
  ctx.strokeStyle = "#2b1d12";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(bossCenterX, y + 23, boss.w * 0.22, 15, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawRoundedRect(x + 8, y + 28, boss.w - 16, boss.h - 34, 18, bodyColor, "#24160f");
  drawRoundedRect(x + 18, y + 38, boss.w - 36, 18, 9, "rgba(255,255,255,0.12)", "#24160f", 1);
  drawRoundedRect(x + 16, y + 50, boss.w - 32, 18, 10, "#2f3e46", "#161d21");
  if (boss.stage === 1) {
    drawLimb(x + 22, y + 10, x + 8, y - 4, 6, "#7fb069", "#386641");
    drawLimb(x + boss.w - 22, y + 10, x + boss.w - 8, y - 4, 6, "#7fb069", "#386641");
    drawRoundedRect(x + 24, y + 8, 12, 10, 5, "#a7c957", "#386641");
    drawRoundedRect(x + boss.w - 36, y + 8, 12, 10, 5, "#a7c957", "#386641");
  } else if (boss.stage === 2) {
    drawOrb(x + 10, y + 34, 18, 8, "rgba(168,218,220,0.35)");
    drawOrb(x + boss.w - 10, y + 34, 18, 8, "rgba(168,218,220,0.35)");
    drawRoundedRect(x + boss.w / 2 - 7, y + 4, 14, 8, 4, "#d8f3ff", "#1d3557");
  } else if (boss.stage === 3) {
    drawRoundedRect(x + 18, y + 46, boss.w - 36, 16, 8, "#ffb703", "#7f1d1d");
    drawRoundedRect(x + 26, y + 24, 10, 16, 4, "#ff7b00", "#7f1d1d");
    drawRoundedRect(x + boss.w - 36, y + 24, 10, 16, 4, "#ff7b00", "#7f1d1d");
    if (boss.airDash) {
      drawOrb(x + boss.w / 2, y + boss.h + 4, boss.w * 0.26, 7, "rgba(255, 183, 3, 0.28)");
      drawOrb(x + 18, y + boss.h - 6, 8, 5, "rgba(255,123,0,0.32)");
      drawOrb(x + boss.w - 18, y + boss.h - 6, 8, 5, "rgba(255,123,0,0.32)");
    }
  } else if (boss.stage === 4) {
    drawRoundedRect(x + 18, y + 10, 10, 20, 4, "#eff6ff", "#5c677d");
    drawRoundedRect(x + boss.w / 2 - 5, y + 2, 10, 28, 4, "#eff6ff", "#5c677d");
    drawRoundedRect(x + boss.w - 28, y + 10, 10, 20, 4, "#eff6ff", "#5c677d");
  } else if (boss.stage === 5) {
    drawRoundedRect(x + 14, y + 14, boss.w - 28, 12, 5, "#d4a373", "#6f4e37");
    drawRoundedRect(x + 10, y + 54, 12, 18, 5, "#a68a64", "#6f4e37");
    drawRoundedRect(x + boss.w - 22, y + 54, 12, 18, 5, "#a68a64", "#6f4e37");
    if (boss.transformed) {
      drawRoundedRect(x + 8, y + 30, boss.w - 16, boss.h - 38, 16, "rgba(164, 180, 196, 0.42)", "#dbeafe");
      drawRoundedRect(x + 18, y + 18, boss.w - 36, 10, 4, "#c4b5fd", "#4338ca");
      drawOrb(x + boss.w / 2, y + 40, boss.w * 0.3, 12, "rgba(196,181,253,0.22)");
      drawRoundedRect(x + boss.w - 12, y + 34, 10, 44, 4, "#e5e7eb", "#64748b");
      drawRoundedRect(x + boss.w - 17, y + 30, 20, 8, 3, "#fbbf24", "#9a3412");
    } else {
      drawRoundedRect(x + boss.w - 10, y + 38, 8, 36, 3, "#d6d3d1", "#57534e");
      drawRoundedRect(x + boss.w - 16, y + 34, 18, 7, 3, "#fef3c7", "#92400e");
    }
  }
  drawLimb(x + 22, y + boss.h - 20, x + 18, y + boss.h - 4, 8, legColor, "#362012");
  drawLimb(x + boss.w - 22, y + boss.h - 20, x + boss.w - 18, y + boss.h - 4, 8, legColor, "#362012");
  drawLimb(x + 14, y + 50, x + 4, y + 68, 7, boss.accent, "#2b1d12");
  drawLimb(x + boss.w - 14, y + 50, x + boss.w - 4, y + 68, 7, boss.accent, "#2b1d12");
  ctx.fillStyle = "#120d0b";
  ctx.beginPath();
  ctx.arc(bossCenterX - boss.w * 0.1, y + 21, 2.8, 0, Math.PI * 2);
  ctx.arc(bossCenterX + boss.w * 0.1, y + 21, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.arc(bossCenterX - boss.w * 0.16, y + 15, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = boss.stage >= 3 ? "#7a1e3a" : "#8b1e3f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bossCenterX, y + 31, 9, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(x, y - 12, boss.w, 6);
  ctx.fillStyle = "#ff7b00";
  ctx.fillRect(x, y - 12, boss.w * (boss.health / boss.maxHealth), 6);
}

function drawHud() {
  ctx.save();
  ctx.fillStyle = "rgba(6, 10, 18, 0.62)";
  ctx.fillRect(18, 18, 320, 228);

  ctx.fillStyle = "#f6f7fb";
  ctx.font = "bold 22px Segoe UI";
  ctx.fillText("HP", 34, 48);
  const heartsPerRow = 7;
  for (let i = 0; i < player.maxHealth; i++) {
    const row = Math.floor(i / heartsPerRow);
    const col = i % heartsPerRow;
    ctx.fillStyle = i < player.health ? "#ff6978" : "rgba(255,255,255,0.16)";
    ctx.fillRect(34 + col * 34, 60 + row * 24, 24, 20);
  }

  const aliveEnemies = enemies.filter((enemy) => enemy.alive).length;
  ctx.fillStyle = "#f6f7fb";
  ctx.font = "18px Segoe UI";
  const hpRows = Math.ceil(player.maxHealth / heartsPerRow);
  const statsY = 76 + hpRows * 24;
  ctx.fillText(`Enemies ${aliveEnemies}`, 34, statsY);
  ctx.fillText(`Score ${player.score}`, 34, statsY + 26);
  ctx.fillText(`Level ${player.level}`, 180, statsY + 26);
  ctx.fillText(`Stage ${currentStage}/${TOTAL_STAGES}`, 180, statsY);
  ctx.fillText(`Lives ${player.lives}`, 34, statsY + 122);
  ctx.fillText(`Coins ${player.coins}`, 34, statsY + 96);
  ctx.fillText(`Relics ${player.relics}`, 180, statsY + 96);

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(34, statsY + 42, 250, 14);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(34, statsY + 42, 250 * (player.xp / player.nextLevelXp), 14);
  ctx.fillStyle = "#f6f7fb";
  ctx.font = "14px Segoe UI";
  ctx.fillText(`XP ${player.xp} / ${player.nextLevelXp}`, 34, statsY + 70);

  const progress = clamp((player.x / finish.x) * 100, 0, 100);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(WIDTH - 268, 28, 220, 18);
  ctx.fillStyle = "#7ae582";
  ctx.fillRect(WIDTH - 268, 28, 2.2 * progress, 18);
  ctx.fillStyle = "#f6f7fb";
  ctx.fillText(`Progress ${Math.round(progress)}%`, WIDTH - 268, 68);
  if (boss && boss.alive) {
    ctx.fillText(`${boss.name}`, WIDTH - 268, 108);
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.fillRect(WIDTH - 268, 120, 220, 16);
    ctx.fillStyle = "#ff7b00";
    ctx.fillRect(WIDTH - 268, 120, 220 * (boss.health / boss.maxHealth), 16);
  }
  ctx.restore();
}

function render() {
  // Fixed render order keeps the scene easy to read during action.
  drawBackground();
  drawWorld();
  drawBossTelegraph();
  drawBossProjectiles();
  drawStageHazards();
  drawEnemyProjectiles();
  drawLoot();
  drawEnemies();
  drawBoss();
  drawPlayer();
  drawHud();
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (delta >= 0) {
    update();
    render();
  }
  requestAnimationFrame(loop);
}

function tryJump() {
  if (state !== "playing") return;
  player.jumpHeld = true;
  player.jumpBufferTimer = JUMP_BUFFER_FRAMES;
  if (player.onGround || player.coyoteTimer > 0) {
    player.vy = -player.jumpPower;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.jumpHoldTimer = JUMP_HOLD_FRAMES;
  }
}

function tryAttack() {
  if (state !== "playing") return;
  if (player.attackTimer <= 0) {
    player.attackTimer = ATTACK_DURATION;
    player.attackStage = 1;
    player.queuedAttack = false;
    player.hitEnemies.clear();
    return;
  }

  const comboWindowOpen = player.attackStage === 1 && player.attackTimer <= ATTACK_CHAIN_WINDOW;
  if (comboWindowOpen) {
    player.queuedAttack = true;
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const isFreshPress = !event.repeat;

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key) || ["a", "d", "w", "j", "r"].includes(key)) {
    event.preventDefault();
  }

  if ((key === " " || key === "enter") && !overlay.classList.contains("hidden")) {
    handleOverlayAction();
    return;
  }

  keys.add(key);

  if (isFreshPress && (key === "w" || key === " " || key === "arrowup")) tryJump();
  if (isFreshPress && key === "j") tryAttack();
  if (key === "r") resetGame();
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if (key === " " || key === "w" || key === "arrowup") {
    player.jumpHeld = false;
  }
});

startButton.addEventListener("click", handleOverlayAction);

setOverlay("Push through the whole stage and reach the goal flag.", "Jump across platforms, strike enemies, and survive to the end.", "Start Game");
render();
requestAnimationFrame(loop);
