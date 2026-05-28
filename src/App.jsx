import { useEffect, useMemo, useRef, useState } from 'react';
import { OptionsProvider, useOptions } from './utils/optionsContext';
import { process } from './utils/hooks/loader/utils';
import useReg from './utils/hooks/loader/useReg';
import './index.css';

const SEARCH_ENGINES = {
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  brave: { name: 'Brave', url: 'https://search.brave.com/search?q=' },
  startpage: { name: 'Startpage', url: 'https://www.startpage.com/sp/search?q=' },
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
};

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

function LinuxHubShell() {
  const { options, updateOption } = useOptions();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Booting proxy runtime...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('noir');
  const [device, setDevice] = useState(() => detectDevice());
  const [page, setPage] = useState(() => (window.location.pathname === '/algebra' ? 'browser' : 'home'));
  const [tabs, setTabs] = useState([makeTab('Start')]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [engine, setEngine] = useState('duckduckgo');
  const frameRef = useRef(null);

  useReg();

  useEffect(() => {
    updateOption({ prType: 'scr' });
  }, [updateOption]);

  useEffect(() => {
    const currentEngine =
      Object.entries(SEARCH_ENGINES).find(([, val]) => val.url === options.engine)?.[0] || 'duckduckgo';
    setEngine(currentEngine);
    setStatus('Proxy ready. Search freely in Linux Hub.');
  }, [options.engine]);

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
      const chosenEngine = SEARCH_ENGINES[engine] || SEARCH_ENGINES.duckduckgo;
      const target = process(value, false, 'scr', chosenEngine.url);

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
    } catch (error) {
      setStatus(error.message || 'Unable to open that request.');
    } finally {
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

  const applyEngine = (value) => {
    const selected = SEARCH_ENGINES[value] || SEARCH_ENGINES.duckduckgo;
    setEngine(value);
    updateOption({ engineName: selected.name, engine: selected.url });
  };

  return (
    <main className={`shell ${page === 'browser' ? 'browser-shell' : 'minimal-shell'} device-${device}`}>
      <div className="backdrop-grid" aria-hidden="true" />

      <header className="top-bar">
        <a className="linux-logo" href="https://www.linux.org" target="_blank" rel="noreferrer" aria-label="Linux home">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg"
            alt="Linux"
            className="linux-logo-image"
          />
          <span className="linux-logo-text">Linux Hub</span>
        </a>

        <div className="settings-wrap">
          <button
            type="button"
            className="settings-trigger"
            onClick={() => setSettingsOpen((open) => !open)}
            aria-label="Open settings"
            aria-expanded={settingsOpen}
          >
            <span>⚙</span>
          </button>

          {settingsOpen && (
            <div className="settings-popover" aria-label="Search settings">
              <label className="settings-label" htmlFor="search-engine">
                Engine
              </label>
              <select
                id="search-engine"
                className="settings-select"
                value={engine}
                onChange={(event) => applyEngine(event.target.value)}
              >
                {Object.keys(SEARCH_ENGINES).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme((current) => (current === 'noir' ? 'paper' : 'noir'))}
              >
                {theme === 'noir' ? 'White Mode' : 'Black Mode'}
              </button>
            </div>
          )}
        </div>
      </header>

      {page === 'home' ? (
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
              Search
            </button>
          </form>
          <p className="status">{status}</p>
        </section>
      ) : (
        <div className="browser-page">
          <div className="search-bar-slim">
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
                Search
              </button>
            </form>
            <p className="status slim-status">{status}</p>
          </div>

          <section className="browser-panel" aria-label="Embedded browser">
            <div className="tab-row">
              <div className="nav-controls">
                <button type="button" className="nav-btn" onClick={() => withFrame((w) => w.history.back())}>
                  ←
                </button>
                <button type="button" className="nav-btn" onClick={() => withFrame((w) => w.history.forward())}>
                  →
                </button>
                <button type="button" className="nav-btn" onClick={handleRefresh}>
                  ↻
                </button>
                <button type="button" className="nav-btn" onClick={handleHome}>
                  ⌂
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

export default function App() {
  return (
    <OptionsProvider>
      <LinuxHubShell />
    </OptionsProvider>
  );
}
