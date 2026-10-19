import type { EnemyType } from '../config';
import { sfx } from '../audio/Sfx';
import { TRAINING_SPOTS as T } from '../world/levels';

/*
 * Recruit training: one station after another on the training ground. Each station shows one line
 * of instruction (touch or keyboard wording), lights up the button it is about, marks where to go
 * or what to shoot, and moves on as soon as the player has done it. Targets are dummies that do not
 * shoot back, until the last station, which is a small real fight. The vehicle cannot be destroyed here.
 */

/** the parts of a unit the script reads */
export interface TUnit { x: number; y: number; dead: boolean; hp: number; hull: number; spec: { hp: number } }

/** what the game lends the script */
export interface TrainingHost {
  player: TUnit;
  coarse: boolean;
  anchors: [number, number][];
  /** a dummy stands still and never fires; `hp` overrides its armour (the machine gun would finish a soft one by itself, so stations use armour) */
  spawn(type: EnemyType, x: number, y: number, hull: number, dummy: boolean, hp?: number): TUnit;
  dropCrate(x: number, y: number): void;
  /** set the player's armour to this share of full */
  hurt(frac: number): void;
  /** fill the air-support charge */
  charge(): void;
  /** running counts: crates picked up, kits used, the player's side or rear hits */
  tally(): { crates: number; kitsUsed: number; flank: number };
}

type Btn = 'fireBtn' | 'misBtn' | 'repBtn' | 'airBtn';
interface Step {
  title: string;
  touch: string;
  pc: string;
  btn?: Btn;
  enter(): void;
  done(): boolean;
  /** where the arrow points */
  goal(): [number, number] | null;
  /** a place to drive to: a ring on the ground (targets get a chevron instead) */
  ring?: true;
}

const NEAR = 40;

export class Training {
  done = false;
  /** the unit to shoot at this station, marked with a chevron */
  target: TUnit | null = null;
  private k = -1;
  private pause = 0;
  /** the card folds to one line once there has been time to read it, so it does not hide the field */
  private readT = 0;
  private steps: Step[];
  private el = {
    box: document.getElementById('coach') as HTMLElement,
    step: document.getElementById('coachStep') as HTMLElement,
    title: document.getElementById('coachTitle') as HTMLElement,
    text: document.getElementById('coachText') as HTMLElement,
  };

  constructor(private h: TrainingHost) {
    const p = h.player, at = (q: [number, number]) => Math.hypot(p.x - q[0], p.y - q[1]) < NEAR;
    const face = (x: number, y: number) => Math.atan2(p.y - y, p.x - x);
    let wp = 0, base = h.tally(), armour: TUnit | null = null, group: TUnit[] = [], live: TUnit[] = [];
    this.steps = [
      {
        title: 'LÁI XE', ring: true,
        touch: 'Đặt ngón cái ở góc dưới bên trái rồi kéo về hướng muốn đi. Lái vào vòng xanh.',
        pc: 'W A S D để lái. Lái vào vòng xanh.',
        enter: () => { wp = 0; },
        done: () => { if (at(T.drive[wp])) wp++; return wp >= T.drive.length; },
        goal: () => T.drive[Math.min(wp, T.drive.length - 1)],
      },
      {
        title: 'KHÓA VÀ BẮN',
        touch: 'Chạm vào xe địch để khóa: nòng tự xoay theo. Giữ BẮN khi vòng quanh nút chuyển xanh.',
        pc: 'Rê chuột vào xe địch để ngắm, Space để bắn.',
        btn: 'fireBtn',
        enter: () => { this.target = h.spawn('apc', T.soft[0], T.soft[1], face(T.soft[0], T.soft[1]), true); },
        done: () => !!this.target?.dead,
        goal: () => this.target && [this.target.x, this.target.y],
      },
      {
        title: 'ĐÁNH SƯỜN',
        touch: 'Giáp trước xe tăng rất dày: bắn thẳng mặt chỉ còn nửa sức, bắn hông đủ sức, bắn sau lưng gấp rưỡi. Vòng sang hông rồi bắn.',
        pc: 'Giáp trước xe tăng rất dày: bắn thẳng mặt chỉ còn nửa sức, bắn hông đủ sức, bắn sau lưng gấp rưỡi. Vòng sang hông rồi bắn.',
        enter: () => {
          base = h.tally();
          armour = this.target = h.spawn('tank', T.armour[0], T.armour[1], face(T.armour[0], T.armour[1]), true, 400);
        },
        done: () => h.tally().flank > base.flank || !!armour?.dead,
        goal: () => armour && [armour.x, armour.y],
      },
      {
        title: 'TÊN LỬA',
        touch: 'Bấm TÊN LỬA: tên lửa bay vượt vật cản rồi bổ xuống nóc xe, nơi giáp mỏng nhất. Hạ chiếc xe tăng này.',
        pc: 'Phím Q bắn tên lửa: bay vượt vật cản rồi bổ xuống nóc xe, nơi giáp mỏng nhất. Hạ chiếc xe tăng này.',
        btn: 'misBtn',
        enter: () => { if (armour && !armour.dead) armour.hp = Math.min(armour.hp, 140); },
        done: () => !armour || armour.dead,
        goal: () => armour && !armour.dead ? [armour.x, armour.y] : null,
      },
      {
        title: 'THÙNG TIẾP TẾ', ring: true,
        touch: 'Thùng thả dù: xanh lá là kit sửa, vàng là nâng cấp. Lái lại gần, thùng tự hút vào xe.',
        pc: 'Thùng thả dù: xanh lá là kit sửa, vàng là nâng cấp. Lái lại gần, thùng tự hút vào xe.',
        enter: () => { this.target = null; base = h.tally(); h.dropCrate(T.crate[0], T.crate[1]); },
        done: () => h.tally().crates > base.crates,
        goal: () => T.crate,
      },
      {
        title: 'SỬA XE',
        touch: 'Xe vừa trúng đạn. Dừng hẳn lại rồi bấm SỬA XE. Đứng yên tới khi sửa xong, lái đi là hủy.',
        pc: 'Xe vừa trúng đạn. Dừng hẳn lại rồi bấm R. Đứng yên tới khi sửa xong, lái đi là hủy.',
        btn: 'repBtn',
        enter: () => { base = h.tally(); h.hurt(0.5); },
        done: () => h.tally().kitsUsed > base.kitsUsed,
        goal: () => null,
      },
      {
        title: 'GỌI A-10',
        touch: 'Hạ đủ 15 xe địch thì được gọi A-10, lần này cấp sẵn. Lại gần nhóm xe rồi bấm YỂM TRỢ. Vòng đỏ là chỗ bom rơi, xe nào sót thì bắn nốt.',
        pc: 'Hạ đủ 15 xe địch thì được gọi A-10, lần này cấp sẵn. Lại gần nhóm xe rồi bấm F. Vòng đỏ là chỗ bom rơi, xe nào sót thì bắn nốt.',
        btn: 'airBtn',
        enter: () => {
          const [gx, gy] = T.group, a = face(gx, gy);
          // packed tight, so one run takes the lot
          group = [h.spawn('tank', gx, gy, a, true), h.spawn('apc', gx + 34, gy - 16, a, true), h.spawn('technical', gx - 12, gy + 32, a, true)];
          this.target = group[0];
          h.charge();
        },
        done: () => group.every((u) => u.dead),
        goal: () => { const u = group.find((g) => !g.dead); return u ? [u.x, u.y] : null; },
      },
      {
        title: 'THỰC CHIẾN',
        touch: 'Một tổ địch thật ở làng phía đông, lần này chúng bắn trả. Dấu ! đỏ là lính tên lửa sắp bắn: né đi, súng máy trên xe tự diệt lính trong tầm.',
        pc: 'Một tổ địch thật ở làng phía đông, lần này chúng bắn trả. Dấu ! đỏ là lính tên lửa sắp bắn: né đi, súng máy trên xe tự diệt lính trong tầm.',
        enter: () => {
          this.target = null;
          const [vx, vy] = T.village;
          live = [h.spawn('apc', 1250, 434, Math.PI, false), h.spawn('technical', 1450, 390, Math.PI, false)];
          // a two-man rocket team in the houses nearest the track
          const homes = h.anchors.filter(([x, y]) => Math.hypot(x - vx, y - vy) < 160).sort((a, b) => a[0] - b[0]);
          const picked: [number, number][] = [];
          for (const a of homes) if (picked.length < 2 && picked.every(([x, y]) => Math.hypot(x - a[0], y - a[1]) > 50)) picked.push(a);
          for (const [x, y] of picked) live.push(h.spawn('infantry', x, y, 0, false));
        },
        done: () => live.every((u) => u.dead),
        goal: () => (Math.hypot(p.x - T.village[0], p.y - T.village[1]) > 380 ? T.village : null),
      },
    ];
    this.el.box.hidden = false;
    (document.getElementById('coachSkip') as HTMLElement).hidden = false;
    this.onTap = () => this.unfold(6);
    this.el.box.addEventListener('pointerdown', this.onTap);
    this.next();
  }

  private get step() { return this.steps[this.k]; }

  private next() {
    this.k++;
    if (this.k >= this.steps.length) {
      this.done = true; this.target = null; this.hilite(null);
      (document.getElementById('coachSkip') as HTMLElement).hidden = true;
      this.show('XONG', 'TỐT NGHIỆP TÂN BINH', 'Đủ kỹ năng ra chiến trường. Vào chiến dịch thôi.');
      return;
    }
    const s = this.step;
    s.enter();
    this.hilite(s.btn ?? null);
    this.show(`${this.k + 1}/${this.steps.length}`, s.title, this.h.coarse ? s.touch : s.pc);
  }

  private onTap: () => void;
  private unfold(t: number) { this.readT = t; this.el.box.classList.remove('mini'); }

  update(dt: number) {
    if (this.readT > 0 && (this.readT -= dt) <= 0) this.el.box.classList.add('mini');
    if (this.done) return;
    if (this.pause > 0) { if ((this.pause -= dt) <= 0) this.next(); return; }
    if (!this.step.done()) return;
    // a beat to see it worked before the next station
    sfx.play('stage_clear');
    this.hilite(null);
    this.show('✓', this.step.title, 'Đạt.');
    this.el.box.classList.add('ok');
    this.pause = 1.4;
  }

  /** where the objective arrow and the ground ring point; null when the station has no place */
  goal(): [number, number] | null { return this.done || this.pause > 0 ? null : this.step.goal(); }
  ring(): [number, number] | null { return this.done || this.pause > 0 || !this.step.ring ? null : this.step.goal(); }

  private show(step: string, title: string, text: string) {
    this.el.box.classList.remove('ok');
    this.el.step.textContent = step; this.el.title.textContent = title; this.el.text.textContent = text;
    this.unfold(4 + text.length * 0.05);
  }

  private hilite(id: Btn | null) {
    for (const b of document.querySelectorAll('#hud .coach-hi')) b.classList.remove('coach-hi');
    if (id) document.getElementById(id)?.classList.add('coach-hi');
  }

  destroy() {
    this.hilite(null);
    this.el.box.removeEventListener('pointerdown', this.onTap);
    this.el.box.hidden = true; this.el.box.classList.remove('ok', 'mini');
  }
}
