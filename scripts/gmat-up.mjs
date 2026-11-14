// `npm run dev` runs this first. It decides which GMAT service the dev server talks to and writes it to `.gmat-target` (read by vite.config.ts):
//   - Docker available: starts the local GMAT container (http://localhost:8787);
//   - otherwise (or if it cannot start): the shared cloud service from gmat-service.json, so nobody needs to set anything up.
// It never fails the dev server: if GMAT is unreachable the game simply uses its own numbers.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const LOCAL = 'smdg-gmat-base:r2025a', REMOTE = process.env.GMAT_BASE_REMOTE || 'ghcr.io/nasa-spaceapp-2026/smdg-gmat-base:r2025a';
const sh = (args, opts = {}) => spawnSync('docker', args, { stdio: opts.quiet ? 'ignore' : 'inherit' }).status === 0;
const log = m => console.log('[gmat] ' + m);
let cloud = ''; try { cloud = JSON.parse(readFileSync(new URL('../gmat-service.json', import.meta.url), 'utf8')).url || ''; } catch {}
const done = (local, why) => {
  const target = process.env.GMAT_URL && process.env.GMAT_URL !== 'off' ? process.env.GMAT_URL : local ? 'http://localhost:8787' : cloud;
  writeFileSync(new URL('../.gmat-target', import.meta.url), target);
  log(why + (target ? ' → GMAT at ' + target : ' → no GMAT service: the game uses its own numbers'));
  process.exit(0);
};

try { execFileSync('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'ignore' }); }
catch { done(false, 'Docker is not running'); }

if (!sh(['image', 'inspect', LOCAL], { quiet: true })) {
  log('pulling the prebuilt GMAT base image…');
  if (sh(['pull', '--platform', 'linux/amd64', REMOTE])) sh(['tag', REMOTE, LOCAL]);
  else { log('not published yet: building it locally (one-time ~420 MB download of NASA GMAT)…'); if (!sh(['build', '--platform', 'linux/amd64', '-f', 'docker/gmat/Dockerfile.base', '-t', LOCAL, '.'])) done(false, 'could not build the GMAT image'); }
}
if (!sh(['compose', 'up', '-d', '--build', 'gmat'])) done(false, 'could not start the local GMAT container');
else done(true, 'local GMAT container is up');
