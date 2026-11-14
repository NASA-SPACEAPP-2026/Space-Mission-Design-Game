// `npm run dev` runs this first: makes sure the GMAT service container is up. Never fails the dev server:
// no Docker, no network or no GMAT simply means the game uses its own numbers.
import { execFileSync, spawnSync } from 'node:child_process';

const LOCAL = 'smdg-gmat-base:r2025a', REMOTE = process.env.GMAT_BASE_REMOTE || 'ghcr.io/nasa-spaceapp-2026/smdg-gmat-base:r2025a';
const sh = (args, opts = {}) => spawnSync('docker', args, { stdio: opts.quiet ? 'ignore' : 'inherit' }).status === 0;
const log = m => console.log('[gmat] ' + m);

try { execFileSync('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'ignore' }); }
catch { log('Docker is not running: the game will use its own numbers (start Docker Desktop for NASA GMAT).'); process.exit(0); }

if (!sh(['image', 'inspect', LOCAL], { quiet: true })) {
  log('pulling the prebuilt GMAT base image…');
  if (sh(['pull', '--platform', 'linux/amd64', REMOTE])) sh(['tag', REMOTE, LOCAL]);
  else { log('not published yet: building it locally (one-time ~420 MB download of NASA GMAT)…'); if (!sh(['build', '--platform', 'linux/amd64', '-f', 'docker/gmat/Dockerfile.base', '-t', LOCAL, '.'])) { log('could not build the GMAT image: using the game model.'); process.exit(0); } }
}
if (!sh(['compose', 'up', '-d', '--build', 'gmat'])) log('could not start the GMAT service: using the game model.');
else log('GMAT service on http://localhost:8787');
