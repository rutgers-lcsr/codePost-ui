import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Grade from '../Grade';

describe('Grade', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Grade />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
