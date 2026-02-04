import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '/api';

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [isChecking, setIsChecking] = useState(false);

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
      <header className="hero">
        <span className="hero-badge">Fullstack Deploy</span>
        <h1 className="hero-title">
          <span className="hero-title-line">Modern</span>
          <span className="hero-title-line hero-title-accent">Deploy</span>
        </h1>
        <p className="hero-lead">
          React + Vite + Express, production-ready with health checks and CI/CD.
        </p>
      </header>

      <main className="main">
        <section className="section section-health">
          <h2 className="section-title">API Health Check</h2>
          <div className="health-card">
            <p className={`health-status ${apiStatus.includes('✅') ? 'health-ok' : 'health-fail'}`}>
              {apiStatus}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={checkApiHealth}
              disabled={isChecking}
            >
              {isChecking ? 'Checking…' : 'Refresh status'}
            </button>
          </div>
        </section>

        <section className="section section-features">
          <h2 className="section-title">Stack</h2>
          <ul className="feature-grid">
            <li className="feature-card">
              <span className="feature-icon">⚡</span>
              <h3>Vite</h3>
              <p>Fast dev &amp; build</p>
            </li>
            <li className="feature-card">
              <span className="feature-icon">⚛️</span>
              <h3>React</h3>
              <p>UI components</p>
            </li>
            <li className="feature-card">
              <span className="feature-icon">🟢</span>
              <h3>Node</h3>
              <p>Express API</p>
            </li>
            <li className="feature-card">
              <span className="feature-icon">🚀</span>
              <h3>Deploy</h3>
              <p>EC2, Nginx, PM2</p>
            </li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>Built for production · Health check enabled</p>
      </footer>
    </div>
  );
}

export default App;
