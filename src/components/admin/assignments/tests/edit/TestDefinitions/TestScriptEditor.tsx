import { useState, useEffect, useRef } from 'react';
import { Button, Modal, Alert, Radio, Tooltip } from 'antd';
import {
  ThunderboltOutlined,
  AppstoreOutlined,
  CodeOutlined,
  LayoutOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons';
import { CodeWindow } from '../utils/CodeWindow';
import { extensionsByLanguage } from '../utils/languageUtils';
import { TestScriptCardView } from './TestScriptCardView';
import { TestScriptPreview } from './TestScriptPreview';
import SplitScreen from '../../../../../../components/utils/SplitScreen';
import { RubricCategory, RubricComment } from '../../../../../../api-client';
import { assignmentsApi } from '../../../../../../api-client/clients';
import { AssignmentFileType } from '../../../../../../types/models';
import { File as CodePostFile } from '../../../../../../utils/file';
import { getCourseAISettings } from '../../../../../../utils/aiService';
import { useTreeSitter } from '../../../../../../hooks/useTreeSitter';
import { useSymbolExtraction, MonacoSuggestion } from '../../../../../../hooks/useSymbolExtraction';

interface IProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  assignmentId: number;
  courseId?: number;
  targetFileName: string;
  contextFiles: AssignmentFileType[];
  rubricText?: string;

  // Rubric Linking Props
  rubricCategories?: RubricCategory[];
  rubricComments?: Record<number, RubricComment[]>;
  selectedRubricItem?: number | null;
  onRubricItemChange: (id: number | null) => void;
}

export const TestScriptEditor = (props: IProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'card' | 'split'>('split');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [debouncedCode, setDebouncedCode] = useState(props.code);

  // Store completion provider disposables
  type MonacoDisposable = { dispose: () => void };
  const completionProviders = useRef<MonacoDisposable[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup providers on unmount
      completionProviders.current.forEach((p) => p.dispose());
      completionProviders.current = [];
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAiSettings = async () => {
      try {
        let courseId = props.courseId;

        if (!courseId) {
          const assignment = await assignmentsApi.retrieve({ id: props.assignmentId });
          courseId = assignment.course;
        }

        if (!courseId) {
          if (isMounted) setAiEnabled(false);
          return;
        }

        const aiSettings = await getCourseAISettings(courseId);
        if (isMounted) setAiEnabled(Boolean(aiSettings.aiEnabled));
      } catch {
        if (isMounted) setAiEnabled(false);
      }
    };

    loadAiSettings();

    return () => {
      isMounted = false;
    };
  }, [props.assignmentId, props.courseId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCode(props.code);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [props.code]);

  type MonacoPosition = { lineNumber: number };
  type MonacoWord = { startColumn: number; endColumn: number };
  type MonacoRange = {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
  };
  type MonacoModel = {
    getWordUntilPosition: (position: MonacoPosition) => MonacoWord;
    getLineContent: (lineNumber: number) => string;
  };

  // Determine language for Tree-sitter
  const targetFile = props.contextFiles?.find((f) => f.name === props.targetFileName);
  const detectedLanguage = targetFile ? CodePostFile.language(targetFile) : undefined;
  const treeSitterLang =
    detectedLanguage === 'python'
      ? 'python'
      : detectedLanguage === 'java'
        ? 'java'
        : detectedLanguage === 'r'
          ? 'r'
          : undefined;

  const parser = useTreeSitter(treeSitterLang);

  // Symbol Extraction Logic
  const extractedSymbols = useSymbolExtraction(
    parser,
    treeSitterLang,
    props.targetFileName,
    props.contextFiles,
    debouncedCode,
  );

  const onGenerate = async () => {
    if (!aiEnabled) return;

    setIsGenerating(true);
    setError(null);
    try {
      const result = await assignmentsApi.generateTestCreate({
        id: props.assignmentId,
        assignmentGenerateTest: {
          targetFilename: props.targetFileName,
          language: props.language,
          rubricText: props.rubricText,
        },
      });

      if (result.script) {
        if (props.code && props.code.length > 20) {
          Modal.confirm({
            title: 'Replace existing script?',
            content: 'You have existing code. Do you want to replace it with the generated script?',
            onOk: () => props.onChange(result.script),
          });
        } else {
          props.onChange(result.script);
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to generate test';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  type MonacoApi = {
    languages: {
      registerCompletionItemProvider: (
        language: string,
        provider: {
          triggerCharacters?: string[];
          provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => { suggestions: MonacoSuggestion[] };
        },
      ) => MonacoDisposable;
      CompletionItemKind: { Snippet: number; Function: number; Method: number; Variable: number; Class: number };
      CompletionItemInsertTextRule: { InsertAsSnippet: number };
    };
  };

  const handleEditorDidMount = (_editor: unknown, monaco: unknown) => {
    // Clean up any existing providers first
    completionProviders.current.forEach((p) => p.dispose());
    completionProviders.current = [];

    const monacoApi = monaco as MonacoApi;
    // Helper to get range including preceding @
    const getRangeWithAt = (model: MonacoModel, position: MonacoPosition): MonacoRange => {
      const word = model.getWordUntilPosition(position);
      const lineContent = model.getLineContent(position.lineNumber);
      const startColumn =
        word.startColumn > 1 && lineContent[word.startColumn - 2] === '@' ? word.startColumn - 1 : word.startColumn;

      return {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: startColumn,
        endColumn: word.endColumn,
      };
    };

    const getStandardRange = (model: MonacoModel, position: MonacoPosition): MonacoRange => {
      const word = model.getWordUntilPosition(position);
      return {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
    };

    const getDynamicSuggestions = (range: MonacoRange, position: MonacoPosition) => {
      // Filter suggestions scope-aware
      const validSymbols = extractedSymbols.current.filter((s) => {
        // If symbol is from the current script, it must be defined before the cursor
        if (s.origin === 'current script' && s.definitionLine) {
          return s.definitionLine < position.lineNumber;
        }
        return true;
      });

      return validSymbols.map((s) => ({
        label: s.label,
        kind:
          s.kind === 5
            ? monacoApi.languages.CompletionItemKind.Class
            : s.kind === 4
              ? monacoApi.languages.CompletionItemKind.Variable
              : s.kind === 8
                ? 8 // Module
                : monacoApi.languages.CompletionItemKind.Function,
        insertText: s.insertText,
        insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: s.documentation || `Defined in ${props.targetFileName}`,
        range: range,
      }));
    };

    // Register completion provider for Python
    completionProviders.current.push(
      monacoApi.languages.registerCompletionItemProvider('python', {
        triggerCharacters: ['@'],
        provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
          const standardRange = getStandardRange(model, position);
          const dynamic = getDynamicSuggestions(standardRange, position);

          return {
            suggestions: [
              ...dynamic,
              {
                label: '@test',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  '@test(name="${1:Test Name}", points=${2:1}, description="${3:Optional description}", timeout=${4:30})\ndef test_${5:function}():\n\t${6:pass}',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new codePost test case',
                range: getRangeWithAt(model, position),
              },
              {
                label: '@test (points only)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText: '@test(name="${1:Test Name}", points=${2:1})\ndef test_${3:function}():\n\t${4:pass}',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a test with just name + points',
                range: getRangeWithAt(model, position),
              },
              {
                label: '@test (points + message)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  '@test(name="${1:Test Name}", points=${2:1}, description="${3:Failure message}")\ndef test_${4:function}():\n\t${5:pass}',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a test with points and description/message',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'assert_plots_generated',
                kind: monacoApi.languages.CompletionItemKind.Function,
                insertText: 'assert_plots_generated(${1:1})',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Assert that a specific number of plots were generated',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'get_plots',
                kind: monacoApi.languages.CompletionItemKind.Function,
                insertText: 'get_plots()',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Get raw base64 strings of captured plots',
                range: getRangeWithAt(model, position),
              },
            ],
          };
        },
      }),
    );

    // Register completion provider for Java
    completionProviders.current.push(
      monacoApi.languages.registerCompletionItemProvider('java', {
        triggerCharacters: ['@'],
        provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
          const standardRange = getStandardRange(model, position);
          const dynamic = getDynamicSuggestions(standardRange, position);

          return {
            suggestions: [
              ...dynamic,
              {
                label: '@Test',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  '@Test(name="${1:Test Name}", points=${2:1}, description="${3:Optional description}", timeout=${4:30})\npublic Object[] ${5:testFunction}() {\n\t${6:// test code}\n\treturn ${7:new Object[]{0.0, ""}};\n}',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new codePost test case (Java)',
                range: getRangeWithAt(model, position),
              },
              {
                label: '@Test (points only)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  '@Test(name="${1:Test Name}", points=${2:1})\npublic double ${3:testFunction}() {\n\t${4:// test code}\n\treturn ${5:0.0};\n}',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a Java test with just name + points (returns numeric score)',
                range: getRangeWithAt(model, position),
              },
              {
                label: '@Test (points + message)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  '@Test(name="${1:Test Name}", points=${2:1}, description="${3:Failure message}")\npublic Object[] ${4:testFunction}() {\n\t${5:// test code}\n\treturn ${6:new Object[]{0.0, ""}};\n}',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a Java test with points and description/message',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'assertTrue',
                kind: monacoApi.languages.CompletionItemKind.Method,
                insertText: 'assertTrue(${1:condition});',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Assert condition is true (codePost helper)',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'assertEquals',
                kind: monacoApi.languages.CompletionItemKind.Method,
                insertText: 'assertEquals(${1:expected}, ${2:actual});',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Assert expected equals actual (codePost helper)',
                range: getRangeWithAt(model, position),
              },
            ],
          };
        },
      }),
    );

    // Register completion provider for Node.js / JavaScript
    const jsCompletionProvider = {
      triggerCharacters: ['t'],
      provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
        return {
          suggestions: [
            {
              label: 'test',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText:
                'test("${1:Test Name}", ${2:5}, "${3:Optional description}", () => {\n\t${4:// assertions}\n}, ${5:30});',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a new codePost test case (Node/JS)',
              range: getRangeWithAt(model, position),
            },
            {
              label: 'test (points only)',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText: 'test("${1:Test Name}", ${2:5}, "", () => {\n\t${3:// assertions}\n});',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a Node/JS test with just name + points (empty description)',
              range: getRangeWithAt(model, position),
            },
            {
              label: 'test (points + message)',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText: 'test("${1:Test Name}", ${2:5}, "${3:Failure message}", () => {\n\t${4:// assertions}\n});',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a Node/JS test with points and description/message',
              range: getRangeWithAt(model, position),
            },
          ],
        };
      },
    };

    completionProviders.current.push(
      monacoApi.languages.registerCompletionItemProvider('javascript', jsCompletionProvider),
    );
    completionProviders.current.push(
      monacoApi.languages.registerCompletionItemProvider('typescript', jsCompletionProvider),
    );

    // Register completion provider for R
    completionProviders.current.push(
      monacoApi.languages.registerCompletionItemProvider('r', {
        triggerCharacters: ['r'],
        provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
          const standardRange = getStandardRange(model, position);
          const dynamic = getDynamicSuggestions(standardRange, position);

          return {
            suggestions: [
              ...dynamic,
              {
                label: 'run_test',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  'run_test("${1:Test Name}", ${2:1}, "${3:Optional description}", function() {\n\t${4:}\n}, ${5:30})',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new codePost test case (R runtime format)',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'run_test (points only)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText: 'run_test("${1:Test Name}", ${2:1}, function() {\n\t${3:}\n})',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define an R test with just name + points',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'run_test (points + message)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText: 'run_test("${1:Test Name}", ${2:1}, "${3:Failure message}", function() {\n\t${4:}\n})',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define an R test with points and description/message',
                range: getRangeWithAt(model, position),
              },
            ],
          };
        },
      }),
    );

    // Register completion provider for C/C++
    const cCompletionProvider = {
      triggerCharacters: ['T'],
      provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
        return {
          suggestions: [
            {
              label: 'TEST',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText: 'TEST(${1:TestName}, ${2:1.0}) {\n\tassertTrue(${3:condition}, "${4:message}");\n}',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a new codePost test case (C/C++)',
              range: getRangeWithAt(model, position),
            },
            {
              label: 'TEST (points only)',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText: 'TEST(${1:TestName}, ${2:1.0}) {\n\t${3:// assertions}\n}',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a C/C++ test with just name + points',
              range: getRangeWithAt(model, position),
            },
            {
              label: 'TEST_DESC (points + message)',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText: 'TEST_DESC(${1:TestName}, ${2:1.0}, "${3:Failure message}") {\n\t${4:// assertions}\n}',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a C/C++ test with points and description/message',
              range: getRangeWithAt(model, position),
            },
            {
              label: 'TEST_TIMEOUT',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText:
                'TEST_TIMEOUT(${1:TestName}, ${2:1.0}, ${3:30}) {\n\tassertTrue(${4:condition}, "${5:message}");\n}',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a new codePost test case with timeout (C/C++)',
              range: getRangeWithAt(model, position),
            },
            {
              label: 'TEST_DESC',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText:
                'TEST_DESC(${1:TestName}, ${2:1.0}, "${3:Optional description}") {\n\tassertTrue(${4:condition}, "${5:message}");\n}',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a new codePost test case with description (C/C++)',
              range: getRangeWithAt(model, position),
            },
            {
              label: 'TEST_DESC_TIMEOUT',
              kind: monacoApi.languages.CompletionItemKind.Snippet,
              insertText:
                'TEST_DESC_TIMEOUT(${1:TestName}, ${2:1.0}, "${3:Optional description}", ${4:30}) {\n\tassertTrue(${5:condition}, "${6:message}");\n}',
              insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a new codePost test case with description and timeout (C/C++)',
              range: getRangeWithAt(model, position),
            },
          ],
        };
      },
    };

    completionProviders.current.push(monacoApi.languages.registerCompletionItemProvider('c', cCompletionProvider));
    completionProviders.current.push(monacoApi.languages.registerCompletionItemProvider('cpp', cCompletionProvider));
    completionProviders.current.push(monacoApi.languages.registerCompletionItemProvider('csrc', cCompletionProvider));
    completionProviders.current.push(monacoApi.languages.registerCompletionItemProvider('c++src', cCompletionProvider));

    // Register completion provider for Ruby
    completionProviders.current.push(
      monacoApi.languages.registerCompletionItemProvider('ruby', {
        triggerCharacters: ['r'],
        provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
          return {
            suggestions: [
              {
                label: 'run_test',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  'run_test("${1:Test Name}", ${2:1}, "${3:Optional description}", ${4:30}) do\n\t${5:# test logic}\nend',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new codePost Ruby test case',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'run_test (points only)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText: 'run_test("${1:Test Name}", ${2:1}) do\n\t${3:# test logic}\nend',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a Ruby test with just name + points',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'run_test (points + message)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText: 'run_test("${1:Test Name}", ${2:1}, "${3:Failure message}") do\n\t${4:# test logic}\nend',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a Ruby test with points and description/message',
                range: getRangeWithAt(model, position),
              },
            ],
          };
        },
      }),
    );

    // Register completion provider for PHP
    completionProviders.current.push(
      monacoApi.languages.registerCompletionItemProvider('php', {
        triggerCharacters: ['T'],
        provideCompletionItems: (model: MonacoModel, position: MonacoPosition) => {
          return {
            suggestions: [
              {
                label: 'Tester::test',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  'Tester::test("${1:Test Name}", ${2:1}, "${3:Optional description}", function() {\n\t${4:// assertions}\n}, ${5:30});',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a new codePost PHP test case',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'Tester::test (points only)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText: 'Tester::test("${1:Test Name}", ${2:1}, function() {\n\t${3:// assertions}\n});',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a PHP test with just name + points',
                range: getRangeWithAt(model, position),
              },
              {
                label: 'Tester::test (points + message)',
                kind: monacoApi.languages.CompletionItemKind.Snippet,
                insertText:
                  'Tester::test("${1:Test Name}", ${2:1}, "${3:Failure message}", function() {\n\t${4:// assertions}\n});',
                insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Define a PHP test with points and description/message',
                range: getRangeWithAt(model, position),
              },
            ],
          };
        },
      }),
    );
  };

  const renderCodeEditor = () => (
    <div style={{ flex: 1, position: 'relative', height: '100%' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <CodeWindow
          code={props.code}
          name={`test_script.${extensionsByLanguage[props.language] || 'txt'}`}
          onChange={props.onChange}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );

  const containerStyle: React.CSSProperties = isFullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        background: '#f0f2f5', // Slightly gray background for contrast
        padding: '0', // Remove padding to use full width
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease', // Smooth transition
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '600px',
        transition: 'all 0.3s ease',
      };

  const toolbarStyle: React.CSSProperties = isFullScreen
    ? {
        padding: '12px 24px',
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 10, // Ensure shadow is visible
      }
    : {
        marginBottom: 10,
        padding: '8px',
        background: '#f5f5f5',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      };

  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid" size="small">
          <Radio.Button value="code">
            <CodeOutlined /> Code
          </Radio.Button>
          <Radio.Button value="split">
            <LayoutOutlined /> Split Preview
          </Radio.Button>
          <Radio.Button value="card">
            <AppstoreOutlined /> Builder
          </Radio.Button>
        </Radio.Group>
        <div style={{ width: 1, height: 20, background: '#d9d9d9', marginLeft: isFullScreen ? 12 : 0 }} />
        {isFullScreen && <div style={{ flex: 1 }} />} {/* Spacer to push buttons right in full screen */}
        {aiEnabled && (
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={onGenerate}
            loading={isGenerating}
            disabled={!props.targetFileName}
            size="small"
          >
            Generate (AI)
          </Button>
        )}
        <Tooltip title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}>
          <Button
            icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={() => setIsFullScreen(!isFullScreen)}
            size="small"
            type={isFullScreen ? 'default' : 'text'} // Use default button style in full screen
          />
        </Tooltip>
        {error && <Alert type="error" title={error} banner style={{ marginLeft: '12px' }} />}
      </div>

      {/* Editor Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: isFullScreen ? 'none' : '1px solid #d9d9d9',
          borderRadius: isFullScreen ? 0 : 4,
          overflow: 'hidden',
          background: '#fff',
          margin: isFullScreen ? '16px 24px 24px 24px' : 0, // Add margin in full screen for "floating" effect
          boxShadow: isFullScreen ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
        }}
      >
        {viewMode === 'code' && renderCodeEditor()}

        {viewMode === 'split' && (
          <SplitScreen initialLeftWidth={50}>
            {renderCodeEditor()}
            <div style={{ height: '100%', overflow: 'hidden', borderLeft: '1px solid #f0f0f0' }}>
              <div
                style={{
                  padding: '8px 16px',
                  background: '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#666',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>PREVIEW (parsed from code)</span>
                <Tooltip title="Close Preview">
                  <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setViewMode('code')} />
                </Tooltip>
              </div>
              <div style={{ height: 'calc(100% - 37px)', overflow: 'auto' }}>
                <TestScriptPreview code={debouncedCode} language={props.language} />
              </div>
            </div>
          </SplitScreen>
        )}

        {viewMode === 'card' && (
          <TestScriptCardView code={props.code} language={props.language} onChange={props.onChange} />
        )}
      </div>

      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
        {viewMode === 'card'
          ? 'Use the builder to add test cases. Switching to Code view allows for manual edits.'
          : "Write a script that executes the student's code. The preview shows how tests will appear to graders."}
      </div>
    </div>
  );
};
