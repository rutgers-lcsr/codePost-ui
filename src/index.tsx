import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'typeface-muli';

import App from './App';
import unregister from './registerServiceWorker';
import './styles/main.scss';

import ErrorBoundary from './ErrorBoundary';

ReactDOM.render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
  document.getElementById('root') as HTMLElement,
);
unregister(); // remove any existing service workers
