// Checks the language files in src/lang/ on every build (npm run build) and on its own (npm run lang).
// Errors stop the build: a line with no "=", a key written twice, a key the game asks for that vi.txt
// lacks, a {placeholder} the game does not fill. Warnings only: keys nothing uses, keys a translation
// is missing (those fall back to Vietnamese).
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)), dir = `${root}src/lang/`;
const errors = [], warnings = [];

function parse(file) {
  const map = new Map();
  readFileSync(dir + file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    const s = line.trim();
    if (!s || s.startsWith('#')) return;
    const k = s.indexOf('=');
    if (k <= 0) { errors.push(`${file} dòng ${i + 1}: thiếu dấu "=" (dạng đúng: khoá = chữ): ${s.slice(0, 60)}`); return; }
    const key = s.slice(0, k).trim();
    if (!/^[\w.]+$/.test(key)) errors.push(`${file} dòng ${i + 1}: khoá "${key}" có ký tự lạ (chỉ chữ không dấu, số, dấu chấm)`);
    if (map.has(key)) errors.push(`${file} dòng ${i + 1}: khoá "${key}" bị lặp (đã có ở dòng ${map.get(key).line})`);
    map.set(key, { text: s.slice(k + 1).trim(), line: i + 1 });
  });
  return map;
}

// keys the code asks for by name: t('…') / tr('…') in src, data-t* in index.html
const used = new Set(), mentioned = new Set();
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}${e.name}/`) : [`${d}${e.name}`]));
for (const f of [...walk(`${root}src/`).filter((f) => f.endsWith('.ts')), `${root}index.html`]) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\btr?\(\s*'([\w.]*\w)'/g)) used.add(m[1]);
  for (const m of src.matchAll(/'([a-zA-Z]\w*(?:\.\w+)+)'/g)) mentioned.add(m[1]); // also t(a ? 'x.y' : 'x.z')
  for (const m of src.matchAll(/data-t(?:-aria|-title)?="([\w.]+)"/g)) used.add(m[1]);
}
// keys built from an id at run time (level.3.title, upg.mg.name…): counted as used by prefix
const DYNAMIC = ['level.', 'weather.', 'guide.crate.', 'guide.foe.', 'train.', 'upg.', 'ally.', 'weapon.', 'enemy.', 'class.', 'hit.', 'streak.', 'group.', 'intro.'];

const vi = parse('vi.txt');
for (const k of used) if (!vi.has(k)) errors.push(`vi.txt thiếu khoá "${k}" mà game cần`);
for (const k of vi.keys()) if (!used.has(k) && !mentioned.has(k) && !DYNAMIC.some((p) => k.startsWith(p))) warnings.push(`vi.txt: khoá "${k}" không chỗ nào dùng`);
const holes = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
for (const f of readdirSync(dir).filter((f) => f.endsWith('.txt') && f !== 'vi.txt')) {
  const other = parse(f);
  for (const [k, v] of vi) {
    if (!other.has(k)) warnings.push(`${f}: chưa dịch "${k}" (dùng tiếng Việt)`);
    else if (holes(other.get(k).text) !== holes(v.text)) errors.push(`${f} dòng ${other.get(k).line}: "${k}" phải có đúng các chỗ điền {${holes(v.text)}}`);
  }
  for (const k of other.keys()) if (!vi.has(k)) warnings.push(`${f}: khoá "${k}" không có trong vi.txt`);
}

for (const w of warnings) console.warn('  lưu ý: ' + w);
if (errors.length) { for (const e of errors) console.error('  LỖI: ' + e); console.error(`File chữ có ${errors.length} lỗi, sửa rồi build lại.`); process.exit(1); }
console.log(`File chữ ổn: ${vi.size} câu${warnings.length ? `, ${warnings.length} lưu ý` : ''}.`);
