// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import './styles/main.scss';

import { ConfigProvider } from 'antd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

import { StrictMode } from 'react';
import ErrorBoundary from './components/core/ErrorBoundary';
import themeConfig from './theme';

// If True, show maintenance banner
const maintenanceMode = false;

const maintenanceBanner = (
  <div
    style={{
      background: '#0e704cff',
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

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <ErrorBoundary type="app">
    <ConfigProvider theme={themeConfig}>
      <DndProvider backend={HTML5Backend}>
        <BrowserRouter>
          {maintenanceMode && maintenanceBanner}
          <StrictMode>
            <App />
          </StrictMode>
        </BrowserRouter>
      </DndProvider>
    </ConfigProvider>
  </ErrorBoundary>,
);
