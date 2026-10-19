// The itch.io upload: a build with the play-testing tools hidden (vite mode "itch"), zipped with
// index.html at the root as itch wants it. Output: tank2026-itch.zip in the project folder.
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)), run = (c, cwd = root) => execSync(c, { cwd, stdio: 'inherit' });
run('node scripts/audio-manifest.mjs && node scripts/lang-check.mjs && npx tsc --noEmit');
rmSync(`${root}dist-itch`, { recursive: true, force: true });
rmSync(`${root}tank2026-itch.zip`, { force: true });
run('npx vite build --mode itch --outDir dist-itch');
run('zip -qr -X ../tank2026-itch.zip .', `${root}dist-itch`);
console.log('itch.io: tank2026-itch.zip ready (upload as HTML, "This file will be played in the browser")');
