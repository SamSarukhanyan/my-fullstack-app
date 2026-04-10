import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '/api';

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [isChecking, setIsChecking] = useState(false);
  const isHealthy = apiStatus.includes('✅');

  const checkApiHealth = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setApiStatus('✅ API is running');
      } else {
        setApiStatus(`❌ API is not healthy (${response.status})`);
      }
    } catch (error) {
      setApiStatus('❌ Failed to reach API');
    }
    setIsChecking(false);
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div className="page">
      <div className="page-shell">
        <header className="hero">
          <span className="hero-badge">Fullstack Deploy</span>
          <h1 className="hero-title">
            <span className="hero-title-line">Web Delivery</span>
            <span className="hero-title-line hero-title-accent">Deploy</span>
          </h1>
          <p className="hero-lead">
            Responsive deployment overview for your web client with readable health status and a polished production UI.
          </p>
        </header>

        <main className="main">
          <section className="section section-health">
            <div className="section-heading">
              <h2 className="section-title">API Health Check</h2>
              <p className="section-copy">
                The layout stays centered, fluid, and readable while the API status remains easy to scan on any screen size.
              </p>
            </div>

            <div className="health-card">
              <div className="health-card-top">
                <div className="health-summary">
                  <span className={`status-pill ${isHealthy ? 'status-pill-ok' : 'status-pill-fail'}`}>
                    {isHealthy ? 'Operational' : 'Needs attention'}
                  </span>
                  <p className={`health-status ${isHealthy ? 'health-ok' : 'health-fail'}`}>
                    {apiStatus}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={checkApiHealth}
                  disabled={isChecking}
                >
                  {isChecking ? 'Checking…' : 'Refresh status'}
                </button>
              </div>

              <div className="health-meta">
                <div className="meta-card">
                  <span className="meta-label">Endpoint</span>
                  <strong>{`${API_BASE_URL}/health`}</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">State</span>
                  <strong>{isChecking ? 'Refreshing' : 'Latest result'}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="section section-features">
            <div className="section-heading">
              <h2 className="section-title">Stack</h2>
              <p className="section-copy">
                Core delivery pieces are arranged in a flexible grid that reflows cleanly without breaking spacing or alignment.
              </p>
            </div>

            <ul className="feature-grid">
              <li className="feature-card">
                <span className="feature-icon">⚡</span>
                <h3>Vite</h3>
                <p>Fast dev and build pipeline</p>
              </li>
              <li className="feature-card">
                <span className="feature-icon">⚛️</span>
                <h3>React</h3>
                <p>Composable frontend UI</p>
              </li>
              <li className="feature-card">
                <span className="feature-icon">🟢</span>
                <h3>Node</h3>
                <p>Express API backend</p>
              </li>
              <li className="feature-card">
                <span className="feature-icon">🚀</span>
                <h3>Deploy</h3>
                <p>EC2, Nginx and PM2 flow</p>
              </li>
            </ul>
          </section>
        </main>

        <footer className="footer">
          <p>Built for production · Health check enabled</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
