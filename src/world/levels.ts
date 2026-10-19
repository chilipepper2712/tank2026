import { buildCity, HDG, type BlockKind, type CityGeo, type Level, type Squad, type Wave } from './city';
import { buildDesert } from './desert';
import { buildMountain } from './mountain';
import { t } from '../lang';
import type { WeatherId } from '../render/Weather';

/** Military-style briefing shown before the mission starts. */
export interface Brief { situation: string; task: string; lose: string; note?: string }
export interface LevelDef {
  n: number;
  title: string;
  area: string;
  brief: Brief;
  /** missing while the level is still being built */
  build?: () => Level;
  /** fought at night: moonlight, headlights, street lamps, flares */
  night?: boolean;
  /** weather drawn at random for each attempt (missing: always clear) */
  weather?: WeatherId[];
}

/** a level's name and briefing, from the language file (level.N.*) */
const words = (n: number) => ({
  title: t(`level.${n}.title`), area: t(`level.${n}.area`),
  brief: { situation: t(`level.${n}.situation`), task: t(`level.${n}.task`), lose: t(`level.${n}.lose`), note: t(`level.${n}.note`) },
});

const loop = (g: CityGeo, c0: number, r0: number, c1: number, r1: number): [number, number][] =>
  [[g.vx[c0], g.hy[r0]], [g.vx[c1], g.hy[r0]], [g.vx[c1], g.hy[r1]], [g.vx[c0], g.hy[r1]]];

const PLAN1: BlockKind[][] = [
  ['tower', 'shopNS', 'square', 'apartment'],
  ['shopWE', 'market', 'shopNS', 'industrial'],
  ['school', 'ruins', 'shopWE', 'villa'],
  ['informal', 'construction', 'depot', 'shopNS'],
];
const PLAN2: BlockKind[][] = [
  ['apartment', 'shopNS', 'tower', 'shopWE'],
  ['market', 'shopWE', 'square', 'shopNS'],
  ['shopNS', 'school', 'shopNS', 'ruins'],
  ['villa', 'informal', 'depot', 'construction'],
];
const PLAN3: BlockKind[][] = [
  ['tower', 'square', 'apartment', 'shopNS'],
  ['shopWE', 'market', 'shopNS', 'industrial'],
  ['informal', 'shopNS', 'ruins', 'shopWE'],
  ['villa', 'school', 'shopNS', 'depot'],
];
const PLAN5: BlockKind[][] = [
  ['shopNS', 'apartment', 'tower', 'shopWE'],
  ['shopWE', 'square', 'shopNS', 'market'],
  ['ruins', 'shopNS', 'construction', 'shopWE'],
  ['informal', 'depot', 'villa', 'school'],
];

const PLAN4: BlockKind[][] = [
  ['warehouses', 'containers', 'railyard', 'dock'],
  ['industrial', 'tankfarm', 'containers', 'dock'],
  ['factory', 'warehouses', 'containers', 'dock'],
  ['warehouses', 'depot', 'railyard', 'tankfarm'],
];
const PLAN6: BlockKind[][] = [
  ['shopWE', 'tower', 'shopNS', 'industrial'],
  ['apartment', 'shopNS', 'market', 'shopWE'],
  ['square', 'ruins', 'shopNS', 'construction'],
  ['shopNS', 'villa', 'informal', 'depot'],
];

export const LEVELS: LevelDef[] = [
  {
    n: 1, ...words(1),
    build: () => buildCity({
      seed: 2026, name: 'Khu phố 7', objective: 'Tiêu diệt toàn bộ địch', ai: 1, plan: PLAN1,
      setup: (g) => {
        const { vx, hy } = g;
        const squads: Squad[] = [{ route: loop(g, 1, 0, 3, 1), wp: 1 }, { route: loop(g, 2, 1, 4, 3), wp: 2 }, { route: loop(g, 2, 3, 3, 4), wp: 3 }];
        return {
          start: { x: vx[0], y: hy[4] - 150, hull: HDG.N },
          squads,
          enemies: [
            { type: 'tank', x: vx[2] - 40, y: hy[0], hull: HDG.E, squad: 0 },
            { type: 'apc', x: vx[2] - 90, y: hy[0], hull: HDG.E, squad: 0 },
            { type: 'tank', x: vx[4], y: hy[2] - 20, hull: HDG.S, squad: 1 },
            { type: 'tank', x: vx[4], y: hy[2] - 70, hull: HDG.S, squad: 1 },
            { type: 'apc', x: vx[4], y: hy[2] - 120, hull: HDG.S, squad: 1 },
            { type: 'apc', x: vx[3] - 60, y: hy[4], hull: HDG.W, squad: 2 },
            { type: 'tank', x: vx[3] - 10, y: hy[4], hull: HDG.W, squad: 2 },
            { type: 'td', x: vx[3], y: hy[1] + 120, hull: HDG.W },
            { type: 'td', x: vx[2], y: hy[3] - 140, hull: HDG.W },
            { type: 'drone', x: vx[3] + 150, y: hy[0] + 150, hull: HDG.W },
            { type: 'drone', x: vx[2] + 100, y: hy[2] + 150, hull: HDG.W },
            { type: 'drone', x: vx[1] + 150, y: hy[1] + 100, hull: HDG.W },
          ],
          stations: [{ x: vx[1], y: hy[3] }, { x: vx[3], y: hy[0] }],
          mission: { kind: 'destroy' },
        };
      },
    }),
  },
  {
    n: 2, ...words(2), weather: ['clear', 'rain'],
    build: () => buildCity({
      seed: 3112, name: 'Ngã tư đại lộ', objective: 'Chiếm ngã tư', ai: 1, dmg: 1.15, plan: PLAN2,
      setup: (g) => {
        const { vx, hy } = g, zone = { x: vx[2], y: hy[2], r: 60 };
        return {
          start: { x: vx[4], y: hy[0] + 150, hull: HDG.S },
          squads: [{ route: loop(g, 1, 1, 3, 3), wp: 1 }, { route: loop(g, 0, 2, 2, 4), wp: 3 }, { route: loop(g, 0, 0, 2, 1), wp: 0 }],
          enemies: [
            { type: 'tank', x: vx[1] + 60, y: hy[1], hull: HDG.E, squad: 0 },
            { type: 'apc', x: vx[1] + 10, y: hy[1], hull: HDG.E, squad: 0 },
            { type: 'apc', x: vx[0] + 60, y: hy[4], hull: HDG.W, squad: 1 },
            { type: 'apc', x: vx[0] + 110, y: hy[4], hull: HDG.W, squad: 1 },
            { type: 'tank', x: vx[0] + 160, y: hy[4], hull: HDG.W, squad: 1 },
            { type: 'tank', x: vx[0], y: hy[1] - 60, hull: HDG.N, squad: 2 },
            { type: 'apc', x: vx[0], y: hy[1] - 10, hull: HDG.N, squad: 2 },
            { type: 'td', x: vx[3], y: hy[2] + 40, hull: HDG.W },
            { type: 'drone', x: vx[2] + 120, y: hy[1] - 100, hull: HDG.W },
            { type: 'drone', x: vx[1] + 80, y: hy[3] + 60, hull: HDG.W },
          ],
          stations: [{ x: vx[1], y: hy[4] }],
          mission: { kind: 'capture', zone, time: 20, label: 'Chiếm ngã tư' },
          infantry: { teams: 5, near: [zone.x, zone.y], within: 520 },
        };
      },
    }),
  },
  {
    n: 3, ...words(3), weather: ['clear', 'rain', 'fog'],
    build: () => buildCity({
      seed: 4407, name: 'Đoàn xe tiếp tế', objective: 'Hộ tống đoàn xe', ai: 1, dmg: 1.2, plan: PLAN3,
      setup: (g) => {
        const { vx, hy } = g;
        const route: [number, number][] = [[vx[0], 150], [vx[0], hy[1]], [vx[2], hy[1]], [vx[2], hy[3]], [vx[4], hy[3]]];
        return {
          start: { x: vx[0], y: 250, hull: HDG.S },
          squads: [{ route: loop(g, 1, 0, 3, 2), wp: 2 }, { route: loop(g, 2, 3, 4, 4), wp: 1 }, { route: loop(g, 0, 2, 2, 4), wp: 0 }],
          enemies: [
            { type: 'tank', x: vx[3], y: hy[1] + 60, hull: HDG.S, squad: 0 },
            { type: 'apc', x: vx[3], y: hy[1] + 10, hull: HDG.S, squad: 0 },
            { type: 'apc', x: vx[4], y: hy[4] - 40, hull: HDG.N, squad: 1 },
            { type: 'tank', x: vx[4], y: hy[4] + 10, hull: HDG.N, squad: 1 },
            { type: 'tank', x: vx[0], y: hy[2] + 60, hull: HDG.N, squad: 2 },
            { type: 'tank', x: vx[0], y: hy[2] + 110, hull: HDG.N, squad: 2 },
            { type: 'td', x: vx[3] + 120, y: hy[3], hull: HDG.W },
            { type: 'drone', x: vx[1] + 100, y: hy[2], hull: HDG.W },
            { type: 'drone', x: vx[3], y: hy[1] + 100, hull: HDG.W },
          ],
          stations: [{ x: vx[1], y: hy[2] }],
          mission: { kind: 'escort', route, trucks: 3, maxLost: 1 },
          infantry: { teams: 5, near: [vx[2], hy[2]], within: 650 },
        };
      },
    }),
  },
  {
    n: 4, ...words(4), weather: ['clear', 'fog', 'storm'],
    build: () => buildCity({
      seed: 4790, name: 'Bến cảng', objective: 'Tiêu diệt toàn bộ địch', ai: 2, dmg: 1.25, plan: PLAN4, harbour: { col: 3, lastRow: 2 },
      setup: (g) => {
        const { vx, hy } = g;
        return {
          start: { x: vx[2], y: hy[4] - 40, hull: HDG.N },
          squads: [{ route: loop(g, 1, 0, 3, 2), wp: 1 }, { route: loop(g, 2, 2, 3, 4), wp: 0 }, { route: loop(g, 0, 0, 2, 1), wp: 2 }],
          enemies: [
            { type: 'tank', x: vx[2], y: hy[0], hull: HDG.E, squad: 0 },
            { type: 'apc', x: vx[2] - 50, y: hy[0], hull: HDG.E, squad: 0 },
            { type: 'tank', x: vx[2], y: hy[2] - 40, hull: HDG.N, squad: 1 },
            { type: 'tank', x: vx[2], y: hy[2] + 10, hull: HDG.N, squad: 1 },
            { type: 'apc', x: vx[1], y: hy[1] - 40, hull: HDG.S, squad: 2 },
            { type: 'apc', x: vx[1], y: hy[1] - 90, hull: HDG.S, squad: 2 },
            { type: 'td', x: vx[3], y: hy[1] + 60, hull: HDG.W },
            { type: 'td', x: vx[3], y: hy[3] - 60, hull: HDG.W },
            { type: 'drone', x: vx[1] + 120, y: hy[2] + 100, hull: HDG.W },
            { type: 'drone', x: vx[3] - 100, y: hy[0] + 120, hull: HDG.W },
          ],
          stations: [{ x: vx[0], y: hy[3] }],
          mission: { kind: 'destroy' },
          infantry: { teams: 3 },
        };
      },
    }),
  },
  {
    n: 5, ...words(5), weather: ['clear', 'rain'], night: true,
    build: () => buildCity({
      seed: 5150, name: 'Cố thủ quảng trường', objective: 'Cố thủ quảng trường', ai: 2, dmg: 1.3, plan: PLAN5,
      setup: (g) => {
        const { vx, hy, xs, ys } = g, zone = { x: xs[1] + g.BW / 2, y: ys[1] + g.BH / 2 - 60, r: 80 };
        const N = (c: number): [number, number] => [vx[c], 25], Wst = (r: number): [number, number] => [25, hy[r]];
        const waves: Wave[] = [
          { at: 8, from: Wst(1), units: ['tank', 'apc'] },
          { at: 22, from: N(1), units: ['kamikaze', 'kamikaze', 'kamikaze'] },
          { at: 38, from: Wst(3), units: ['tank', 'tank'] },
          { at: 55, from: N(2), units: ['kamikaze', 'kamikaze', 'drone'] },
          { at: 72, from: Wst(1), units: ['td', 'apc', 'apc'] },
          { at: 88, from: N(1), units: ['kamikaze', 'kamikaze', 'kamikaze'] },
          { at: 100, from: Wst(3), units: ['tank', 'tank', 'apc'] },
          { at: 110, from: N(2), units: ['kamikaze', 'kamikaze', 'kamikaze'] },
        ];
        return {
          start: { x: vx[4], y: hy[4] - 150, hull: HDG.N },
          squads: [{ route: loop(g, 1, 1, 2, 2), wp: 1 }],
          enemies: [
            { type: 'tank', x: vx[2], y: hy[1] + 60, hull: HDG.S, squad: 0 },
            { type: 'apc', x: vx[2], y: hy[1] + 10, hull: HDG.S, squad: 0 },
            { type: 'td', x: vx[1] - 120, y: hy[1], hull: HDG.E },
            { type: 'drone', x: zone.x + 60, y: zone.y - 80, hull: HDG.W },
          ],
          stations: [{ x: vx[3], y: hy[3] }],
          mission: { kind: 'hold', zone, time: 120, waves, label: 'Cố thủ quảng trường' },
          infantry: { teams: 3, near: [zone.x, zone.y], within: 420 },
        };
      },
    }),
  },
  {
    n: 6, ...words(6), weather: ['clear', 'rain', 'storm'],
    build: () => buildCity({
      seed: 6021, name: 'Mũi tấn công', objective: 'Tiêu diệt toàn bộ địch', ai: 2, dmg: 1.3, plan: PLAN6,
      setup: (g) => {
        const { vx, hy } = g;
        return {
          start: { x: vx[0], y: hy[2] + 30, hull: HDG.E },
          friends: { at: [[vx[0], hy[2] + 110], [vx[0], hy[2] + 160], [vx[0], hy[2] + 210]], hull: HDG.S, route: [[vx[0], hy[3]], [vx[3], hy[3]], [vx[3], hy[0]], [vx[4], hy[0]]] },
          squads: [{ route: loop(g, 2, 0, 4, 1), wp: 2 }, { route: loop(g, 2, 2, 4, 4), wp: 3 }, { route: loop(g, 0, 0, 2, 1), wp: 1 }],
          enemies: [
            { type: 'tank', x: vx[4], y: hy[0] + 80, hull: HDG.S, squad: 0 },
            { type: 'apc', x: vx[4], y: hy[0] + 30, hull: HDG.S, squad: 0 },
            { type: 'tank', x: vx[3], y: hy[4], hull: HDG.W, squad: 1 },
            { type: 'tank', x: vx[3] + 50, y: hy[4], hull: HDG.W, squad: 1 },
            { type: 'apc', x: vx[3] + 100, y: hy[4], hull: HDG.W, squad: 1 },
            { type: 'apc', x: vx[1], y: hy[0], hull: HDG.E, squad: 2 },
            { type: 'apc', x: vx[1] - 50, y: hy[0], hull: HDG.E, squad: 2 },
            { type: 'td', x: vx[3] + 120, y: hy[2] - 30, hull: HDG.W },
            { type: 'td', x: vx[4], y: hy[3] - 120, hull: HDG.W },
            { type: 'drone', x: vx[2] + 100, y: hy[1] + 80, hull: HDG.W },
            { type: 'drone', x: vx[3] + 80, y: hy[3] + 60, hull: HDG.W },
            { type: 'drone', x: vx[4] - 120, y: hy[1], hull: HDG.W },
          ],
          stations: [{ x: vx[1], y: hy[2] + 30 }, { x: vx[2], y: hy[4] }],
          mission: { kind: 'destroy' },
          infantry: { teams: 4, near: [vx[3], hy[2]], within: 700 },
        };
      },
    }),
  },
  {
    n: 7, ...words(7), night: true,
    build: () => buildDesert({
      seed: 7310, name: 'Đường mòn cát', objective: 'Hộ tống đoàn xe', ai: 2, dmg: 1.35, W: 1800, H: 1500,
      tracks: [[[40, 1250], [380, 1180], [620, 900], [900, 820], [1180, 870], [1420, 560], [1600, 400], [1760, 380]]],
      villages: [{ x: 560, y: 1030, r: 120, pond: 0 }, { x: 1210, y: 740, r: 160, pond: 46 }, { x: 1560, y: 220, r: 110, pond: 0 }],
      dunes: 10, rocks: 8, mesas: 4, wrecks: 7,
      setup: () => {
        const route: [number, number][] = [[160, 1228], [380, 1180], [620, 900], [900, 820], [1180, 870], [1420, 560], [1600, 400], [1740, 382]];
        const sq = (pts: [number, number][], wp: number): Squad => ({ route: pts, wp });
        return {
          start: { x: 290, y: 1200, hull: -0.2 },
          squads: [sq([[860, 560], [1180, 520], [1300, 1000], [880, 1080]], 1), sq([[1380, 900], [1700, 760], [1700, 1200], [1380, 1250]], 0), sq([[300, 520], [700, 380], [760, 640]], 2)],
          enemies: [
            { type: 'tank', x: 1180, y: 520, hull: HDG.E, squad: 0 },
            { type: 'apc', x: 1130, y: 520, hull: HDG.E, squad: 0 },
            { type: 'tank', x: 1380, y: 900, hull: HDG.E, squad: 1 },
            { type: 'tank', x: 1330, y: 900, hull: HDG.E, squad: 1 },
            { type: 'apc', x: 700, y: 380, hull: HDG.S, squad: 2 },
            { type: 'apc', x: 700, y: 330, hull: HDG.S, squad: 2 },
            { type: 'td', x: 1500, y: 470, hull: HDG.W },
            { type: 'technical', x: 1000, y: 1300, hull: HDG.W },
            { type: 'technical', x: 1650, y: 1000, hull: HDG.W },
            { type: 'drone', x: 900, y: 1150, hull: HDG.W },
            { type: 'drone', x: 1450, y: 700, hull: HDG.W },
            { type: 'kamikaze', x: 1100, y: 260, hull: HDG.S, swarm: 0 },
            { type: 'kamikaze', x: 1126, y: 280, hull: HDG.S, swarm: 0 },
            { type: 'kamikaze', x: 1152, y: 260, hull: HDG.S, swarm: 0 },
          ],
          stations: [{ x: 480, y: 1300 }, { x: 1040, y: 950 }],
          mission: { kind: 'escort', route, trucks: 3, maxLost: 1 },
          infantry: { teams: 6, mines: 0.4 },
        };
      },
    }),
  },
  {
    n: 8, ...words(8), weather: ['clear', 'sand'],
    build: () => buildDesert({
      seed: 8402, name: 'Ốc đảo', objective: 'Cố thủ ốc đảo', ai: 2, dmg: 1.25, W: 1700, H: 1500,
      tracks: [[[0, 860], [500, 880], [850, 900], [1200, 870], [1700, 840]], [[1010, 0], [1000, 400], [1020, 880], [980, 1200], [1000, 1500]], [[100, 1400], [500, 1100], [700, 960]]],
      villages: [{ x: 850, y: 740, r: 260, pond: 60 }],
      dunes: 12, rocks: 8, mesas: 4, wrecks: 6,
      setup: () => {
        const zone = { x: 850, y: 860, r: 80 };
        const waves: Wave[] = [
          { at: 3, from: [1675, 840], units: ['tank', 'apc', 'technical'] },
          { at: 10, from: [1010, 25], units: ['kamikaze', 'kamikaze', 'kamikaze'] },
          { at: 17, from: [25, 860], units: ['tank', 'tank', 'technical'] },
          { at: 24, from: [1000, 1475], units: ['apc', 'apc', 'tank'] },
          { at: 31, from: [1675, 840], units: ['kamikaze', 'kamikaze', 'kamikaze', 'drone'] },
        ];
        return {
          start: { x: 130, y: 1380, hull: -0.7 },
          squads: [{ route: [[700, 1000], [1050, 1050], [1100, 600], [650, 560]], wp: 1 }],
          enemies: [
            { type: 'tank', x: 1050, y: 1050, hull: HDG.N, squad: 0 },
            { type: 'apc', x: 1000, y: 1050, hull: HDG.N, squad: 0 },
            { type: 'td', x: 1250, y: 860, hull: HDG.W },
            { type: 'drone', x: 850, y: 560, hull: HDG.W },
          ],
          stations: [{ x: 420, y: 1150 }],
          mission: { kind: 'hold', zone, time: 40, waves, label: 'Cố thủ ốc đảo', relief: { at: [[140, 1440], [190, 1450], [240, 1440], [290, 1450], [340, 1440]], hull: -0.8 } },
          infantry: { teams: 4, mines: 0.5, near: [850, 800], within: 320 },
        };
      },
    }),
  },
  {
    n: 9, ...words(9), weather: ['clear', 'rain'], night: true,
    build: () => buildMountain({
      seed: 9120, name: 'Đèo gió', objective: 'Chiếm đèo', ai: 3, dmg: 1.4, W: 1800, H: 1600,
      roads: [
        [[900, 1600], [900, 1300], [860, 1100], [890, 820], [900, 560], [890, 300], [900, 0]],
        [[1300, 1600], [1300, 1250], [1500, 1070], [1500, 860], [1350, 700], [1200, 640], [1200, 450], [1200, 405], [1100, 405]],
        [[420, 1600], [420, 900]],
      ],
      massifs: [
        { lobes: [[250, 470, 310], [560, 560, 220], [330, 860, 210]], tiers: [24, 48, 72], inset: 8 },
        { lobes: [[1450, 420, 300], [1230, 560, 200], [1500, 800, 220]], tiers: [24] },
      ],
      ramps: [
        { a: [1500, 1035], b: [1500, 880] }, { a: [1120, 405], b: [1270, 405], w: 80 },
        { a: [420, 1045], b: [420, 905] },
      ],
      streams: [{ pts: [[0, 1250], [300, 1220], [600, 1270], [900, 1240], [1200, 1270], [1500, 1230], [1800, 1260]], w: 30 }],
      bridges: [{ x: 872, y: 1212, w: 56, h: 56 }, { x: 1272, y: 1228, w: 56, h: 56 }, { x: 392, y: 1205, w: 56, h: 56 }],
      forests: [{ x: 650, y: 1450, r: 120, n: 30 }, { x: 1150, y: 1420, r: 130, n: 30 }, { x: 180, y: 1450, r: 120, n: 25 }, { x: 1650, y: 1120, r: 110, n: 22 }, { x: 640, y: 160, r: 90, n: 14 }],
      hamlets: [{ x: 560, y: 1400, r: 120 }, { x: 900, y: 240, r: 170 }, { x: 1550, y: 1430, r: 110 }],
      knolls: 8, boulders: 30, wrecks: 5,
      setup: () => {
        const zone = { x: 900, y: 330, r: 80 };
        return {
          start: { x: 900, y: 1520, hull: HDG.N },
          friends: { at: [[1150, 1520], [1200, 1540], [1250, 1520]], hull: HDG.N, route: [[1300, 1300], [1300, 1250], [1500, 1070], [1500, 860], [1350, 700], [1200, 640], [1200, 450], [1200, 405], [1100, 405], [1000, 360], [900, 330]] },
          squads: [
            { route: [[900, 200], [1100, 120], [700, 120]], wp: 1 },
            { route: [[560, 1180], [760, 1120], [300, 1120]], wp: 0 },
            { route: [[1400, 600], [1560, 360], [1260, 470]], wp: 2 },
          ],
          enemies: [
            { type: 'tank', x: 900, y: 160, hull: HDG.S, squad: 0 },
            { type: 'tank', x: 950, y: 160, hull: HDG.S, squad: 0 },
            { type: 'apc', x: 850, y: 160, hull: HDG.S, squad: 0 },
            { type: 'tank', x: 560, y: 1150, hull: HDG.E, squad: 1 },
            { type: 'apc', x: 610, y: 1150, hull: HDG.E, squad: 1 },
            { type: 'tank', x: 1400, y: 600, hull: HDG.S, squad: 2 },
            { type: 'tank', x: 1450, y: 600, hull: HDG.S, squad: 2 },
            { type: 'apc', x: 1350, y: 600, hull: HDG.S, squad: 2 },
            { type: 'td', x: 745, y: 600, hull: HDG.S },
            { type: 'td', x: 1060, y: 520, hull: HDG.S },
            { type: 'technical', x: 300, y: 1450, hull: HDG.E },
            { type: 'technical', x: 1600, y: 1300, hull: HDG.W },
            { type: 'drone', x: 900, y: 900, hull: HDG.S },
            { type: 'drone', x: 600, y: 1000, hull: HDG.S },
            { type: 'drone', x: 1300, y: 750, hull: HDG.S },
            { type: 'kamikaze', x: 860, y: 420, hull: HDG.S, swarm: 0 },
            { type: 'kamikaze', x: 900, y: 440, hull: HDG.S, swarm: 0 },
            { type: 'kamikaze', x: 940, y: 420, hull: HDG.S, swarm: 0 },
          ],
          stations: [{ x: 760, y: 1500 }, { x: 900, y: 1000 }],
          mission: { kind: 'capture', zone, time: 25, label: 'Chiếm đèo' },
          infantry: { teams: 5, mines: 0.2, near: [900, 400], within: 900 },
        };
      },
    }),
  },
  {
    n: 10, ...words(10), weather: ['clear', 'fog', 'rain', 'storm'],
    build: () => buildMountain({
      seed: 10301, name: 'Pháo đài', objective: 'Hạ pháo đài', ai: 3, dmg: 1.45, W: 1900, H: 1700,
      roads: [
        [[950, 1700], [950, 1310], [900, 1060], [950, 820], [950, 0]],
        [[600, 1700], [600, 1310], [700, 1000], [560, 720], [560, 460], [650, 460]],
        [[1300, 1700], [1300, 1310], [1250, 1000], [1340, 720], [1340, 460], [1250, 460]],
      ],
      massifs: [
        { lobes: [[160, 720, 290], [300, 1160, 240], [190, 380, 260]], tiers: [24, 48], inset: 8 },
        { lobes: [[1750, 720, 290], [1600, 1160, 240], [1760, 330, 270]], tiers: [24, 48, 72], inset: 8 },
      ],
      ramps: [{ a: [560, 1160], b: [400, 1160], w: 80 }, { a: [1345, 1160], b: [1505, 1160], w: 80 }],
      streams: [{ pts: [[0, 1330], [350, 1300], [700, 1340], [1000, 1305], [1400, 1345], [1900, 1310]], w: 32 }],
      bridges: [{ x: 922, y: 1282, w: 56, h: 60 }, { x: 572, y: 1290, w: 56, h: 60 }, { x: 1272, y: 1295, w: 56, h: 60 }],
      forests: [{ x: 780, y: 1500, r: 110, n: 26 }, { x: 1130, y: 1520, r: 110, n: 26 }, { x: 760, y: 900, r: 70, n: 10 }, { x: 1120, y: 880, r: 70, n: 10 }, { x: 950, y: 110, r: 90, n: 12 }],
      hamlets: [{ x: 460, y: 1520, r: 120 }, { x: 1460, y: 1500, r: 110 }],
      knolls: 6, boulders: 26, wrecks: 6,
      fort: { x: 650, y: 220, w: 600, h: 480, gates: [{ side: 's', at: 950, w: 90 }, { side: 'n', at: 1080, w: 80 }, { side: 'e', at: 460, w: 80 }, { side: 'w', at: 460, w: 80 }] },
      setup: () => {
        const zone = { x: 950, y: 610, r: 72 };
        const waves: Wave[] = [
          { at: 2, from: [1080, 25], units: ['tank', 'apc', 'tank'] },
          { at: 9, from: [700, 25], units: ['kamikaze', 'kamikaze', 'kamikaze', 'kamikaze'] },
          { at: 16, from: [950, 1675], units: ['technical', 'apc', 'technical'] },
          { at: 24, from: [1200, 25], units: ['tank', 'td', 'apc'] },
          { at: 33, from: [1080, 25], units: ['kamikaze', 'kamikaze', 'drone', 'drone'] },
        ];
        return {
          start: { x: 950, y: 1600, hull: HDG.N },
          squads: [
            { route: [[950, 1150], [700, 1050], [950, 900], [1200, 1050]], wp: 0 },
            { route: [[800, 450], [1100, 450], [1100, 620], [800, 620]], wp: 1 },
            { route: [[950, 120], [600, 120], [1300, 120]], wp: 2 },
          ],
          enemies: [
            { type: 'tank', x: 950, y: 1150, hull: HDG.S, squad: 0 },
            { type: 'apc', x: 1000, y: 1150, hull: HDG.S, squad: 0 },
            { type: 'technical', x: 900, y: 1150, hull: HDG.S, squad: 0 },
            { type: 'tank', x: 800, y: 450, hull: HDG.S, squad: 1 },
            { type: 'tank', x: 850, y: 450, hull: HDG.S, squad: 1 },
            { type: 'apc', x: 900, y: 450, hull: HDG.S, squad: 1 },
            { type: 'tank', x: 950, y: 120, hull: HDG.S, squad: 2 },
            { type: 'apc', x: 1000, y: 120, hull: HDG.S, squad: 2 },
            { type: 'td', x: 1060, y: 380, hull: HDG.S },
            { type: 'td', x: 1490, y: 760, hull: HDG.W },
            { type: 'td', x: 405, y: 760, hull: HDG.E },
            { type: 'technical', x: 1450, y: 1400, hull: HDG.W },
            { type: 'drone', x: 950, y: 900, hull: HDG.S },
            { type: 'drone', x: 700, y: 760, hull: HDG.S },
            { type: 'drone', x: 1200, y: 760, hull: HDG.S },
            { type: 'kamikaze', x: 900, y: 780, hull: HDG.S, swarm: 0 },
            { type: 'kamikaze', x: 950, y: 800, hull: HDG.S, swarm: 0 },
            { type: 'kamikaze', x: 1000, y: 780, hull: HDG.S, swarm: 0 },
          ],
          stations: [{ x: 800, y: 1620 }, { x: 1100, y: 1000 }],
          mission: {
            kind: 'stages', stages: [
              { kind: 'capture', zone, time: 20, label: 'Chiếm cổng pháo đài', title: t('level.10.stage1') },
              { kind: 'hold', zone, time: 45, waves, label: 'Cố thủ cổng', title: t('level.10.stage2'), relief: { at: [[850, 1660], [900, 1680], [950, 1660], [1000, 1680], [1050, 1660]], hull: HDG.N } },
              { kind: 'destroy', title: t('level.10.stage3') },
            ],
          },
          infantry: { teams: 6, mines: 0.3, near: [950, 900], within: 800 },
        };
      },
    }),
  },
];

/**
 * Recruit training (level 0): a quiet stretch of desert, one station after another (see game/Training.ts).
 * The stations themselves are placed by the script; the map only keeps them clear of scenery.
 */
export const TRAINING_SPOTS = {
  start: [200, 820] as [number, number],
  drive: [[520, 820], [560, 560]] as [number, number][],
  soft: [860, 560] as [number, number],
  armour: [880, 300] as [number, number],
  crate: [700, 360] as [number, number],
  group: [1120, 700] as [number, number],
  village: [1350, 330] as [number, number],
};
export const TRAINING: LevelDef = {
  n: 0, ...words(0),
  build: () => {
    const T = TRAINING_SPOTS;
    return buildDesert({
      seed: 4404, name: 'Bãi tập', objective: 'Huấn luyện', ai: 1, dmg: 0.6, W: 1600, H: 1000,
      tracks: [[[40, 820], [560, 820], [600, 560], [1000, 520], [1350, 400], [1560, 380]]],
      villages: [{ x: T.village[0], y: T.village[1], r: 110, pond: 0 }],
      dunes: 3, rocks: 3, mesas: 0, wrecks: 2,
      setup: () => ({
        start: { x: T.start[0], y: T.start[1], hull: 0 },
        enemies: [], squads: [], stations: [],
        mission: { kind: 'destroy' },
        keep: [...T.drive, T.soft, T.armour, T.crate, T.group],
      }),
    });
  },
};
/** a weather for this attempt, from the level's list (night levels stay off fog and storms: too dark to play) */
export function pickWeather(n: number): WeatherId {
  const w = levelDef(n).weather ?? ['clear'];
  return w[Math.floor(Math.random() * w.length)];
}

/** level 0 is training, 1–10 the campaign */
export const levelDef = (n: number): LevelDef => (n === 0 ? TRAINING : LEVELS[n - 1] ?? LEVELS[0]);

const TRAINED_KEY = 'tank2026.trained';
/** a new player is sent to training first; anyone already past level 1 counts as trained */
export function trained(): boolean {
  try { return localStorage.getItem(TRAINED_KEY) === '1' || unlockedLevel() > 1; } catch { return true; }
}
export function markTrained() { try { localStorage.setItem(TRAINED_KEY, '1'); } catch { /* storage blocked */ } }

// ---------- campaign progress (shared by both classes) ----------
const KEY = 'tank2026.campaign';
export function unlockedLevel(): number {
  try { return Math.max(1, JSON.parse(localStorage.getItem(KEY) || '{}').unlocked || 1); } catch { return 1; }
}
export function unlockLevel(n: number) {
  if (n <= unlockedLevel()) return;
  try { localStorage.setItem(KEY, JSON.stringify({ unlocked: n })); } catch { /* storage blocked */ }
}
