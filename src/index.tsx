import './styles/main.scss';

import { ConfigProvider } from 'antd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// eslint-disable-next-line

// eslint-disable-next-line

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
    codePost is currently experiencing technical difficulties and is unavailable. We're working hard to get it back
    online.
  </div>
);

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  <ErrorBoundary type="app">
    <ConfigProvider
      theme={{
        token: {
          fontFamily: 'Avenir Next, Lato, sans-serif',
          colorPrimary: '#24be85',
          colorLink: '#1890ff',
          colorSuccess: '#24be85',
          colorWarning: '#ffbf00',
          colorError: '#f64852',
          fontSize: 14,
          borderRadius: 4,
          colorTextHeading: 'rgba(0, 0, 0, 0.8)',
          colorText: 'rgba(0, 0, 0, 0.7)',
          colorTextSecondary: 'rgba(0, 0, 0, 0.5)',
        },
        components: {
          Layout: {
            siderBg: '#1b1b1b',
            triggerBg: '#0f0f0f',
            bodyBg: '#f2f2f2',
            headerBg: '#1b1b1b',
            headerHeight: 64,
            headerPadding: '0 61px',
          },
          Menu: {
            darkItemBg: '#1b1b1b',
            darkSubMenuItemBg: '#0f0f0f',
            darkItemSelectedBg: '#24be85',
            darkItemSelectedColor: '#fff',
            darkItemHoverBg: 'rgba(36, 190, 133, 0.2)',
            darkItemColor: 'rgba(255, 255, 255, 0.85)',
            itemHoverColor: '#24be85',
          },
          Typography: {
            linkDecoration: 'none',
            linkHoverDecoration: 'none',
          },
        },
      }}
    >
      <DndProvider backend={HTML5Backend}>
        <BrowserRouter>
          {maintenanceMode && maintenanceBanner}
          <App />
        </BrowserRouter>
      </DndProvider>
    </ConfigProvider>
  </ErrorBoundary>,
);
