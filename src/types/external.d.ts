// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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

// lowlight v3, installed under the `lowlight3` alias so it can coexist with the
// v1 `lowlight` that react-syntax-highlighter (code-review) depends on. Used only
// to give the TipTap CodeBlockLowlight extension a v3 highlighter instance.
declare module 'lowlight3' {
  type LowlightRoot = Record<string, unknown>;
  type Lowlight = {
    highlight: (language: string, value: string, options?: unknown) => LowlightRoot;
    highlightAuto: (value: string, options?: unknown) => LowlightRoot;
    listLanguages: () => string[];
    register: (grammars: Record<string, unknown>) => void;
    registered: (name: string) => boolean;
  };
  export function createLowlight(grammars?: Record<string, unknown>): Lowlight;
  export const common: Record<string, unknown>;
  export const all: Record<string, unknown>;
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
