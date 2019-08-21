import 'babel-polyfill';

import 'react-app-polyfill/ie9';

import 'react-app-polyfill/ie11';

import 'react-app-polyfill/stable';

import * as React from 'react';

// @ts-ignore
import { Badge, Button, Dropdown, Icon, Input, InputNumber, Layout, Menu, Popover, Table, Tooltip } from 'antd';

import './styles/main.scss';

import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import 'typeface-lato';
import 'typeface-muli';
import 'typeface-pt-mono';

// @ts-ignore
import CPLayoutGrade from './components/core/CPLayoutGrade';

// @ts-ignore
import CPLayoutAdmin from './components/core/CPLayoutAdmin';

import App from './App';
import { unregister } from './registerServiceWorker';

import ErrorBoundary from './components/core/ErrorBoundary';

ReactDOM.render(
  <ErrorBoundary type="app">
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
  document.getElementById('root') as HTMLElement,
);
unregister(); // remove any existing service workers
