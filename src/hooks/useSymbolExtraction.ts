// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect, useRef } from 'react';
import { Parser, Query, QueryMatch, QueryCapture } from 'web-tree-sitter';
import { File as CodePostFile } from '../utils/file';
import { AssignmentFile } from '../api-client';

export type MonacoSuggestion = {
  label: string;
  kind: number;
  insertText: string;
  insertTextRules: number;
  documentation?: string;
  range?: any; // MonacoRange
  type?: string;
  origin?: string;
  definitionLine?: number;
};

export const useSymbolExtraction = (
  parser: Parser | null,
  language: string | undefined,
  targetFileName: string,
  contextFiles: AssignmentFile[] | undefined,
  testScriptCode?: string,
): React.MutableRefObject<MonacoSuggestion[]> => {
  const extractedSymbols = useRef<MonacoSuggestion[]>([]);

  useEffect(() => {
    const symbols: MonacoSuggestion[] = [];

    const addSymbol = (
      name: string,
      type: 'function' | 'class' | 'variable' | 'method' | 'field' | 'import',
      origin: string,
      definitionLine: number,
    ) => {
      if (!name || symbols.some((s) => s.label === name)) return;

      if (origin === 'current script' && (type === 'function' || type === 'method' || type === 'variable')) {
        if (name.toLowerCase().startsWith('test')) {
          return;
        }
      }

      let label = name;
      let kind = 1; // Function default
      let insertText = label;

      if (type === 'class') {
        kind = 5;
      } else if (type === 'variable' || type === 'field') {
        kind = 4;
      } else if (type === 'method' || type === 'function') {
        kind = type === 'method' ? 0 : 1;
        insertText = `${label}(\${1})`;
      } else if (type === 'import') {
        kind = 8;
        if (language === 'java') {
          const parts = label.split('.');
          label = parts[parts.length - 1];
          insertText = label;
        }
      }

      symbols.push({
        label,
        kind,
        insertText,
        insertTextRules: 4, // InsertAsSnippet
        type,
        documentation: `Defined in ${origin}`,
        origin,
        definitionLine,
      });
    };

    const lineNumberFromIndex = (code: string, index: number) => code.slice(0, index).split('\n').length;

    const extractWithRegexFallback = (code: string, origin: string) => {
      if (!language) return;

      const captureAll = (regex: RegExp, type: 'function' | 'class' | 'variable' | 'method' | 'field' | 'import') => {
        for (const match of code.matchAll(regex)) {
          const name = match[1];
          const index = match.index ?? 0;
          addSymbol(name, type, origin, lineNumberFromIndex(code, index));
        }
      };

      if (language === 'python') {
        captureAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm, 'function');
        captureAll(/^\s*class\s+([A-Za-z_]\w*)\b/gm, 'class');
        captureAll(/^\s*([A-Za-z_]\w*)\s*=\s*.+$/gm, 'variable');
      } else if (language === 'java') {
        captureAll(/\bclass\s+([A-Za-z_]\w*)\b/gm, 'class');
        captureAll(
          /\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>[\]]+\s+([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/gm,
          'method',
        );
        captureAll(/\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>[\]]+\s+([A-Za-z_]\w*)\s*(?:=|;)/gm, 'field');
      } else if (language === 'r') {
        captureAll(/^\s*([A-Za-z.][\w.]*)\s*(?:<-|=)\s*function\s*\(/gm, 'function');
        captureAll(/^\s*([A-Za-z.][\w.]*)\s*(?:<-|=)\s*.+$/gm, 'variable');
      }
    };

    // Helper function to extract symbols from a code string
    const extractFromCode = (code: string, origin: string) => {
      if (!language) return;

      if (!parser) {
        extractWithRegexFallback(code, origin);
        return;
      }

      let tree: any = null;
      try {
        tree = parser.parse(code);

        if (tree) {
          const treeSitterLanguage = parser.language;
          let queryStr = '';

          if (language === 'python') {
            queryStr = `
                (function_definition name: (identifier) @name) @function
                (class_definition name: (identifier) @name) @class
                (assignment left: (identifier) @name) @variable
                
                (import_statement name: (dotted_name) @name) @import
                (import_statement name: (aliased_import alias: (identifier) @name)) @import
                (import_from_statement name: (dotted_name) @name) @import
                (import_from_statement name: (aliased_import alias: (identifier) @name)) @import
            `;
          } else if (language === 'java') {
            queryStr = `
                (method_declaration name: (identifier) @name) @method
                (class_declaration name: (identifier) @name) @class
                (field_declaration declarator: (variable_declarator name: (identifier) @name)) @field
                (import_declaration name: (scoped_identifier) @name) @import
            `;
          } else if (language === 'r') {
            queryStr = `
                
                (binary_operator lhs: (identifier) @name operator: _ @op (#match? @op "^(<-|<<-|=)$") rhs: (function_definition)) @function
                (binary_operator lhs: (identifier) @name operator: _ @op (#match? @op "^(<-|<<-|=)$")) @variable
                
                (call function: (identifier) @func (#match? @func "^(library|require)$") arguments: (arguments (argument (identifier) @name))) @import
            `;
          }

          if (queryStr && treeSitterLanguage) {
            let query;
            try {
              query = new Query(treeSitterLanguage, queryStr);
              // Debugging found symbols
              // console.log(`[useSymbolExtraction] Parsing ${origin} (${language})`);
              const matches: QueryMatch[] = query.matches(tree.rootNode);

              matches.forEach((match: QueryMatch) => {
                const capture = match.captures.find((c: QueryCapture) => c.name === 'name');
                const typeCapture = match.captures.find((c: QueryCapture) => c.name !== 'name' && c.name !== 'op'); // @function, @class, etc.

                if (capture && typeCapture) {
                  const name = capture.node.text;
                  const type = typeCapture.name; // 'function', 'class', 'variable', 'method', 'field', 'import'
                  const startLine = capture.node.startPosition.row + 1;
                  addSymbol(
                    name,
                    type as 'function' | 'class' | 'variable' | 'method' | 'field' | 'import',
                    origin,
                    startLine,
                  );
                }
              });
            } finally {
              if (query) query.delete();
            }
          }
        }
      } catch (e) {
        console.error('Tree-sitter parsing failed:', e);
        extractWithRegexFallback(code, origin);
      } finally {
        if (tree) tree.delete();
      }
    };

    // 1. Extract from Target File
    const targetFile = contextFiles?.find((f) => f.name === targetFileName);
    if (targetFile && targetFile.data) {
      let code = targetFile.data;
      if (targetFileName.endsWith('.ipynb')) {
        code = CodePostFile.extractNotebookCode(code);
      }
      extractFromCode(code, targetFileName);
    }

    // 2. Extract from Test Script (if provided)
    if (testScriptCode) {
      extractFromCode(testScriptCode, 'current script');
    }

    extractedSymbols.current = symbols;
  }, [targetFileName, contextFiles, language, parser, testScriptCode]);

  return extractedSymbols;
};
