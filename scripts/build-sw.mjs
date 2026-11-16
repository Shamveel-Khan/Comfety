import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const assets = (await readdir('dist/assets')).filter(name => /\.(js|css)$/.test(name)).map(name => '/assets/' + name);
const template = await readFile('public/sw.js','utf8');
const hash = createHash('sha256').update(await readFile('dist/index.html')).update(template).digest('hex').slice(0,12);
await writeFile('dist/sw.js', template.replace('comfety-shell-v1','comfety-shell-' + hash).replace("'/icon-512.png']))", "'/icon-512.png'," + assets.map(asset=>JSON.stringify(asset)).join(',') + ']))'));
