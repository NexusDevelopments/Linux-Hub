import { mango } from './codec';

export const SEARCH_ENGINES = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  brave: 'https://search.brave.com/search?q=',
  startpage: 'https://www.startpage.com/sp/search?q=',
  google: 'https://www.google.com/search?q=',
};

const check = (input, engine) => {
  const trimmed = input.trim();

  if (!trimmed) {
    return '';
  }

  const isUrl =
    /^https?:\/\//i.test(trimmed) ||
    /^[\w-]+\.[\w.-]+/i.test(trimmed) ||
    trimmed.startsWith('localhost');

  if (isUrl) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  return `${engine}${encodeURIComponent(trimmed)}`;
};

export const process = (input, decode = false, searchEngine = 'duckduckgo') => {
  const prefix = '/ham/';

  if (decode) {
    const scramjetPart = input.split(prefix)[1];
    const decoded = scramjetPart ? mango.dnc(scramjetPart) : input;
    return decoded.endsWith('/') ? decoded.slice(0, -1) : decoded;
  }

  const engine = SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES.duckduckgo;
  const final = check(input, engine);

  if (!final || final.trim() === '') {
    return null;
  }

  return `${window.location.protocol}//${window.location.host}${prefix}${mango.enc(final)}`;
};

export const processInput = (input, searchEngine = 'duckduckgo') => process(input, false, searchEngine);
