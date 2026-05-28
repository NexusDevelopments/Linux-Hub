import { useEffect } from 'react';
import { BareMuxConnection } from 'bare-mux-fork';
import { makecodec } from './of';

export default function useReg() {
  const ws =
    import.meta.env.VITE_WISP_URL ||
    `${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}/wisp/`;

  useEffect(() => {
    const init = async () => {
      if (!window.scr) {
        const script = document.createElement('script');
        script.src = '/eggs/scramjet.all.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { ScramjetController } = $scramjetLoadController();

      window.scr = new ScramjetController({
        prefix: '/ham/',
        files: {
          wasm: '/eggs/scramjet.wasm.wasm',
          all: '/eggs/scramjet.all.js',
          sync: '/eggs/scramjet.sync.js',
        },
        flags: { rewriterLogs: false, scramitize: false, cleanErrors: true, sourcemaps: true },
        codec: makecodec(),
      });

      window.scr.init();

      await navigator.serviceWorker.register('/s_sw.js', { scope: '/ham/' });

      const connection = new BareMuxConnection(new URL('/baremux/worker.js', location.origin).href);
      await connection.setTransport('/libcurl/index.mjs', [
        {
          wisp: ws,
        },
      ]);
    };

    init().catch((err) => {
      console.error('Proxy init failed:', err);
    });
  }, [ws]);
}
