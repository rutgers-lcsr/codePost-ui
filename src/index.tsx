import 'react-app-polyfill/ie9';
import 'react-app-polyfill/stable';

import * as React from 'react';

import './styles/main.scss';

import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
// This shows up here because of https://github.com/react-dnd/react-dnd/issues/186#issuecomment-462128478
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import 'typeface-lato';
import 'typeface-muli';
import 'typeface-pt-mono';

import * as serviceWorker from './serviceWorker';

// eslint-disable-next-line
import CPLayoutGrade from './components/core/CPLayoutGrade';

// eslint-disable-next-line
import CPLayoutAdmin from './components/core/CPLayoutAdmin';

import App from './App';

import ErrorBoundary from './components/core/ErrorBoundary';

ReactDOM.render(
  <ErrorBoundary type="app">
    <DndProvider backend={HTML5Backend}>
      <BrowserRouter>
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
