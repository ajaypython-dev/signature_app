import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App1 from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode is good for dev, but can sometimes double-invoke effects. 
  // If you see double alerts, you can remove <React.StrictMode>
  <React.StrictMode>
    <App1 />
  </React.StrictMode>
);