import { useEffect, useMemo, useState } from 'react';
import { ensureProxyReady } from './proxy/registerProxy';
import { processInput, SEARCH_ENGINES } from './proxy/processUrl';

function LinuxPenguin() {
  return (
    <svg viewBox="0 0 160 160" className="penguin-mark" aria-hidden="true">
      <ellipse cx="80" cy="84" rx="42" ry="52" fill="#fff" />
      <ellipse cx="80" cy="82" rx="30" ry="39" fill="#000" />
      <ellipse cx="65" cy="66" rx="8" ry="10" fill="#fff" />
      <ellipse cx="95" cy="66" rx="8" ry="10" fill="#fff" />
      <circle cx="66" cy="68" r="3.5" fill="#000" />
      <circle cx="94" cy="68" r="3.5" fill="#000" />
      <path d="M80 78 94 87 80 95 66 87Z" fill="#fff" />
      <path d="M62 107c7 10 29 10 36 0" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="44" cy="87" rx="10" ry="25" fill="#000" transform="rotate(16 44 87)" />
      <ellipse cx="116" cy="87" rx="10" ry="25" fill="#000" transform="rotate(-16 116 87)" />
      <ellipse cx="66" cy="136" rx="10" ry="6" fill="#fff" transform="rotate(-12 66 136)" />
      <ellipse cx="94" cy="136" rx="10" ry="6" fill="#fff" transform="rotate(12 94 136)" />
      <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="4" strokeDasharray="5 8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Booting the proxy tunnel...');
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchEngine, setSearchEngine] = useState('duckduckgo');
  const [theme, setTheme] = useState('noir');

  useEffect(() => {
    let active = true;

    ensureProxyReady()
      .then(() => {
        if (!active) {
          return;
        }

        setIsReady(true);
        setStatus('Proxy ready. Search freely in Linux Hub.');
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setStatus(error.message || 'Proxy failed to start.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const statusTone = useMemo(() => (isReady ? 'status status-ready' : 'status'), [isReady]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const value = query.trim();
    if (!value) {
      return;
    }

    setIsSubmitting(true);
    setStatus('Opening your request through Linux Hub...');

    try {
      await ensureProxyReady();
      const target = processInput(value, searchEngine);

      if (!target) {
        throw new Error('Enter a URL or a search term.');
      }

      window.location.assign(target);
    } catch (error) {
      setStatus(error.message || 'Unable to open that request.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="shell">
      <div className="backdrop-grid" aria-hidden="true" />
      <section className="hero-card">
        <div className="brand-lockup">
          <LinuxPenguin />
          <div>
            <p className="eyebrow">Black and white proxy portal</p>
            <h1>Linux Hub</h1>
          </div>
        </div>

        <p className="hero-copy">
          A stripped-back landing page focused on one thing: getting you where you want to go.
        </p>

        <form className="search-shell" onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
            placeholder="Search freely in Linux Hub"
            autoComplete="off"
            spellCheck="false"
            aria-label="Search freely in Linux Hub"
          />
          <button className="search-button" type="submit" aria-label="Search" disabled={isSubmitting}>
            <SearchIcon />
          </button>
        </form>

        <div className="settings-row" aria-label="Search settings">
          <label className="settings-label" htmlFor="search-engine">
            Engine
          </label>
          <select
            id="search-engine"
            className="settings-select"
            value={searchEngine}
            onChange={(event) => setSearchEngine(event.target.value)}
          >
            {Object.keys(SEARCH_ENGINES).map((engine) => (
              <option key={engine} value={engine}>
                {engine}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === 'noir' ? 'paper' : 'noir'))}
            aria-label="Toggle black and white theme"
          >
            {theme === 'noir' ? 'White Mode' : 'Black Mode'}
          </button>
        </div>

        <p className={statusTone}>{status}</p>
      </section>
    </main>
  );
}