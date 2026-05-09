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

  // Attach JWT token from localStorage
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
    } catch (e) { }
  }

  const response = await originalFetch(resource, config);

  // Handle 401 Unauthorized globally (Token expired or invalid)
  if (response.status === 401) {
    const isLoginEndpoint = typeof resource === 'string' && resource.includes('/login');
    if (!isLoginEndpoint && localStorage.getItem('user')) {
      localStorage.removeItem('user');
      window.location.href = '/'; // Force back to login
      alert('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
  }

  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
