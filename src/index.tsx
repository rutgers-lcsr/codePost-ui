// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import './styles/main.scss';

// One-time cleanup: remove legacy CommandBar localStorage keys left over from
// before the SDK was removed from the application.
Object.keys(localStorage)
  .filter((k) => k.startsWith('commandbar.'))
  .forEach((k) => localStorage.removeItem(k));

import { ConfigProvider } from 'antd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import MaintenanceBanner from './components/core/MaintenanceBanner';
import ReportIssueButton from './components/core/ReportIssueButton';

import { StrictMode } from 'react';
import ErrorBoundary from './components/core/ErrorBoundary';
import themeConfig from './theme';

// If True, show maintenance banner
// REMOVED: banner is now controlled at runtime via Django admin → /system/banner/

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <ErrorBoundary type="app">
    <ConfigProvider theme={themeConfig}>
      <DndProvider backend={HTML5Backend}>
        <BrowserRouter>
          <MaintenanceBanner />
          <StrictMode>
            <App />
          </StrictMode>
          <ReportIssueButton />
        </BrowserRouter>
      </DndProvider>
    </ConfigProvider>
  </ErrorBoundary>,
);
