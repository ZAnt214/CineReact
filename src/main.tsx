import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import './index.css';
import { initVisualPreferences } from './utils/visualPreferences.ts';

initVisualPreferences();

// Prevent unhandled fetch rejections from breaking runtime
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (event.reason.name === 'TypeError' || String(event.reason).includes('Failed to fetch'))) {
    event.preventDefault();
    console.warn('Capturado erro de rede temporário:', event.reason);
  }
});

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isLandingPage = normalizedPath === '/landing';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isLandingPage ? <LandingPage /> : <App />}
  </StrictMode>,
);
