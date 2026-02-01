import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || '/api';

function App() {
  const [count, setCount] = useState(0);
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [isChecking, setIsChecking] = useState(false);

  console.log('API Base URL:', API_BASE_URL);

  const checkApiHealth = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setApiStatus('✅ API is running');
      } else {
        setApiStatus('❌ API is not healthy');
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
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <div className="card">
        <h3>API Health Check</h3>
        <p>{apiStatus}</p>
        <button onClick={checkApiHealth} disabled={isChecking}>
          {isChecking ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </>
  );
}

export default App;