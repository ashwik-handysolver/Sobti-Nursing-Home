import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthGate } from './AuthGate';
import './index.css';

// Earlier versions could keep a Gemini key in the browser; the key now lives only on the server
try {
  localStorage.removeItem('meetmind_gemini_key_v1');
} catch {}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);
