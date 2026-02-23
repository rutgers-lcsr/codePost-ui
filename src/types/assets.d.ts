// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// declare module '*';

// declare module 'react-dom';
// declare module 'react-markdown';
// declare module 'react-router-dom';
// declare module 'react-select';
// declare module 'react-tabs';
// declare module 'reactable';
// declare module 'node-sass';
// declare module 'sass-loader';
// declare module 'pluralize';
// declare module 'react-syntax-highlighter';
// declare module 'react-syntax-highlighter/dist/styles/hljs';
// declare module 'react-textarea-autosize';
// declare module 'enzyme';
// declare module 'lang-map';
// declare module 'turndown';
// declare module 'turndown-plugin-gfm';
// declare module 'react-beautiful-dnd';
// declare module 'react-tooltip';
// declare module 'storybook';
// declare module '@storybook/react';
// declare module '@storybook/addon-actions';
// declare module '@storybook/addon-links';
// declare module '@storybook/react/demo';
// declare module '@storybook/addon-knobs';
// declare module 'react-highlight-words';
// declare module 'react-toggle-button';
// declare module 'react-addons-css-transition-group';
// declare module 'remark-disable-tokenizers';
// declare module 'rc-slider';

// declare module '*.scss' {
//   const content: { [className: string]: string };
//   export = content;
// }

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}
