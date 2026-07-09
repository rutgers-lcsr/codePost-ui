// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import Editor from '@monaco-editor/react';
import { useTreeSitter } from '../../../hooks/useTreeSitter';
import { useSymbolExtraction } from '../../../hooks/useSymbolExtraction';
import { monacoLang } from './questionMeta';

interface IProps {
  value: string;
  onChange?: (value: string) => void;
  /** Environment.language value (e.g. 'python-3'); drives highlighting + Tree-sitter. */
  language?: string | null;
  height?: number;
  readOnly?: boolean;
}

type MonacoDisposable = { dispose: () => void };
type MonacoModel = {
  getWordUntilPosition: (position: unknown) => { startColumn: number; endColumn: number };
};
type MonacoPosition = { lineNumber: number; column: number };
type MonacoApi = {
  languages: {
    registerCompletionItemProvider: (
      language: string,
      provider: {
        provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => { suggestions: unknown[] };
      },
    ) => MonacoDisposable;
  };
};

/**
 * Monaco editor for quiz code questions with Tree-sitter-powered completions: symbols
 * (functions/classes/variables) are parsed out of the code being edited (WASM Tree-sitter
 * for python/java/r, regex fallback elsewhere) and offered as completions — the same
 * infrastructure the test-script editor uses (useTreeSitter + useSymbolExtraction).
 */
const CodeQuestionEditor: React.FC<IProps> = ({ value, onChange, language, height = 160, readOnly }) => {
  const monaco = monacoLang(language);
  const treeSitterLang = ['python', 'java', 'r'].includes(monaco) ? monaco : undefined;
  const parser = useTreeSitter(treeSitterLang);

  // Debounce re-parsing while typing.
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), 500);
    return () => clearTimeout(t);
  }, [value]);

  const extractedSymbols = useSymbolExtraction(parser, treeSitterLang, 'question', undefined, debouncedValue);

  const providerRef = React.useRef<MonacoDisposable | null>(null);
  React.useEffect(() => () => providerRef.current?.dispose(), []);

  const handleMount = (_editor: unknown, monacoInstance: unknown) => {
    providerRef.current?.dispose();
    const api = monacoInstance as MonacoApi;
    providerRef.current = api.languages.registerCompletionItemProvider(monaco, {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: word.endColumn,
        };
        return { suggestions: extractedSymbols.current.map((s) => ({ ...s, range })) };
      },
    });
  };

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <Editor
        height={`${height}px`}
        language={monaco}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        onMount={handleMount}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 13, padding: { top: 8 }, readOnly }}
      />
    </div>
  );
};

export default CodeQuestionEditor;
