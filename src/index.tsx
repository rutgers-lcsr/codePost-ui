import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import 'typeface-roboto';

import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './styles/index.scss';

ReactDOM.render((
    <BrowserRouter>
      <App />
    </BrowserRouter>
  ), document.getElementById('root') as HTMLElement
);
registerServiceWorker();
