import { buildCity, HDG, type BlockKind, type CityGeo, type Level, type Squad, type Wave } from './city';
import { buildDesert } from './desert';

/** Military-style briefing shown before the mission starts. */
export interface Brief { situation: string; task: string; lose: string; note?: string }
export interface LevelDef {
  n: number;
  title: string;
  area: string;
  brief: Brief;
  /** missing while the level is still being built */
  build?: () => Level;
}

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
    n: 1, title: 'Khu phố 7', area: 'Đô thị',
    brief: {
      situation: 'Địch chiếm khu phố. Ba tổ cơ giới đang tuần tra, hai pháo diệt tăng phục quanh khu trung tâm.',
      task: 'Tiêu diệt toàn bộ lực lượng địch.',
      lose: 'Xe bị phá hủy.',
      note: 'Tiếng pháo kéo địch trong 200 m tới. Còn 2 địch cuối thì có mũi tên chỉ hướng.',
    },
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
    n: 2, title: 'Ngã tư đại lộ', area: 'Đô thị',
    brief: {
      situation: 'Địch giữ ngã tư đại lộ. Bộ binh chống tăng nấp trong các dãy nhà quanh ngã tư.',
      task: 'Chiếm ngã tư: đứng trong vùng 20 giây khi trong vùng không còn địch.',
      lose: 'Xe bị phá hủy.',
      note: 'Bộ binh lộ diện khi xe áp sát hoặc drone phát hiện. Dấu ! đỏ: sắp bắn RPG.',
    },
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
    n: 3, title: 'Đoàn xe tiếp tế', area: 'Đô thị',
    brief: {
      situation: 'Ba xe tiếp tế từ phía tây bắc phải ra cửa ngõ phía đông. Tuyến đường có bộ binh phục kích và ba tổ cơ giới tuần tra.',
      task: 'Hộ tống đoàn xe tới điểm tập kết. Đoàn xe dừng khi có địch phía trước: dọn đường cho họ.',
      lose: 'Mất 2 xe tiếp tế, hoặc xe mình bị phá hủy.',
      note: 'Xe tiếp tế có súng máy, chỉ diệt được drone và bộ binh.',
    },
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
    n: 4, title: 'Bến cảng', area: 'Khu công nghiệp',
    brief: {
      situation: 'Địch giữ bến cảng phía đông: bãi container, kho hàng, bồn dầu. Chúng biết nấp sau container và nhà kho.',
      task: 'Tiêu diệt toàn bộ địch.',
      lose: 'Xe bị phá hủy.',
      note: 'Địch bắn xong sẽ lùi vào chỗ khuất để nạp đạn: chờ nó ló ra, hoặc vòng sườn. Lối giữa các dãy container chỉ xe bọc thép lọt.',
    },
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
    n: 5, title: 'Cố thủ quảng trường', area: 'Đô thị',
    brief: {
      situation: 'Tiếp viện ta đang trên đường tới. Địch sẽ dồn quân từ mép tây và mép bắc để chiếm lại quảng trường.',
      task: 'Chiếm quảng trường và cố thủ 120 giây.',
      lose: 'Xe bị phá hủy.',
      note: 'Đồng hồ chỉ chạy khi giữ vùng. Rút ra sửa xe được, nhưng địch chiếm vùng thì đồng hồ tụt. Drone cảm tử đi theo bầy: thấy vòng đỏ trên xe thì đổi hướng, bắn sớm.',
    },
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
    n: 6, title: 'Mũi tấn công', area: 'Đô thị',
    brief: {
      situation: 'Tổ xe tăng phe ta (3 xe, màu xanh lam) xuất phát cùng ta, đánh theo trục phố phía nam rồi bẻ lên bắc. Ta đánh dọc đại lộ.',
      task: 'Cùng phe ta tiêu diệt toàn bộ địch.',
      lose: 'Xe mình bị phá hủy.',
      note: 'Không bắn trúng quân mình. Phe ta mất hết thì không thua, nhưng phải một mình gánh cả khu. Địch biết ẩn nấp.',
    },
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
    n: 7, title: 'Đường mòn cát', area: 'Sa mạc',
    brief: {
      situation: 'Đoàn tiếp tế phải băng qua sa mạc theo đường mòn, qua hai làng ốc đảo. Bộ binh nấp trong nhà đất, một số mang mìn. Đồi cát che tầm nhìn.',
      task: 'Hộ tống 3 xe tiếp tế tới điểm tập kết phía đông bắc.',
      lose: 'Mất 2 xe tiếp tế, hoặc xe mình bị phá hủy.',
      note: 'Nhà đất húc đổ được. Lính có dấu vàng là mang mìn: bắn từ xa thì nổ to, cán qua thì xe dính mìn. Leo đồi cát xe chậm lại.',
    },
    build: () => buildDesert({
      seed: 7310, name: 'Đường mòn cát', objective: 'Hộ tống đoàn xe', ai: 2, dmg: 1.35, W: 1800, H: 1500,
      tracks: [[[40, 1250], [380, 1180], [620, 900], [900, 820], [1180, 870], [1420, 560], [1600, 400], [1760, 380]]],
      villages: [{ x: 560, y: 1030, r: 120, pond: 0 }, { x: 1210, y: 740, r: 160, pond: 46 }, { x: 1560, y: 220, r: 110, pond: 0 }],
      dunes: 14, rocks: 12,
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
    n: 8, title: 'Ốc đảo', area: 'Sa mạc',
    brief: {
      situation: 'Ta giữ được nguồn nước duy nhất của vùng. Địch sẽ đánh vào từ cả bốn hướng theo các đường mòn.',
      task: 'Chiếm bờ nam ốc đảo và cố thủ 120 giây chờ tiếp viện.',
      lose: 'Xe bị phá hủy.',
      note: 'Đồng hồ chỉ chạy khi giữ vùng; địch chiếm vùng thì đồng hồ tụt. Bộ binh mang mìn nấp quanh làng. Drone cảm tử đến theo bầy.',
    },
    build: () => buildDesert({
      seed: 8402, name: 'Ốc đảo', objective: 'Cố thủ ốc đảo', ai: 2, dmg: 1.4, W: 1700, H: 1500,
      tracks: [[[0, 860], [500, 880], [850, 900], [1200, 870], [1700, 840]], [[1010, 0], [1000, 400], [1020, 880], [980, 1200], [1000, 1500]], [[100, 1400], [500, 1100], [700, 960]]],
      villages: [{ x: 850, y: 740, r: 260, pond: 60 }],
      dunes: 16, rocks: 12,
      setup: () => {
        const zone = { x: 850, y: 860, r: 80 };
        const waves: Wave[] = [
          { at: 8, from: [1675, 840], units: ['tank', 'apc'] },
          { at: 22, from: [1010, 25], units: ['kamikaze', 'kamikaze', 'kamikaze'] },
          { at: 36, from: [25, 860], units: ['tank', 'tank'] },
          { at: 50, from: [1000, 1475], units: ['apc', 'apc', 'tank'] },
          { at: 64, from: [1675, 840], units: ['kamikaze', 'kamikaze', 'kamikaze', 'drone'] },
          { at: 78, from: [1010, 25], units: ['td', 'tank'] },
          { at: 92, from: [25, 860], units: ['kamikaze', 'kamikaze', 'kamikaze'] },
          { at: 104, from: [1000, 1475], units: ['tank', 'tank', 'apc'] },
          { at: 114, from: [1675, 840], units: ['kamikaze', 'kamikaze', 'kamikaze'] },
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
          mission: { kind: 'hold', zone, time: 120, waves, label: 'Cố thủ ốc đảo' },
          infantry: { teams: 4, mines: 0.5, near: [850, 800], within: 320 },
        };
      },
    }),
  },
  { n: 9, title: 'Đèo gió', area: 'Đồi núi', brief: { situation: 'Đang xây dựng.', task: 'Cùng phe ta chiếm đèo.', lose: 'Xe bị phá hủy.' } },
  { n: 10, title: 'Pháo đài', area: 'Đồi núi', brief: { situation: 'Đang xây dựng.', task: 'Chiếm, cố thủ, rồi tiêu diệt toàn bộ.', lose: 'Xe bị phá hủy.' } },
];

// ---------- campaign progress (shared by both classes) ----------
const KEY = 'tank2026.campaign';
export function unlockedLevel(): number {
  try { return Math.max(1, JSON.parse(localStorage.getItem(KEY) || '{}').unlocked || 1); } catch { return 1; }
}
export function unlockLevel(n: number) {
  if (n <= unlockedLevel()) return;
  try { localStorage.setItem(KEY, JSON.stringify({ unlocked: n })); } catch { /* storage blocked */ }
}
