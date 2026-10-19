import { VoxelModel, type Palette } from './Voxel';

/*
 * Voxel models of the two player vehicles, 1 voxel = 0.2 m, +x forward, z up.
 * Tiger I silhouette: boxy hull whose superstructure overhangs the tracks, interleaved road wheels,
 * horseshoe turret with a flat mantlet, long 88 with a double muzzle brake, twin rear exhausts.
 * ARMA 8×8: wedge-nosed wheeled hull, eight big tyres, remote 30 mm turret with a sight head.
 * Both carry a modern anti-tank missile pod. Upgrades show as parts: add-on armour (`plate`),
 * slat cage round the hull (`cageAT`), anti-drone net over the turret (`cageUAV`).
 */

// palette roles
export const R = { base: 1, camo: 2, track: 3, tread: 4, wheel: 5, metal: 6, dark: 7, lens: 8, rust: 9, cage: 10, light: 11, tyre: 12, hub: 13, era: 14, hatch: 15, pod: 16, camo2: 17, net: 18 } as const;

export interface Gear { plate: boolean; cageAT: boolean; cageUAV: boolean }

/** camouflage: soft diagonal bands for the Tiger, blotches for the ARMA; only on the base colour */
const bands = (x: number, y: number, z: number) => Math.sin(x * 0.33 + y * 0.18 + z * 0.12) + Math.sin(y * 0.41 - x * 0.13) * 0.7;
const blotch = (x: number, y: number, z: number) => Math.sin(x * 0.45 + Math.sin(y * 0.6) * 1.5) * Math.cos(y * 0.38 + z * 0.3 + Math.sin(x * 0.3));

export function tigerHull(g: Gear) {
  const m = new VoxelModel(40, 32, 12, 20, 16);
  const { base: B, track: TR, tread: TD, wheel: WH, dark: DK, rust: RU, cage: CG, light: HL, era: ER } = R;
  // tracks with interleaved road wheels on the outer face, tread bars on the run
  for (const s of [-1, 1]) {
    const y0 = s > 0 ? 8 : -12, y1 = y0 + 4, outer = s > 0 ? 11 : -12;
    m.box(-16, 16, y0, y1, 0, 5, TR);
    for (let x = -15; x < 15; x += 2) m.box(x, x + 1, y0, y1, 4, 5, TD);
    for (const [cx, r] of [[-12, 2.3], [-8, 2.3], [-4, 2.3], [0, 2.3], [4, 2.3], [8, 2.3], [12, 2.3]] as [number, number][])
      for (let z = 0; z < 5; z++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (z + 0.5 - 2.4) ** 2 <= r * r) m.set(x, outer, z, WH);
    m.cylY(14.5, 2.6, 2, outer, outer + 1, TD); // drive sprocket
  }
  m.box(-15, 15, -8, 8, 1, 5, B); // lower hull between the tracks
  m.box(15, 17, -8, 8, 2, 5, B); // nose
  m.box(-16, 15, -12, 12, 5, 9, B); // superstructure over the tracks
  for (const s of [-1, 1]) m.box(15, 17, s > 0 ? 8 : -12, s > 0 ? 12 : -8, 5, 6, B); // front mudguards
  // front plate details: driver's visor, hull machine gun, headlights
  m.box(15, 16, 2, 6, 7, 8, DK); m.box(15, 16, -5, -3, 7, 8, DK);
  m.box(14, 15, 8, 10, 9, 10, HL); m.box(14, 15, -10, -8, 9, 10, HL);
  // engine deck grilles, hatches over the driver and radio operator
  for (let y = -7; y <= 6; y += 2) m.box(-15, -8, y, y + 1, 8, 9, DK);
  m.box(10, 13, 2, 5, 8, 9, R.hatch); m.box(10, 13, -6, -3, 8, 9, R.hatch);
  // twin exhaust stacks and air cleaners at the rear
  for (const s of [-1, 1]) { m.cylZ(-16.5, s * 4.5, 1.3, 5, 11, RU); m.cylZ(-16.5, s * 9, 1.2, 6, 9, DK); }
  m.paint((x, y, z, c) => (c === B && bands(x, y, z) > 0.75 ? R.camo : c));
  if (g.plate) {
    // add-on armour boxes along the superstructure and on the glacis
    for (const s of [-1, 1]) for (const x0 of [-13, -5, 3]) m.box(x0, x0 + 7, s > 0 ? 12 : -13, s > 0 ? 13 : -12, 5, 9, ER);
    m.box(16, 17, -7, 7, 5, 8, ER);
  }
  if (g.cageAT) {
    // slat cage clear of the hull sides: rails top and bottom, a slat every other voxel
    for (const s of [-1, 1]) {
      const y = s > 0 ? 14 : -15;
      m.box(-16, 16, y, y + 1, 9, 10, CG); m.box(-16, 16, y, y + 1, 2, 3, CG);
      for (let x = -15; x < 16; x += 3) m.box(x, x + 1, y, y + 1, 3, 9, CG);
      for (const x of [-12, 0, 12]) m.box(x, x + 1, s > 0 ? 12 : -14, s > 0 ? 14 : -12, 8, 9, CG); // brackets
    }
  }
  return m;
}

export function tigerTurret(g: Gear) {
  const m = new VoxelModel(50, 24, 16, 15, 12);
  const { base: B, metal: MT, dark: DK } = R;
  // horseshoe: flat front, rounded sides and rear
  for (let z = 0; z < 6; z++) for (let y = -8; y < 8; y++) for (let x = -10; x < 7; x++) {
    const px = x + 0.5, py = y + 0.5, r = z === 5 ? 7.3 : 8.2;
    if (px >= 0 ? Math.abs(py) <= (z === 5 ? 7 : 8) && px < (z === 5 ? 6 : 7) : (px / 9.5) ** 2 + (py / r) ** 2 <= 1) m.set(x, y, z, B);
  }
  m.box(6, 9, -5, 5, 1, 5, B); // mantlet
  m.box(8, 9, -4, -2, 3, 4, DK); // gunner's sight
  m.cylX(0, 3, 1.6, 9, 14, MT); // gun sleeve
  m.cylX(0, 3, 1.05, 14, 30, MT); // 88 mm barrel
  m.box(29, 31, -2, 2, 1, 5, MT); m.box(31, 32, -1, 1, 2, 4, MT); m.box(32, 34, -2, 2, 1, 5, MT); // double-baffle muzzle brake
  m.cylZ(-4, -4.5, 2.4, 6, 8, B); m.cylZ(-4, -4.5, 1.3, 7, 8, DK); // commander's cupola
  m.box(-1, 2, 2, 5, 6, 7, R.hatch); // loader's hatch
  m.box(-14, -9, -6, 6, 1, 5, B); // stowage bin on the rear
  for (const s of [-1, 1]) m.box(4, 6, s > 0 ? 8 : -9, s > 0 ? 9 : -8, 3, 5, DK); // smoke dischargers
  // anti-tank missile pod on the right side, tube mouths forward
  m.box(-5, 4, 8, 11, 2, 5, R.pod); m.box(4, 5, 8, 11, 2, 5, DK);
  m.box(-8, -7, 5, 6, 6, 15, DK); // antenna
  m.paint((x, y, z, c) => (c === B && bands(x + 3, y, z + 9) > 0.75 ? R.camo : c));
  if (g.cageUAV) {
    // anti-drone net on four posts: a sparse grid so the turret still shows through
    const z = 9;
    for (const [px, py] of [[6, 8], [6, -9], [-10, 8], [-10, -9]]) m.box(px, px + 1, py, py + 1, 5, z, R.net);
    for (let x = -10; x <= 6; x += 4) m.box(x, x + 1, -9, 9, z, z + 1, R.net);
    for (const y of [-9, -3, 2, 8]) m.box(-10, 7, y, y + 1, z, z + 1, R.net);
  }
  return m;
}

export function armaHull(g: Gear) {
  const m = new VoxelModel(38, 26, 13, 19, 13);
  const { base: B, tyre: TI, hub: HB, dark: DK, light: HL, cage: CG, era: ER } = R;
  // eight big tyres, hubs on the outer face
  for (const cx of [-12, -6.5, 3.5, 9.5]) for (const s of [-1, 1]) {
    const y0 = s > 0 ? 7 : -9;
    m.cylY(cx, 3.2, 3.2, y0, y0 + 2, TI);
    m.cylY(cx, 3.2, 1.5, s > 0 ? y0 + 1 : y0, s > 0 ? y0 + 2 : y0 + 1, HB);
  }
  m.box(-15, 14, -5, 5, 2, 4, B); // belly
  m.box(-15, 13, -7, 7, 4, 10, B); // hull sides
  m.box(-14, 12, -6, 6, 10, 11, B); // roof, bevelled in
  // wedge nose: the top slopes down and the belly up toward the front
  for (let x = 13; x < 18; x++) { const k = x - 13; m.box(x, x + 1, -7 + (k > 3 ? 1 : 0), 7 - (k > 3 ? 1 : 0), 3 + Math.round(k * 0.6), 10 - Math.round(k * 1.1), B); }
  m.box(13, 16, -5, 5, 8, 9, DK); // driver's windows on the glacis
  m.box(17, 18, 4, 6, 5, 6, HL); m.box(17, 18, -6, -4, 5, 6, HL);
  for (const s of [-1, 1]) {
    for (const x of [-11, -7, -3, 1, 6]) m.box(x, x + 1, s > 0 ? 6 : -7, s > 0 ? 7 : -6, 8, 9, DK); // side vision blocks
    m.box(14, 15, s > 0 ? 7 : -8, s > 0 ? 8 : -7, 9, 12, DK); // mirror posts
  }
  m.box(-15, -14, -4, 4, 4, 9, DK); m.box(-15, -14, -3, 3, 5, 8, B); // rear ramp door
  m.box(-12, -8, -5, -1, 11, 12, R.hatch); m.box(-12, -8, 1, 5, 11, 12, R.hatch); // roof hatches
  m.paint((x, y, z, c) => (c !== B ? c : blotch(x, y, z) > 0.45 ? R.camo : blotch(x + 9, y - 4, z) > 0.55 ? R.camo2 : c));
  if (g.plate) {
    // explosive reactive armour tiles along the sides above the wheels and on the glacis
    for (const s of [-1, 1]) for (let x = -14; x < 12; x += 3) m.box(x, x + 2, s > 0 ? 7 : -8, s > 0 ? 8 : -7, 6, 10, ER);
    for (let y = -6; y < 6; y += 3) m.box(14, 16, y, y + 2, 7, 8, ER);
  }
  if (g.cageAT) {
    for (const s of [-1, 1]) {
      const y = s > 0 ? 10 : -11;
      m.box(-15, 15, y, y + 1, 10, 11, CG); m.box(-15, 15, y, y + 1, 6, 7, CG);
      for (let x = -14; x < 15; x += 3) m.box(x, x + 1, y, y + 1, 7, 10, CG);
    }
  }
  return m;
}

export function armaTurret(g: Gear) {
  const m = new VoxelModel(32, 18, 12, 8, 9);
  const { base: B, metal: MT, dark: DK, lens: LN } = R;
  m.box(-5, 4, -4, 4, 0, 3, B); m.box(4, 6, -3, 3, 0, 2, B); // turret body, chin
  m.box(-1, 2, -4, -1, 3, 6, B); m.box(2, 3, -3, -2, 4, 5, LN); // sight head with its lens
  m.box(3, 5, -1, 1, 1, 3, MT); // gun mantlet
  m.cylX(0, 1.5, 0.7, 5, 19, MT); m.box(18, 20, -1, 1, 1, 3, MT); // 30 mm barrel and muzzle
  m.box(-4, 3, 4, 6, 1, 4, R.pod); m.box(3, 4, 4, 6, 1, 4, DK); // missile pod
  m.box(-5, -4, -4, -3, 3, 10, DK); // antenna
  m.paint((x, y, z, c) => (c !== B ? c : blotch(x - 1, y + 2, z + 10) > 0.45 ? R.camo : c));
  if (g.cageUAV) {
    const z = 7;
    for (const [px, py] of [[5, 5], [5, -6], [-6, 5], [-6, -6]]) m.box(px, px + 1, py, py + 1, 2, z, R.net);
    for (const x of [-6, -1, 5]) m.box(x, x + 1, -6, 6, z, z + 1, R.net);
    for (const y of [-6, 0, 5]) m.box(-6, 6, y, y + 1, z, z + 1, R.net);
  }
  return m;
}

/** colours per side: the player's green, enemy rust, friendly blue-grey; shared hardware colours */
const HW: Palette = { [R.track]: 0x2a2924, [R.tread]: 0x4a4840, [R.wheel]: 0x6b6a5c, [R.metal]: 0x55574e, [R.dark]: 0x22231f, [R.lens]: 0xd8432f, [R.rust]: 0x6e4a32, [R.cage]: 0x4a4c40, [R.net]: 0x8b8d7c, [R.light]: 0xf3e6b0, [R.tyre]: 0x262622, [R.hub]: 0x55604a };
export const PALETTES: Record<'player' | 'enemy' | 'friend', Palette> = {
  player: { ...HW, [R.base]: 0x6f7c46, [R.camo]: 0xa99158, [R.camo2]: 0x4b5832, [R.era]: 0x5d6a3b, [R.hatch]: 0x606d3d, [R.pod]: 0x4f5a34, [R.wheel]: 0x7d8a52 },
  enemy: { ...HW, [R.base]: 0x8e4a34, [R.camo]: 0x5c4a3e, [R.camo2]: 0x6d3626, [R.era]: 0x7a4030, [R.hatch]: 0x7d4230, [R.pod]: 0x5a4136, [R.hub]: 0x6a4a3a, [R.wheel]: 0x9a5c42 },
  friend: { ...HW, [R.base]: 0x4f6a86, [R.camo]: 0x7b8a96, [R.camo2]: 0x3b5068, [R.era]: 0x46607a, [R.hatch]: 0x48627c, [R.pod]: 0x3f5266, [R.hub]: 0x4a5a6a, [R.wheel]: 0x5f7c98 },
};

// ---------------------------------------------------------------- enemy vehicles

/** Panzer IV Ausf. H: side skirts and a turret skirt make a boxy silhouette unlike the Tiger; 75 mm L/48 */
export function pz4Hull() {
  const m = new VoxelModel(36, 28, 10, 18, 14);
  const { base: B, track: TR, tread: TD, wheel: WH, dark: DK, rust: RU } = R;
  for (const s of [-1, 1]) {
    const y0 = s > 0 ? 6 : -10, outer = s > 0 ? 9 : -10;
    m.box(-15, 15, y0, y0 + 4, 0, 4, TR);
    for (let x = -14; x < 14; x += 2) m.box(x, x + 1, y0, y0 + 4, 3, 4, TD);
    for (let cx = -11.5; cx <= 12; cx += 3.3) m.cylY(cx, 1.6, 1.4, outer, outer + 1, WH);
    m.box(-15, 15, s > 0 ? 6 : -10, s > 0 ? 10 : -6, 4, 5, B); // fenders
    // Schürzen: skirt plates hung clear of the hull, small gaps between them
    for (let x = -14; x < 14; x += 7) m.box(x, x + 6, s > 0 ? 11 : -12, s > 0 ? 12 : -11, 2, 8, B);
  }
  m.box(-14, 14, -6, 6, 1, 4, B); // lower hull
  m.box(14, 16, -6, 6, 1, 4, B); // nose
  m.box(-14, 12, -9, 9, 5, 8, B); // superstructure
  m.box(12, 14, -9, 9, 4, 7, B); // stepped driver's plate
  m.box(13, 14, 2, 5, 6, 7, DK); m.box(13, 14, -5, -3, 6, 7, DK); // visor, hull machine gun
  for (let y = -6; y <= 5; y += 2) m.box(-13, -6, y, y + 1, 7, 8, DK); // engine deck
  m.box(-16, -14, -3, 3, 3, 5, RU); // muffler
  m.paint((x, y, z, c) => (c === B && bands(x - 5, y + 3, z) > 0.8 ? R.camo : c));
  return m;
}
export function pz4Turret() {
  const m = new VoxelModel(40, 22, 12, 12, 11);
  const { base: B, metal: MT, dark: DK } = R;
  // angular turret narrowing to the rear
  for (let x = -6; x < 5; x++) { const hw = x < -3 ? 5 : 6; m.box(x, x + 1, -hw, hw, 0, 5, B); }
  m.box(5, 7, -3, 3, 1, 4, B); // mantlet
  m.cylX(0, 2.5, 0.9, 7, 24, MT); m.box(23, 25, -2, 2, 1, 4, MT); // 75 mm with muzzle brake
  m.cylZ(-4.5, 0, 2, 5, 7, B); m.cylZ(-4.5, 0, 1, 6, 7, DK); // commander's cupola
  // turret skirt round the sides and rear
  for (const s of [-1, 1]) m.box(-7, 4, s > 0 ? 8 : -9, s > 0 ? 9 : -8, 1, 5, B);
  m.box(-10, -9, -8, 8, 1, 5, B);
  m.box(-8, -7, 4, 5, 5, 12, DK); // antenna
  m.paint((x, y, z, c) => (c === B && bands(x, y - 2, z + 8) > 0.8 ? R.camo : c));
  return m;
}

/** SU-100: T-34 hull with a sloped casemate, very long 100 mm, big Christie wheels, rear fuel drums */
export function su100Hull() {
  const m = new VoxelModel(38, 28, 14, 19, 14);
  const { base: B, track: TR, tread: TD, wheel: WH, dark: DK, metal: MT } = R;
  for (const s of [-1, 1]) {
    const y0 = s > 0 ? 8 : -12, outer = s > 0 ? 11 : -12;
    m.box(-16, 16, y0, y0 + 4, 0, 5, TR);
    for (let x = -15; x < 15; x += 2) m.box(x, x + 1, y0, y0 + 4, 4, 5, TD);
    for (const cx of [-12, -6, 0, 6, 12]) m.cylY(cx, 2.5, 2.4, outer, outer + 1, WH);
    m.cylX(s * 10, 8.5, 1.3, -14, -8, MT); // external fuel drums
  }
  m.box(-15, 15, -8, 8, 1, 5, B); // lower hull
  m.box(-15, 14, -11, 11, 5, 7, B); // over the tracks
  m.box(-15, -3, -10, 10, 7, 8, B); // low rear deck
  m.box(-16, -15, -8, 8, 2, 6, B); // rear plate
  // casemate: tall box over the front half, its glacis sloping down to the nose
  m.box(-3, 7, -10, 10, 7, 13, B);
  for (let x = 7; x < 18; x++) { const top = Math.max(5, Math.round(13 - (x - 7) * 0.8)); m.box(x, x + 1, -10, 10, 4, top, B); }
  m.cylZ(0, 6, 1.8, 13, 15, B); m.cylZ(0, 6, 0.9, 14, 15, DK); // commander's cupola
  m.box(15, 16, 3, 6, 6, 7, DK); // driver's hatch
  for (let y = -6; y <= 5; y += 2) m.box(-14, -5, y, y + 1, 7, 8, DK); // engine deck
  m.paint((x, y, z, c) => (c === B && blotch(x, y, z + 3) > 0.55 ? R.camo : c));
  return m;
}
/** the gun alone (it traverses a little in the casemate): mantlet and barrel */
export function su100Gun() {
  const m = new VoxelModel(32, 8, 6, 3, 4);
  m.cylX(0, 2, 2.2, -2, 3, R.base); m.cylX(0, 2, 1, 3, 27, R.metal);
  return m;
}

/** Patria AMV 6×6: long sloped glacis, flat sides, six wheels, small remote machine-gun station */
export function patriaHull() {
  const m = new VoxelModel(38, 22, 12, 19, 11);
  const { base: B, tyre: TI, hub: HB, dark: DK, light: HL } = R;
  for (const cx of [-11, 3, 10]) for (const s of [-1, 1]) {
    const y0 = s > 0 ? 7 : -9;
    m.cylY(cx, 3, 3, y0, y0 + 2, TI);
    m.cylY(cx, 3, 1.4, s > 0 ? y0 + 1 : y0, s > 0 ? y0 + 2 : y0 + 1, HB);
  }
  m.box(-16, 13, -5, 5, 2, 4, B);
  m.box(-16, 9, -7, 7, 4, 10, B);
  m.box(-15, 8, -6, 6, 10, 11, B);
  for (let x = 9; x < 19; x++) { const k = x - 9; m.box(x, x + 1, -7, 7, 3 + Math.round(k * 0.2), Math.max(5, 10 - Math.round(k * 0.55)), B); } // long glacis
  m.box(17, 18, 4, 6, 4, 5, HL); m.box(17, 18, -6, -4, 4, 5, HL);
  for (let x = 4; x < 10; x += 2) m.box(x, x + 1, 2, 6, 9, 10, DK); // engine grille, front right
  m.box(-16, -15, -4, 4, 4, 9, DK); m.box(-16, -15, -3, 3, 5, 8, B); // rear door
  for (const s of [-1, 1]) m.box(-12, -4, s > 0 ? 7 : -8, s > 0 ? 8 : -7, 7, 9, R.hatch); // side stowage boxes
  m.paint((x, y, z, c) => (c === B && blotch(x + 4, y, z) > 0.5 ? R.camo : c));
  return m;
}
export function patriaTurret() {
  const m = new VoxelModel(16, 10, 6, 4, 5);
  m.box(-3, 2, -2, 3, 0, 2, R.base); m.box(-1, 1, -3, -2, 1, 3, R.dark); // weapon station, sight
  m.box(2, 11, 0, 1, 1, 2, R.metal); m.box(-1, 1, 2, 4, 0, 2, R.hatch); // 12.7 mm, ammo box
  return m;
}

/** Toyota Hilux "technical": cab, bed with a twin anti-tank launcher, bull bar, patched paint */
export function hiluxHull() {
  const m = new VoxelModel(30, 16, 10, 15, 8);
  const { base: B, tyre: TI, hub: HB, dark: DK, light: HL } = R;
  for (const cx of [8.5, -8]) for (const s of [-1, 1]) {
    const y0 = s > 0 ? 5 : -7;
    m.cylY(cx, 2.2, 2.2, y0, y0 + 2, TI);
    m.cylY(cx, 2.2, 1, s > 0 ? y0 + 1 : y0, s > 0 ? y0 + 2 : y0 + 1, HB);
  }
  m.box(-13, 13, -5, 5, 2, 3, DK); // frame
  m.box(7, 13, -5, 5, 3, 6, B); // bonnet
  m.box(0, 7, -5, 5, 3, 9, B); m.box(1, 6, -5, 5, 6, 8, DK); m.box(1, 6, -4, 4, 6, 8, B); m.box(6, 7, -4, 4, 6, 8, DK); // cab with windows
  m.box(-13, 0, -5, 5, 3, 4, B); // bed floor
  for (const s of [-1, 1]) m.box(-13, 0, s > 0 ? 4 : -5, s > 0 ? 5 : -4, 4, 6, B); // bed sides
  m.box(-13, -12, -5, 5, 4, 6, B); // tailgate
  m.box(13, 14, -5, 5, 3, 5, DK); m.box(13, 14, 3, 5, 5, 6, HL); m.box(13, 14, -5, -3, 5, 6, HL); // bull bar, lamps
  m.paint((x, y, z, c) => (c === B && blotch(x * 1.4, y * 1.6, z) > 0.35 ? R.camo : c));
  return m;
}
export function hiluxLauncher() {
  const m = new VoxelModel(16, 8, 8, 6, 4);
  m.box(-1, 1, -1, 1, 0, 3, R.metal); // pedestal
  for (const y of [-1.4, 1.4]) m.cylX(y, 4, 1, -5, 6, R.pod);
  m.box(6, 7, -2, 2, 3, 5, R.dark); m.box(-2, 0, 2, 3, 3, 5, R.dark); // tube mouths, sight
  return m;
}
