import { defineConfig, normalizePath } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { logging, server as wisp } from '@mercuryworkshop/wisp-js/server';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';
import { baremuxPath } from 'bare-mux-fork/node';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';

logging.set_level(logging.NONE);

Object.assign(wisp.options, {
  dns_method: 'resolve',
  dns_servers: ['1.1.1.1', '1.0.0.1'],
  dns_result_order: 'ipv4first',
});

const routeWisp = (req, resOrSocket, head) => {
  if (!req.url?.startsWith('/wisp/')) {
    return false;
  }

  wisp.routeRequest(req, resOrSocket, head);
  return true;
};

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: [normalizePath(resolve(libcurlPath, '*'))], dest: 'libcurl' },
        { src: [normalizePath(resolve(baremuxPath, '*'))], dest: 'baremux' },
        { src: [normalizePath(resolve(scramjetPath, '*'))], dest: 'eggs' },
      ],
    }),
    {
      name: 'linux-hub-wisp',
      configureServer(server) {
        server.httpServer?.on('upgrade', (req, socket, head) => {
          if (!routeWisp(req, socket, head)) {
            socket.destroy();
          }
        });

        server.middlewares.use((req, res, next) => {
          if (!routeWisp(req, res)) {
            next();
          }
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});