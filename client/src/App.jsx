import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    // Fetch backend API
    fetch('/api/get')
      .then(res => res.json())
      .then(data => setServerMessage(data.message))
      .catch(err => console.error('API Error:', err));
  }, []);

  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>Vite + React + Deploy</h1>

      <p>Backend message: {serverMessage}</p>

      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          count is {count}
        </button>
        <p>Edit <code>src/App.jsx</code> and save to test HMR</p>
      </div>
    </div>
  );
}

export default App;
