// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
declare module 'react-window' {
  import type { ComponentType } from 'react';
  export const FixedSizeList: ComponentType<Record<string, unknown>>;
  export type FixedSizeListProps = Record<string, unknown>;
}

declare module 'turndown-plugin-gfm' {
  const plugin: unknown;
  export = plugin;
}

declare module 'remark-disable-tokenizers' {
  const remarkDisableTokenizers: unknown;
  export default remarkDisableTokenizers;
}

declare module 'react-router-hash-link' {
  import type { FC } from 'react';
  import type { NavLinkProps } from 'react-router-dom';
  export const HashLink: FC<NavLinkProps & { smooth?: boolean }>;
}

declare module 'react-player/lib/players/Wistia' {
  import type { ComponentType } from 'react';
  const WistiaPlayer: ComponentType<Record<string, unknown>>;
  export default WistiaPlayer;
}

declare module 'react-syntax-highlighter/dist/styles/hljs' {
  export const googlecode: Record<string, unknown>;
}

declare module 'lowlight' {
  const lowlight: {
    registerLanguage: (name: string, syntax: () => Record<string, unknown>) => void;
    highlight: (language: string, code: string) => Record<string, unknown>;
    highlightAuto: (code: string) => Record<string, unknown>;
    listLanguages: () => string[];
  };
  export default lowlight;
}

declare module 'lang-map' {
  const LangMap: {
    languages: (extension: string) => string[];
    extensions: (language: string) => string[];
  };
  export default LangMap;
}

declare module 'rollup-plugin-visualizer' {
  export function visualizer(options?: Record<string, unknown>): unknown;
}
