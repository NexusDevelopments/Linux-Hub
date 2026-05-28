import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logging, server as wisp } from '@mercuryworkshop/wisp-js/server';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, 'dist');
const port = Number(process.env.PORT) || 3000;

if (!existsSync(distDir)) {
  console.error('Build output not found. Run npm run build before npm start.');
  process.exit(1);
}

logging.set_level(logging.NONE);

Object.assign(wisp.options, {
  dns_method: 'resolve',
  dns_servers: ['1.1.1.1', '1.0.0.1'],
  dns_result_order: 'ipv4first',
});

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

const getSafePath = (requestUrl) => {
  const url = new URL(requestUrl || '/', 'http://localhost');
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const normalizedPath = normalize(join(distDir, decodeURIComponent(requestedPath)));

  if (!normalizedPath.startsWith(distDir)) {
    return null;
  }

  return normalizedPath;
};

const sendFile = async (req, res) => {
  const requestedFile = getSafePath(req.url);

  if (!requestedFile) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  let filePath = requestedFile;
  let fileInfo = await stat(filePath).catch(() => null);

  if (!fileInfo?.isFile()) {
    const pathname = new URL(req.url || '/', 'http://localhost').pathname;
    const hasExtension = extname(pathname) !== '';

    if (hasExtension) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    filePath = join(distDir, 'index.html');
    fileInfo = await stat(filePath).catch(() => null);
  }

  if (!fileInfo?.isFile()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'content-length': fileInfo.size,
    'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream',
  });

  createReadStream(filePath).pipe(res);
};

const server = createServer((req, res) => {
  if (req.url?.startsWith('/wisp/')) {
    wisp.routeRequest(req, res);
    return;
  }

  sendFile(req, res).catch((error) => {
    console.error('Static file error:', error);
    res.writeHead(500);
    res.end('Internal server error');
  });
});

server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/wisp/')) {
    wisp.routeRequest(req, socket, head);
    return;
  }

  socket.destroy();
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Linux Hub is listening on http://0.0.0.0:${port}`);
});