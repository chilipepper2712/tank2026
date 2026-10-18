// Lists the sound files in public/audio so the game loads exactly what exists (no 404 probing).
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = new URL('../public/audio/', import.meta.url);
mkdirSync(dir, { recursive: true });
const files = readdirSync(dir).filter((f) => /\.(mp3|wav|m4a|ogg)$/i.test(f)).sort();
writeFileSync(new URL('manifest.json', dir), JSON.stringify(files, null, 1) + '\n');
console.log(`audio manifest: ${files.length} file(s)`);
