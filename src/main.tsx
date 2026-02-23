/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// IMPORTAÇÃO NOVA PARA O PWA
import { registerSW } from 'virtual:pwa-register';

// Lógica para atualizar o app caso você lance uma versão nova no futuro
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão do Alumni ReGISS disponível. Deseja atualizar?')) {
      updateSW(true);
    }
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);