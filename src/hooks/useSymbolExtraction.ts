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

    // Helper function to extract symbols from a code string
    const extractFromCode = (code: string, origin: string) => {
      if (!parser || !language) return;

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
                  let name = capture.node.text;
                  const type = typeCapture.name; // 'function', 'class', 'variable', 'method', 'field', 'import'
                  const startLine = capture.node.startPosition.row;

                  // Filtering: Exclude test functions from the current script
                  if (
                    origin === 'current script' &&
                    (type === 'function' || type === 'method' || type === 'variable')
                  ) {
                    if (name.toLowerCase().startsWith('test')) {
                      return;
                    }
                  }

                  let kind = 1; // Function default
                  let insertText = name;

                  if (type === 'class') {
                    kind = 5; // Class
                    insertText = name;
                  } else if (type === 'variable' || type === 'field') {
                    kind = 4; // Variable
                    insertText = name;
                  } else if (type === 'method' || type === 'function') {
                    kind = type === 'method' ? 0 : 1; // Method vs Function
                    insertText = name + '(${1})';
                  } else if (type === 'import') {
                    kind = 8; // Module (approximate mapping)
                    if (language === 'java') {
                      // Extract class name from FQN (e.g., java.util.List -> List)
                      const parts = name.split('.');
                      name = parts[parts.length - 1];
                    }
                    insertText = name;
                  }

                  // Avoid duplicates
                  if (!symbols.some((s) => s.label === name)) {
                    symbols.push({
                      label: name,
                      kind,
                      insertText,
                      insertTextRules: 4, // InsertAsSnippet
                      type: type,
                      documentation: `Defined in ${origin}`,
                      origin,
                      definitionLine: startLine + 1, // 1-based line number
                    });
                  }
                }
              });
            } finally {
              if (query) query.delete();
            }
          }
        }
      } catch (e) {
        console.error('Tree-sitter parsing failed:', e);
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
