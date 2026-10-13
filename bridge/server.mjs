import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';

const DEFAULT_PORT = 8787;
const MAX_BYTES = 25 * 1024 * 1024;

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function lanAddresses() {
  const result = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const item of entries ?? []) {
      if (item.family === 'IPv4' && !item.internal) result.push(item.address);
    }
  }
  return [...new Set(result)];
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const fileArg = args.find((item) => !item.startsWith('--'));
  const portArg = args.find((item) => item.startsWith('--port='));
  const port = portArg ? Number(portArg.split('=')[1]) : DEFAULT_PORT;
  if (!fileArg) throw new Error('MIDIファイルを指定してください。例: npm run bridge -- "C:\\Exports\\song.mid"');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('portは1024〜65535で指定してください。');
  return { filePath: path.resolve(fileArg), port };
}

async function loadMidi(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.mid', '.midi'].includes(ext)) throw new Error('.mid / .midi ファイルだけを指定してください。');
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error('指定Pathはファイルではありません。');
  if (info.size <= 0 || info.size > MAX_BYTES) throw new Error(`MIDIサイズは1 byte〜${MAX_BYTES / 1024 / 1024} MBまでです。`);
  return { bytes: await readFile(filePath), name: path.basename(filePath), size: info.size };
}

function pageHtml(name, size) {
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RipX Bridge</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f6f7f8;color:#202124}.card{max-width:560px;margin:auto;background:white;border:1px solid #ddd;border-radius:16px;padding:20px}.button{display:block;padding:14px;margin:12px 0;border-radius:12px;text-align:center;text-decoration:none;background:#202124;color:white;font-weight:700}.secondary{background:#fff;color:#202124;border:1px solid #bbb}small{color:#5f6368}</style><main class="card"><h1>RipX Bridge</h1><p><strong>${escapeHtml(name)}</strong></p><p><small>${Math.round(size / 1024)} KB · PCからこの端末へ転送</small></p><a class="button" href="/latest.mid" download="${escapeHtml(name)}">MIDIをダウンロード</a><a class="button secondary" href="https://tamurayuuki46-cpu.github.io/midi-analyzer/">MIDI Analyzerを開く</a><p><small>同じWi-Fi / LAN上の端末だけで使う開発用Prototypeです。Bridgeは選択したMIDI以外を公開しません。</small></p></main></html>`;
}

async function main() {
  const { filePath, port } = parseArgs(process.argv);
  const midi = await loadMidi(filePath);
  const server = http.createServer((req, res) => {
    if (req.url === '/latest.mid') {
      res.writeHead(200, {
        'Content-Type': 'audio/midi',
        'Content-Length': midi.bytes.length,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(midi.name)}`,
        'Cache-Control': 'no-store',
      });
      res.end(midi.bytes);
      return;
    }
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(pageHtml(midi.name, midi.size));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`RipX Bridge: ${midi.name}`);
    const addresses = lanAddresses();
    if (!addresses.length) console.log(`Open on this PC: http://127.0.0.1:${port}`);
    for (const address of addresses) console.log(`Open on Android: http://${address}:${port}`);
    console.log('Stop: Ctrl+C');
  });
}

main().catch((error) => {
  console.error(`RipX Bridge error: ${error.message}`);
  process.exitCode = 1;
});
