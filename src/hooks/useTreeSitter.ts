import { useEffect, useState } from 'react';
import { Parser, Language } from 'web-tree-sitter';

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
          await Parser.init({
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

        const lang = await Language.load(langFile);

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
