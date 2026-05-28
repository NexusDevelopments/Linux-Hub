import { useEffect, useMemo, useState } from 'react';
import { ensureProxyReady } from './proxy/registerProxy';
import { processInput, SEARCH_ENGINES } from './proxy/processUrl';

function LinuxLogo() {
  return (
    <a className="linux-logo" href="https://www.linux.org" target="_blank" rel="noreferrer" aria-label="Linux home">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg"
        alt="Linux"
        className="linux-logo-image"
      />
      <span className="linux-logo-text">Linux Hub</span>
    </a>
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="settings-icon">
      <path
        d="M19.4 13a7.9 7.9 0 0 0 .04-2l2.06-1.6-2-3.46-2.5 1a7.95 7.95 0 0 0-1.73-1l-.38-2.65h-4l-.38 2.65a7.95 7.95 0 0 0-1.73 1l-2.5-1-2 3.46L4.56 11a7.9 7.9 0 0 0 .04 2l-2.06 1.6 2 3.46 2.5-1a7.95 7.95 0 0 0 1.73 1l.38 2.65h4l.38-2.65a7.95 7.95 0 0 0 1.73-1l2.5 1 2-3.46Zm-7.4 2.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4Z"
        fill="currentColor"
      />
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
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    <main className="shell minimal-shell">
      <div className="backdrop-grid" aria-hidden="true" />
      <header className="top-bar">
        <LinuxLogo />

        <div className="settings-wrap">
          <button
            type="button"
            className="settings-trigger"
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label="Open settings"
            aria-expanded={settingsOpen}
          >
            <SettingsIcon />
          </button>

          {settingsOpen && (
            <div className="settings-popover" aria-label="Search settings">
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
          )}
        </div>
      </header>

      <section className="search-center" aria-label="Search">
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
        <p className={statusTone}>{status}</p>
      </section>
    </main>
  );
}