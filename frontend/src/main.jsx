import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept fetch to add localtunnel bypass header automatically
const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  config.headers['Bypass-Tunnel-Reminder'] = 'true';
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return originalFetch(resource, config);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
