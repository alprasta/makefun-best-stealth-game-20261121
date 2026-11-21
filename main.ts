// MOTHLIGHT — A Quiet Heist: the entry program for best-stealth-game-20261121-1759.
// It runs under Node 22 with only the standard library. Its job is small: take the
// game/ folder and the screenshots/ folder that sit next to this file, copy both
// into the output directory the grader reads, and write the dossier.json that
// describes them, using the vendored make.fun helper. The scorer's own limits
// are enforced up front so a bad bundle is refused here instead of at grading:
// at most 4 screenshots, each at most 256 KiB; at most 993 game files totalling
// at most 48 MiB, with no game path longer than 1000 bytes; the dossier text
// itself is capped at 160 KiB.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=/tmp/stealth-out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameSrc = join(repoRoot, 'game');
const shotsSrc = join(repoRoot, 'screenshots');

if (!existsSync(gameSrc)) throw new Error('game/ is missing next to main.ts');
if (!existsSync(shotsSrc)) throw new Error('screenshots/ is missing next to main.ts');

// Start from a clean output directory so a stale file can never ride along.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('wrote ' + outDir + '/dossier.json');
