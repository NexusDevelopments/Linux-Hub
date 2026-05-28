import { BareMuxConnection } from 'bare-mux-fork';
import { makeCodec } from './codec';

let proxyReadyPromise;

const getWispEndpoint = () => {
  const configured = import.meta.env.VITE_WISP_URL;

  if (configured) {
    return configured;
  }

  return `${window.location.protocol === 'http:' ? 'ws:' : 'wss:'}//${window.location.host}/wisp/`;
};

const waitForController = () =>
  new Promise((resolve) => {
    if (navigator.serviceWorker.controller) {
      resolve();
      return;
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
  });

const loadScramjetController = async () => {
  if (window.$scramjetLoadController) {
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/eggs/scramjet.all.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load the proxy runtime.'));
    document.head.appendChild(script);
  });
};

export const ensureProxyReady = async () => {
  if (proxyReadyPromise) {
    return proxyReadyPromise;
  }

  proxyReadyPromise = (async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support service workers.');
    }

    await loadScramjetController();

    const { ScramjetController } = window.$scramjetLoadController();

    if (!window.scr) {
      window.scr = new ScramjetController({
        prefix: '/ham/',
        files: {
          wasm: '/eggs/scramjet.wasm.wasm',
          all: '/eggs/scramjet.all.js',
          sync: '/eggs/scramjet.sync.js',
        },
        flags: {
          cleanErrors: true,
          rewriterLogs: false,
          scramitize: false,
          sourcemaps: true,
        },
        codec: makeCodec(),
      });

      window.scr.init();
    }

    await navigator.serviceWorker.register('/s_sw.js', { scope: '/ham/' });
    await navigator.serviceWorker.ready;
    await waitForController();

    const connection = new BareMuxConnection(new URL('/baremux/worker.js', window.location.origin).href);

    await connection.setTransport('/libcurl/index.mjs', [
      {
        wisp: getWispEndpoint(),
      },
    ]);
  })().catch((error) => {
    proxyReadyPromise = null;
    throw error;
  });

  return proxyReadyPromise;
};