import { BareMuxConnection } from 'bare-mux-fork';
import { makeCodec } from './codec';

let proxyReadyPromise;

// SharedWorker is not available in Safari, mobile browsers, or private modes.
// Polyfill it so BareMuxConnection can still work using a regular Worker.
const ensureSharedWorker = () => {
  if (typeof SharedWorker !== 'undefined') {
    return;
  }

  window.SharedWorker = class FakeSharedWorker {
    constructor(url) {
      const worker = new Worker(url);
      this.port = {
        start() {},
        postMessage: (msg, transfer) => worker.postMessage(msg, transfer),
        addEventListener: (ev, fn) => worker.addEventListener(ev, fn),
        removeEventListener: (ev, fn) => worker.removeEventListener(ev, fn),
      };
      worker.onmessage = (e) => {
        this.port.onmessage?.(e);
      };
    }
  };
};

const getWispEndpoint = () => {
  const configured = import.meta.env.VITE_WISP_URL;

  if (configured) {
    return configured;
  }

  return `${window.location.protocol === 'http:' ? 'ws:' : 'wss:'}//${window.location.host}/wisp/`;
};

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

    ensureSharedWorker();

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

    // Toro V1 behavior: register scoped SW and proceed without waiting for controller on '/'.
    await navigator.serviceWorker.register('/s_sw.js', { scope: '/ham/' });

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