// 배포용 빌드(의존성 없음): .ts의 타입만 지워 .js로 바꾸고 docs/에 모은다. GitHub Pages가 docs/를 그대로 내준다.
//   node scripts/build.mjs
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'docs');
await rm(out, { recursive: true, force: true });

const toJs = (code) => stripTypeScriptTypes(code, { mode: 'strip' })
  .replace(/(from\s+['"])(\.{1,2}\/[^'"]+)\.ts(['"])/g, '$1$2.js$3')
  .replace(/(import\s+['"])(\.{1,2}\/[^'"]+)\.ts(['"])/g, '$1$2.js$3');

for (const dir of ['lib', 'src']) {
  await mkdir(join(out, dir), { recursive: true });
  for (const name of await readdir(join(root, dir))) {
    if (!name.endsWith('.ts')) continue;
    await writeFile(join(out, dir, name.replace(/\.ts$/, '.js')), toJs(await readFile(join(root, dir, name), 'utf8')));
  }
}
const html = (await readFile(join(root, 'index.html'), 'utf8')).replace('./src/main.ts', './src/main.js');
await writeFile(join(out, 'index.html'), html);
await writeFile(join(out, '.nojekyll'), '');
console.log('built → docs/');
