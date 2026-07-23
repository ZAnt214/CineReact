import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import './index.css';

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isLandingPage = normalizedPath === '/landing';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isLandingPage ? <LandingPage /> : <App />}
  </StrictMode>,
);
