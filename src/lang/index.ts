/*
 * Every word the player reads comes from one text file per language in this folder: vi.txt now,
 * en.txt (or any other) later. One line per text, `key = text`; lines starting with # are notes.
 * `{name}` in a text is a value the game fills in (a number, a name). `?lang=en` picks a language;
 * a key missing there falls back to Vietnamese. scripts/lang-check.mjs checks the files on build.
 */

const FILES = import.meta.glob('./*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function parseLang(src: string) {
  const out = new Map<string, string>();
  for (const line of src.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const k = s.indexOf('=');
    if (k > 0) out.set(s.slice(0, k).trim(), s.slice(k + 1).trim());
  }
  return out;
}

const want = new URLSearchParams(location.search).get('lang') ?? 'vi';
const base = parseLang(FILES['./vi.txt'] ?? '');
const cur = FILES[`./${want}.txt`] ? parseLang(FILES[`./${want}.txt`]) : base;
export const lang = FILES[`./${want}.txt`] ? want : 'vi';

/** keys asked for but found in no file (shown as ⟨key⟩; the test suite fails on any) */
export const missing = new Set<string>();

/** the text for `key`, with {name} filled from `vars` */
export function t(key: string, vars?: Record<string, string | number>): string {
  let s = cur.get(key) ?? base.get(key);
  if (s === undefined) { missing.add(key); return `⟨${key}⟩`; }
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  return s;
}

/** fill the page's fixed texts: data-t (text), data-t-aria (aria-label), data-t-title (tooltip) */
export function applyTexts(root: ParentNode = document) {
  for (const el of root.querySelectorAll<HTMLElement>('[data-t]')) el.textContent = t(el.dataset.t!);
  for (const el of root.querySelectorAll<HTMLElement>('[data-t-aria]')) el.setAttribute('aria-label', t(el.dataset.tAria!));
  for (const el of root.querySelectorAll<HTMLElement>('[data-t-title]')) el.title = t(el.dataset.tTitle!);
  for (const el of root.querySelectorAll<HTMLElement>('[data-t-alt]')) el.setAttribute('alt', t(el.dataset.tAlt!));
  document.documentElement.lang = lang;
}
