import React from 'react';

import ReactDOM from 'react-dom/client';

import './GlobalStyles.css';

import './index.css';

import App from './App';

import * as serviceWorkerRegistration from './serviceWorkerRegistration';



const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(

  <React.StrictMode>

    <App />

  </React.StrictMode>

);



// Temporarily unregister service worker to clear cache

serviceWorkerRegistration.unregister();

