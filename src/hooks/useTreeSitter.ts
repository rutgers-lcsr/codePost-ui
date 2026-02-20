import { useEffect, useState } from 'react';
import { Parser, Language } from 'web-tree-sitter';

// Polyfill for process in browser environment for web-tree-sitter compatibility
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = {
    versions: {
      node: '18.0.0',
    },
    env: {},
  };
}
// Initialize web-tree-sitter only once
let isInitialized = false;

const getTreeSitterAssetUrl = (fileName: string) => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBaseUrl}tree-sitter/${fileName}`;
};

export const useTreeSitter = (language: string | undefined) => {
  const [parser, setParser] = useState<Parser | null>(null);

  useEffect(() => {
    if (!language || !['python', 'java', 'r'].includes(language)) {
      setParser(null);
      return;
    }
    let mounted = true;
    let currentParser: Parser | null = null;
    const load = async () => {
      try {
        if (!isInitialized) {
          // Manual fetch for tree-sitter.wasm to bypass MIME type strictness
          let wasmBinary;
          try {
            const res = await fetch(getTreeSitterAssetUrl('tree-sitter.wasm'));
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              wasmBinary = new Uint8Array(buffer);
            } else {
              console.error('[useTreeSitter] Failed to fetch tree-sitter.wasm:', res.status);
            }
          } catch (e) {
            console.error('[useTreeSitter] Error fetching tree-sitter.wasm:', e);
          }
          await Parser.init({
            wasmBinary,
            locateFile: (scriptName: string) => {
              return getTreeSitterAssetUrl(scriptName);
            },
          });
          isInitialized = true;
        }
        if (!mounted) return;
        const p = new Parser();
        currentParser = p;
        const langFile =
          language === 'python'
            ? getTreeSitterAssetUrl('tree-sitter-python.wasm')
            : language === 'java'
              ? getTreeSitterAssetUrl('tree-sitter-java.wasm')
              : getTreeSitterAssetUrl('tree-sitter-r.wasm');

        // Manual fetch to handle MIME type issues or 404s
        const response = await fetch(langFile);
        if (!response.ok) {
          throw new Error(`Failed to fetch language file: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const arrayAuth = new Uint8Array(buffer);

        const lang = await Language.load(arrayAuth);

        if (!mounted) {
          p.delete();
          return;
        }

        p.setLanguage(lang);
        setParser(p);
      } catch (e) {
        console.error('Failed to initialize Tree-sitter:', e);
      }
    };

    load();

    return () => {
      mounted = false;
      if (currentParser) {
        currentParser.delete();
      }
    };
  }, [language]);

  return parser;
};
