import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '/api';
const stackCards = [
  {
    icon: '⚛️',
    title: 'Frontend Web',
    description: 'React 19 + Vite web layer with responsive UI, environment-based API integration, and production-oriented delivery.',
  },
  {
    icon: '📱',
    title: 'Mobile / Cross-Platform',
    description: 'Expo + React Native application targeting iOS, Android, and web from one product direction and shared backend.',
  },
  {
    icon: '🟢',
    title: 'Backend API',
    description: 'Node.js + Express 5 REST API with layered modules, JWT auth, protected routes, validation, uploads, and error handling.',
  },
  {
    icon: '🗄️',
    title: 'Database Layer',
    description: 'MySQL with Sequelize models, associations, migrations, and structured domain modules for auth, posts, comments, follow, and account flows.',
  },
  {
    icon: '🧪',
    title: 'Quality & Security',
    description: 'Vitest + Supertest integration coverage, bcrypt password hashing, Helmet, CORS, request logging, and rate limiting.',
  },
  {
    icon: '🚀',
    title: 'Deployment',
    description: 'AWS EC2, Nginx, PM2, health endpoints, static asset serving, and web/mobile delivery prepared for production workflows.',
  },
];

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
          <span className="hero-badge">Fullstack Engineering Portfolio</span>
          <h1 className="hero-title">
            <span className="hero-title-line">Production-Ready</span>
            <span className="hero-title-line hero-title-accent">Fullstack Platform</span>
          </h1>
          <p className="hero-lead">
            End-to-end social platform architecture covering responsive web delivery, Expo mobile experience, Express API design,
            MySQL data modeling, authentication, media uploads, integration testing, and deployment infrastructure.
          </p>
          <p className="hero-attribution">Developed by Samvel Sarukhanyan</p>
        </header>

        <main className="main">
          <section className="section section-health">
            <div className="section-heading">
              <h2 className="section-title">Backend & Runtime Signal</h2>
              <p className="section-copy">
                This project includes production-facing health monitoring, API routing, static asset delivery, and infrastructure-aware
                runtime checks to support reliable deployment verification.
              </p>
            </div>

            <div className="health-card">
              <div className="health-card-top">
                <div className="health-summary">
                  <span className={`status-pill ${isHealthy ? 'status-pill-ok' : 'status-pill-fail'}`}>
                    {isHealthy ? 'Backend online' : 'Check required'}
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
                  {isChecking ? 'Checking…' : 'Run live check'}
                </button>
              </div>

              <div className="health-meta">
                <div className="meta-card">
                  <span className="meta-label">Health Endpoint</span>
                  <strong>{`${API_BASE_URL}/health`}</strong>
                </div>
                <div className="meta-card">
                  <span className="meta-label">Infrastructure</span>
                  <strong>Express API, PM2 process layer, Nginx-ready health routing</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="section section-features">
            <div className="section-heading">
              <h2 className="section-title">Project Stack & Architecture</h2>
              <p className="section-copy">
                The codebase is organized as a fullstack monorepo with separate client, server, and mobile applications, reflecting
                practical experience with modern frontend delivery, backend structure, database design, and deployment operations.
              </p>
            </div>

            <ul className="feature-grid">
              {stackCards.map((card) => (
                <li key={card.title} className="feature-card">
                  <span className="feature-icon">{card.icon}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="footer">
          <p>Built with React, Expo, Express, MySQL, Sequelize, Vitest, PM2, Nginx, and AWS deployment workflow.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
