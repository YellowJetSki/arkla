import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// NEW QoL: Import the PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register';

// Initialize the Service Worker for Offline Caching and Native Installation
const updateSW = registerSW({
  onNeedRefresh() {
    // If you deploy a new version of the app, this ensures players get the latest code
    if (confirm('A new update for the Campaign Companion is available! Reload to apply?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App is cached and ready to work offline.');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);