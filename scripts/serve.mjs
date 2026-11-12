// 개발 서버(의존성 없음): 정적 파일을 내주고 .ts는 Node 내장 기능으로 타입만 지워서 JS로 보낸다.
// 학교 PC 보안 정책이 Vite(rollup)의 네이티브 모듈을 막아서 대신 쓴다.
//   node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { join, extname, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.argv[2] || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ts': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp4': 'video/mp4' };

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root) || file.includes('node_modules')) { res.writeHead(403).end(); return; }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    let body = await readFile(file);
    const ext = extname(file);
    if (ext === '.ts') body = stripTypeScriptTypes(body.toString('utf8'), { mode: 'strip' });
    res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain; charset=utf-8' }).end(String(e.message));
  }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}`));
