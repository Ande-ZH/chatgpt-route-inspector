import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import archiver from 'archiver';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(root, 'release');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = packageJson.version;
const targetBrowser = process.argv[2] === 'firefox' ? 'firefox' : 'extension';
await mkdir(releaseDir, { recursive: true });
execFileSync(process.execPath, [path.join(root, 'scripts', 'build.mjs'), targetBrowser], { cwd: root, stdio: 'inherit' });

async function zipDirectory(source, target) {
  await new Promise((resolve, reject) => {
    const output = createWriteStream(target);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(source, false);
    void archive.finalize();
  });
}

const name = `chatgpt-route-inspector-${version}${targetBrowser === 'firefox' ? '-firefox' : ''}.zip`;
const target = path.join(releaseDir, name);
await zipDirectory(path.join(root, 'dist', targetBrowser), target);
const hash = createHash('sha256').update(await readFile(target)).digest('hex');
const sumsPath = path.join(releaseDir, 'SHA256SUMS.txt');
let sums = '';
try { sums = await readFile(sumsPath, 'utf8'); } catch { /* First package. */ }
const lines = sums.split('\n').filter((line) => line && !line.endsWith(`  ${name}`));
lines.push(`${hash}  ${name}`);
await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8');
process.stdout.write(`Packaged releases in ${releaseDir}\n`);
