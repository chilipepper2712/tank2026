import { ATGM, DEG, MG, PLAYER_CLASSES, REPAIR, type AllyType, type UnitSpec } from './config';

export type ClassId = keyof typeof PLAYER_CLASSES;
export type UpId = 'cannon' | 'missile' | 'mg' | 'plate' | 'cageAT' | 'cageUAV' | 'engine' | 'tracks' | 'stab' | 'kit';
export type Group = 'fire' | 'protect' | 'move' | 'support';
export const MAX_LEVEL = 3;

export const GROUP_NAME: Record<Group, string> = { fire: 'Hỏa lực', protect: 'Bảo vệ', move: 'Cơ động', support: 'Hỗ trợ' };

/** What each level does. Protection items slow the vehicle while their layer is intact. */
export const UPGRADES: Record<UpId, { group: Group; name: string; perLevel: string }> = {
  cannon: { group: 'fire', name: 'Pháo chính', perLevel: '+12% sát thương, nạp nhanh hơn 10%' },
  missile: { group: 'fire', name: 'Tên lửa', perLevel: '+1 quả mỗi màn, nạp nhanh hơn 12%; cấp 2 thêm 1 ô bệ phóng' },
  mg: { group: 'fire', name: 'Súng máy', perLevel: '+15% sát thương, +10% tầm' },
  plate: { group: 'protect', name: 'Giáp phụ', perLevel: '+15% máu dạng lớp giáp ngoài; xe chậm 5% khi còn lớp này' },
  cageAT: { group: 'protect', name: 'Lồng chống tăng', perLevel: 'Giảm 30% sát thương vào hông và đuôi; chậm 4% khi còn lồng' },
  cageUAV: { group: 'protect', name: 'Lồng chống UAV', perLevel: 'Chặn đạn từ drone; chậm 3% khi còn lồng' },
  engine: { group: 'move', name: 'Động cơ', perLevel: '+8% tốc độ' },
  tracks: { group: 'move', name: 'Xích và hộp số', perLevel: 'Thân xe xoay nhanh hơn 12%, bớt ì' },
  stab: { group: 'move', name: 'Bộ ổn định pháo', perLevel: 'Chụm tâm nhanh hơn 15%' },
  kit: { group: 'support', name: 'Kit sửa chữa', perLevel: '+5% máu hồi mỗi lượt sửa; cấp 3 có thêm droid sửa chữa đi theo xe' },
};
export const UP_IDS = Object.keys(UPGRADES) as UpId[];
export type Levels = Record<UpId, number>;
export const emptyLevels = (): Levels => Object.fromEntries(UP_IDS.map((k) => [k, 0])) as Levels;

// ---------- permanent upgrades, saved per class ----------
const KEY = (c: ClassId) => `tank2026.upgrades.${c}`;
export function loadPerm(c: ClassId): Levels {
  const l = emptyLevels();
  try { Object.assign(l, JSON.parse(localStorage.getItem(KEY(c)) || '{}')); } catch { /* storage blocked */ }
  return l;
}
export function savePerm(c: ClassId, l: Levels) {
  try { localStorage.setItem(KEY(c), JSON.stringify(l)); } catch { /* storage blocked */ }
}
export function resetPerm() { for (const c of Object.keys(PLAYER_CLASSES) as ClassId[]) savePerm(c, emptyLevels()); }

/** Everything the player's numbers depend on, for a given set of levels. */
export interface Loadout {
  spec: UnitSpec; // with cannon, mobility and stabiliser applied
  mgDmg: number; mgRange: number;
  rack: number; misReload: number; misAmmo: number;
  kitHeal: number;
  repairDroid: boolean;
  plate: number; cageAT: number; cageUAV: number; // pool sizes, 0 = not fitted
  slowPlate: number; slowAT: number; slowUAV: number; // speed factor lost while each layer holds
}

export function derive(c: ClassId, lv: Levels): Loadout {
  const base = PLAYER_CLASSES[c];
  const L = (k: UpId) => Math.min(MAX_LEVEL, lv[k]);
  const spec: UnitSpec = {
    ...base,
    speed: base.speed * (1 + 0.08 * L('engine')),
    hullTurn: base.hullTurn * (1 + 0.12 * L('tracks')),
    hullInertia: base.hullInertia * (1 - 0.15 * L('tracks')),
    aimTime: base.aimTime * (1 - 0.15 * L('stab')),
    weapon: { ...base.weapon, dmg: base.weapon.dmg * (1 + 0.12 * L('cannon')), reload: base.weapon.reload * (1 - 0.1 * L('cannon')) },
  };
  return {
    spec,
    mgDmg: MG.dmg * (1 + 0.15 * L('mg')), mgRange: MG.range * (1 + 0.1 * L('mg')),
    rack: ATGM.perLoad + (L('missile') >= 2 ? 1 : 0),
    misReload: ATGM.reloadEach * (1 - 0.12 * L('missile')),
    misAmmo: ATGM.ammo + L('missile'),
    kitHeal: REPAIR.kitHeal + 0.05 * L('kit'),
    repairDroid: L('kit') >= 3,
    plate: base.hp * 0.15 * L('plate'), cageAT: 60 * L('cageAT'), cageUAV: 30 * L('cageUAV'),
    slowPlate: 0.05 * L('plate'), slowAT: 0.04 * L('cageAT'), slowUAV: 0.03 * L('cageUAV'),
  };
}

// ---------- upgrade screen ----------
/** sprite icon (index.html) per upgrade */
export const UP_ICON: Record<UpId, string> = {
  cannon: 'cannon', missile: 'missile', mg: 'mg', plate: 'shield', cageAT: 'cage', cageUAV: 'cagedrone',
  engine: 'engine', tracks: 'tracks', stab: 'stab', kit: 'wrench',
};
/** the number each upgrade moves, read from derive() so the screen follows the config */
export const UP_METRIC: Record<UpId, { unit: string; of: (l: Loadout) => number; digits?: number }> = {
  cannon: { unit: 'sát thương mỗi phát', of: (l) => l.spec.weapon.dmg },
  missile: { unit: 'quả mỗi màn', of: (l) => l.misAmmo },
  mg: { unit: 'sát thương/giây', of: (l) => l.mgDmg * MG.rate * MG.hit, digits: 1 },
  plate: { unit: 'điểm giáp ngoài', of: (l) => l.plate },
  cageAT: { unit: 'điểm lồng', of: (l) => l.cageAT },
  cageUAV: { unit: 'điểm lồng', of: (l) => l.cageUAV },
  engine: { unit: '% tốc độ gốc', of: (l) => (l.spec.speed / PLAYER_CLASSES[l.spec.id as ClassId].speed) * 100 },
  tracks: { unit: '°/giây xoay thân', of: (l) => l.spec.hullTurn / DEG },
  stab: { unit: 'giây chụm tâm', of: (l) => l.spec.aimTime, digits: 2 },
  kit: { unit: '% máu mỗi kit', of: (l) => l.kitHeal * 100 },
};
/** values of an upgrade's metric at levels 0..MAX for one class (other upgrades at 0) */
export function metricSeries(c: ClassId, k: UpId) {
  const out: number[] = [];
  for (let n = 0; n <= MAX_LEVEL; n++) { const lv = emptyLevels(); lv[k] = n; out.push(UP_METRIC[k].of(derive(c, lv))); }
  return out;
}
/** designed but not built yet: shown locked */
export const PLANNED: { name: string; icon: string; group: Group; note: string }[] = [
  { name: 'Kính ảnh nhiệt', icon: 'eye', group: 'support', note: 'Thấy địch trong bóng tối và khói. Làm cùng giai đoạn ngày đêm.' },
  { name: 'Đạn khói', icon: 'smoke', group: 'support', note: 'Thả màn khói che xe khi rút lui. Làm cùng giai đoạn ngày đêm.' },
];
/** companion upgrades: none agreed yet; rows added here appear on the upgrade screen */
export const ALLY_UPGRADES: Record<AllyType, { name: string; perLevel: string; max: number }[]> = { attackDrone: [], interceptor: [], robot: [], repairDroid: [] };

export const describe = (lv: Levels) => UP_IDS.filter((k) => lv[k] > 0).map((k) => `${UPGRADES[k].name} ${Math.min(MAX_LEVEL, lv[k])}`).join(' · ');
