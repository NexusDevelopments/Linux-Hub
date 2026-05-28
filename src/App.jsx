import { useEffect, useMemo, useRef, useState } from 'react';
import { ensureProxyReady } from './proxy/registerProxy';
import { processInput, SEARCH_ENGINES } from './proxy/processUrl';

const detectDevice = () => {
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  if (/iphone|android.+mobile|windows phone|ipod/i.test(ua) || width < 768) {
    return 'mobile';
  }

  if (/ipad|tablet|android(?!.*mobile)|kindle/i.test(ua) || width < 1100) {
    return 'tablet';
  }

  return 'desktop';
};

const makeTab = (title = 'New Tab') => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title,
  url: '',
  reloadKey: 0,
});

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

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path
        d="M19 7v5h-5M5 17v-5h5m8.3-1.6A6.5 6.5 0 0 0 7 7.9M5.7 13.6A6.5 6.5 0 0 0 17 16.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
      <path d="m4 11 8-7 8 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 10v9h10v-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  const [device, setDevice] = useState(() => detectDevice());
  const [page, setPage] = useState(() => (window.location.pathname === '/algebra' ? 'browser' : 'home'));
  const [tabs, setTabs] = useState([makeTab('Start')]);
  const [activeTabId, setActiveTabId] = useState(null);
  const frameRef = useRef(null);

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

  useEffect(() => {
    if (!activeTabId && tabs.length > 0) {
      setActiveTabId(tabs[0].id);
    }
  }, [activeTabId, tabs]);

  useEffect(() => {
    const updateDevice = () => setDevice(detectDevice());
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  useEffect(() => {
    const onPop = () => setPage(window.location.pathname === '/algebra' ? 'browser' : 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const statusTone = useMemo(() => (isReady ? 'status status-ready' : 'status'), [isReady]);
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) || tabs[0], [tabs, activeTabId]);

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

      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === (activeTab?.id || activeTabId)
            ? {
                ...tab,
                title: value.slice(0, 24) || 'Tab',
                url: target,
                reloadKey: Date.now(),
              }
            : tab,
        ),
      );

      history.pushState({}, '', '/algebra');
      setPage('browser');
      setStatus('Loaded in embedded tab.');
      setIsSubmitting(false);
    } catch (error) {
      setStatus(error.message || 'Unable to open that request.');
      setIsSubmitting(false);
    }
  };

  const withFrame = (fn) => {
    const frameWindow = frameRef.current?.contentWindow;
    if (!frameWindow) {
      return;
    }

    try {
      fn(frameWindow);
    } catch {
      setStatus('Unable to control this page history right now.');
    }
  };

  const handleNewTab = () => {
    const freshTab = makeTab(`Tab ${tabs.length + 1}`);
    setTabs((current) => [...current, freshTab]);
    setActiveTabId(freshTab.id);
    setStatus('Opened a new tab.');
  };

  const handleCloseTab = (tabId) => {
    if (tabs.length === 1) {
      setTabs([makeTab('Start')]);
      setActiveTabId(null);
      return;
    }

    const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
    const nextTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(nextTabs);

    if (activeTabId === tabId) {
      const fallback = nextTabs[Math.max(0, tabIndex - 1)];
      setActiveTabId(fallback?.id || nextTabs[0].id);
    }
  };

  const handleHome = () => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => (tab.id === activeTab.id ? { ...tab, url: '', title: 'Start' } : tab)),
    );
    setQuery('');
    history.pushState({}, '', '/');
    setPage('home');
    setStatus('Returned to home.');
  };

  const handleRefresh = () => {
    if (!activeTab?.url) {
      return;
    }

    setTabs((currentTabs) =>
      currentTabs.map((tab) => (tab.id === activeTab.id ? { ...tab, reloadKey: Date.now() } : tab)),
    );
    withFrame((windowRef) => windowRef.location.reload());
  };

  const searchForm = (
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
  );

  return (
    <main className={`shell ${page === 'browser' ? 'browser-shell' : 'minimal-shell'} device-${device}`}>
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

      {page === 'home' ? (
        <section className="search-center" aria-label="Search">
          {searchForm}
          <p className={statusTone}>{status}</p>
        </section>
      ) : (
        <div className="browser-page">
          <div className="search-bar-slim">
            {searchForm}
            <p className={statusTone}>{status}</p>
          </div>

          <section className="browser-panel" aria-label="Embedded browser">
            <div className="tab-row">
              <div className="nav-controls">
                <button type="button" className="nav-btn" onClick={() => withFrame((w) => w.history.back())}>
                  <ArrowLeftIcon />
                </button>
                <button type="button" className="nav-btn" onClick={() => withFrame((w) => w.history.forward())}>
                  <ArrowRightIcon />
                </button>
                <button type="button" className="nav-btn" onClick={handleRefresh}>
                  <RefreshIcon />
                </button>
                <button type="button" className="nav-btn" onClick={handleHome}>
                  <HomeIcon />
                </button>
              </div>

              <div className="tabs-strip" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`tab-chip ${tab.id === activeTab.id ? 'tab-chip-active' : ''}`}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <span>{tab.title}</span>
                    <span
                      className="tab-close"
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          handleCloseTab(tab.id);
                        }
                      }}
                    >
                      x
                    </span>
                  </button>
                ))}

                <button type="button" className="tab-new" onClick={handleNewTab} aria-label="New tab">
                  +
                </button>
              </div>
            </div>

            <iframe
              ref={frameRef}
              key={`${activeTab.id}-${activeTab.reloadKey}`}
              src={activeTab.url || 'about:blank'}
              className="proxy-frame"
              title={activeTab.title || 'Linux Hub tab'}
              onLoad={() => setStatus('Page loaded in embedded view.')}
            />
          </section>
        </div>
      )}
    </main>
  );
}