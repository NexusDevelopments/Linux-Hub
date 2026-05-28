import { mango } from './codec';

export const SEARCH_ENGINES = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  brave: 'https://search.brave.com/search?q=',
  startpage: 'https://www.startpage.com/do/search?q=',
};

const normalizeInput = (input, searchEngine) => {
  const trimmed = input.trim();

  if (!trimmed) {
    return '';
  }

  const looksLikeUrl =
    /^https?:\/\//i.test(trimmed) ||
    /^[\w-]+\.[\w.-]+/i.test(trimmed) ||
    trimmed.startsWith('localhost');

  if (looksLikeUrl) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  const selectedEngine = SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES.duckduckgo;
  return `${selectedEngine}${encodeURIComponent(trimmed)}`;
};

export const processInput = (input, searchEngine = 'duckduckgo') => {
  const finalUrl = normalizeInput(input, searchEngine);

  if (!finalUrl) {
    return null;
  }

  return `${window.location.origin}/ham/${mango.enc(finalUrl)}`;
};