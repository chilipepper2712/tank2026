import { Application, Container, Graphics, Text } from 'pixi.js';
import { K, PLAYER_CLASSES } from './config';
import { UnitView } from './render/UnitView';
import { VoxelVehicle, voxelSet, type Side, type VoxKind } from './render/VoxelView';
import type { Gear } from './render/vehicles';

/** ?voxel — old vector vehicles next to the voxel prototypes, turning, at game size and close up */
export function openVoxelTest(app: Application) {
  for (const id of ['menu', 'hud']) { const e = document.getElementById(id); if (e) e.hidden = true; }
  const gear: Gear = { plate: false, cageAT: false, cageUAV: false };
  let side: Side = 'player', spin = true;
  const stage = new Container();
  app.stage.addChild(stage);
  const panel = document.createElement('div');
  panel.id = 'voxpanel';
  panel.innerHTML = `<b>XE VOXEL · THỬ</b>
    <label><input type="checkbox" data-g="plate"> Giáp phụ / giáp phản ứng nổ</label>
    <label><input type="checkbox" data-g="cageAT"> Lồng chống tăng</label>
    <label><input type="checkbox" data-g="cageUAV"> Lồng chống UAV</label>
    <label>Phe <select id="vside"><option value="player">ta (xanh)</option><option value="enemy">địch (gỉ đỏ)</option><option value="friend">đồng minh (xanh lam)</option></select></label>
    <label><input type="checkbox" id="vspin" checked> Tự xoay</label>
    <small id="vinfo"></small>`;
  document.body.appendChild(panel);
  const vehicles: { v: VoxelVehicle; x: number; y: number; s: number }[] = [];
  const olds: { u: UnitView; x: number; y: number; s: number }[] = [];
  const build = () => {
    stage.removeChildren();
    vehicles.length = 0; olds.length = 0;
    const W = innerWidth, H = innerHeight;
    const g = new Graphics().rect(0, 0, W, H).fill(0x5f6e3b);
    for (let k = 0; k < 400; k++) g.rect(Math.random() * W, Math.random() * H, 2, 2);
    g.fill({ color: 0x33401f, alpha: 0.25 });
    g.rect(0, H * 0.58, W, 1).fill({ color: 0xffffff, alpha: 0.12 });
    stage.addChild(g);
    const label = (t: string, x: number, y: number) => { const tx = new Text({ text: t, style: { fontFamily: 'Chakra Petch, monospace', fontSize: 11, fill: 0xebe7d3 } }); tx.anchor.set(0.5, 0); tx.position.set(x, y); stage.addChild(tx); };
    // close-up row (×3) and game-size row (×1.4, roughly what a phone shows)
    const rows: [number, number, string][] = [[H * 0.36, 3, 'phóng to ×3'], [H * 0.82, 1.4, 'cỡ trong game']];
    for (const [y, s, name] of rows) {
      const cols = [W * 0.14, W * 0.34, W * 0.62, W * 0.84];
      ([['tank', 0], ['tank', 1], ['apc', 0], ['apc', 1]] as const).forEach(([kind, vox], k) => {
        const x = cols[k];
        if (vox) {
          const v = new VoxelVehicle(kind, side, gear); v.root.scale.set(s); v.root.position.set(x, y); stage.addChild(v.root); vehicles.push({ v, x, y, s });
        } else {
          const u = new UnitView(PLAYER_CLASSES[kind], true); u.root.scale.set(s, s * K); u.root.position.set(x, y); stage.addChild(u.root); olds.push({ u, x, y, s });
        }
        if (s === 3) label(vox ? (kind === 'tank' ? 'Tiger I voxel' : 'ARMA 8×8 voxel') : 'bản hiện tại', x, y + 62);
      });
      label(name, W * 0.5, y - (s === 3 ? 80 : 34));
    }
    const t = voxelSet('tank', side, gear), a = voxelSet('apc', side, gear);
    (document.getElementById('vinfo') as HTMLElement).textContent = `vẽ sẵn: xe tăng ${t.ms.toFixed(0)} ms, xe bọc thép ${a.ms.toFixed(0)} ms (${t.hull.n} góc)`;
  };
  for (const cb of panel.querySelectorAll<HTMLInputElement>('input[data-g]')) cb.addEventListener('change', () => { gear[cb.dataset.g as keyof Gear] = cb.checked; build(); });
  (document.getElementById('vside') as HTMLSelectElement).addEventListener('change', (e) => { side = (e.target as HTMLSelectElement).value as Side; build(); });
  (document.getElementById('vspin') as HTMLInputElement).addEventListener('change', (e) => { spin = (e.target as HTMLInputElement).checked; });
  if (new URLSearchParams(location.search).has('grid')) {
    // inspection sheet: both vehicles at six fixed headings, close up, with gear from the URL
    const q = new URLSearchParams(location.search);
    for (const k of ['plate', 'cageAT', 'cageUAV'] as const) gear[k] = q.has(k);
    side = (q.get('side') as Side) || 'player';
    panel.hidden = true; spin = false;
    const W = innerWidth, H = innerHeight, sc = Number(q.get('s') || 2.6);
    stage.addChild(new Graphics().rect(0, 0, W, H).fill(0x5f6e3b));
    const kinds = (q.get('kinds') || 'tank,apc').split(',') as VoxKind[];
    kinds.forEach((kind, r) => {
      for (let k = 0; k < 6; k++) {
        const v = new VoxelVehicle(kind, (q.get('side') as Side) || (kinds.length > 2 ? 'enemy' : side), gear), a = (k / 6) * Math.PI * 2;
        v.root.scale.set(sc); v.root.position.set(W * (k + 0.5) / 6, H * (r + 0.6) / kinds.length); stage.addChild(v.root);
        v.sync(a, a + 0.5);
      }
    });
    return;
  }
  build();
  let t = 0, hull = 0.4, tur = 0.4;
  app.ticker.add((tk) => {
    if (!spin) return;
    t += tk.deltaMS / 1000;
    hull += (tk.deltaMS / 1000) * 0.5; tur = hull + Math.sin(t * 0.7) * 1.2;
    for (const { v } of vehicles) v.sync(hull, tur, 0);
    for (const { u, x, y } of olds) u.sync(x, y / K, 0, hull, tur, 0, false, t);
    for (const { u, x, y, s } of olds) { u.root.position.set(x, y); u.root.scale.set(s, s * K); }
  });
}
