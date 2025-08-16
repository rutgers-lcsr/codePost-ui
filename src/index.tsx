import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';

import * as React from 'react';

import './styles/main.scss';

import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
// This shows up here because of https://github.com/react-dnd/react-dnd/issues/186#issuecomment-462128478
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import * as serviceWorker from './serviceWorker';

// eslint-disable-next-line
import CPLayoutGrade from './components/core/CPLayoutGrade';

// eslint-disable-next-line
import CPLayoutAdmin from './components/core/CPLayoutAdmin';

import App from './App';

import ErrorBoundary from './components/core/ErrorBoundary';

// If True, show maintenance banner
const maintenanceMode = false;

const maintenanceBanner = (
  <div
    style={{
      background: '#22be84',
      padding: '10px',
      fontSize: '18px',
      fontWeight: 500,
      color: 'white',
      textAlign: 'center',
    }}
  >
    The codePost autograder test runner is currently experiencing technical difficulties. Some test runs may not
    complete. We're working hard to get it back working.
  </div>
);

ReactDOM.render(
  <ErrorBoundary type="app">
    <DndProvider backend={HTML5Backend}>
      <BrowserRouter>
        {maintenanceMode && maintenanceBanner}
        <App />
      </BrowserRouter>
    </DndProvider>
  </ErrorBoundary>,
  document.getElementById('root') as HTMLElement,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
