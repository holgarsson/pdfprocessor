import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LocaleProvider } from './context/LocaleContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>
);
