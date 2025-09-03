import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // EKLENMESİ GEREKEN EN ÖNEMLİ SATIR
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* TÜM UYGULAMAYI BrowserRouter İLE SARMALIYORUZ */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);