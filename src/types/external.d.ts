declare module 'react-window' {
  export const FixedSizeList: any;
  export type FixedSizeListProps = any;
}

declare module 'turndown-plugin-gfm' {
  const plugin: any;
  export = plugin;
}

declare module 'remark-disable-tokenizers' {
  const remarkDisableTokenizers: any;
  export default remarkDisableTokenizers;
}

declare module 'react-router-hash-link' {
  import type { FC } from 'react';
  import type { NavLinkProps } from 'react-router-dom';
  export const HashLink: FC<NavLinkProps & { smooth?: boolean }>;
}

declare module 'react-player/lib/players/Wistia' {
  import type { ComponentType } from 'react';
  const WistiaPlayer: ComponentType<any>;
  export default WistiaPlayer;
}

declare module 'react-syntax-highlighter/dist/styles/hljs' {
  export const googlecode: any;
}

declare module 'lang-map' {
  const LangMap: {
    languages: (extension: string) => string[];
    extensions: (language: string) => string[];
  };
  export default LangMap;
}

declare module 'rollup-plugin-visualizer' {
  export function visualizer(options?: any): any;
}
