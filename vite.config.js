import { defineConfig, normalizePath } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { libcurlPath } from '@mercuryworkshop/libcurl-transport';
import { baremuxPath } from 'bare-mux-fork/node';
import { scramjetPath } from '@mercuryworkshop/scramjet/path';

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
  ],
});
