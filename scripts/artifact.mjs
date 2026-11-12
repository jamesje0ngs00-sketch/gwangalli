// Claude 아티팩트용 한 파일 페이지: esbuild-wasm으로 코드를 하나로 묶어 page.html 안에 넣는다.
// (아티팩트에서는 따로 올린 모듈 파일을 불러오지 못해 빈 화면이 됐다)
//   node scripts/artifact.mjs  →  artifact/gwangalli.html
import { build } from 'esbuild-wasm';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const res = await build({ entryPoints: [join(root, 'src/main.ts')], bundle: true, format: 'iife', minify: true, target: 'es2020', write: false });
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\/script');
const page = (await readFile(join(root, 'artifact/page.html'), 'utf8')).replace('/*BUNDLE*/', () => js);
await writeFile(join(root, 'artifact/gwangalli.html'), page);
console.log(`artifact/gwangalli.html (${(page.length / 1024).toFixed(1)} KB)`);
