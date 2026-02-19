import * as React from 'react';

import type { CommentType } from '../../../types/models';
import { File, getFileContent, type AssignmentFileType, type FileType } from '../../../utils/file';

import SyntaxHighlighter from 'react-syntax-highlighter';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import themeVars from '../../../styles/abstracts/_theme.js';

import Code from './Code';
import CodeExecutionOutput from './CodeExecutionOutput';
import { CommentHighlightProvider } from './CommentHighlightContext';
import Markdown from './Markdown';
import { Pdf } from './Pdf';

import TemplateCode from './TemplateCode';
import { CodeWindow } from '../../../components/admin/assignments/tests/edit/utils/CodeWindow';

import CodePanelSizing from './CodePanelSizing';

import { CURSOR_DOMAIN } from '../CodeConsoleEnums';
import type { ICursorType } from './Cursor';

export interface ICodeContentCoreProps {
  file: FileType;
  comments: CommentType[]; // Still passed as prop for Markdown/PDF, but Code gets from context
  readOnly: boolean;
  user: string;
  onHighlightClick: (e: React.MouseEvent) => void;
  executionResult?: {
    success: boolean;
    output_data?: {
      cells?: unknown[];
      stdout?: string;
      stderr?: string;
      error?: string;
      [key: string]: unknown;
    };
    error?: string;
  } | null;
  onClearOutputs?: () => void;
}

export interface ICodeContentEditProps {
  commentCounter: number;
  addComment: (comment: CommentType, file: FileType) => void;
  assignmentFile?: AssignmentFileType;
  cursorMode: boolean;
  showCursor: CURSOR_DOMAIN;
  updateCursorDomain: (domain: CURSOR_DOMAIN) => void;
  onCursorChange?: (cursor: ICursorType) => void;
  onUpdateCommentLocation?: (
    commentId: number,
    newStartLine: number,
    newEndLine: number,
    newStartChar: number,
    newEndChar: number,
  ) => void;
  isEditMode: boolean;
  temporaryContent?: string;
  onContentChange: (content: string) => void;
}

type CodeContentProps = ICodeContentCoreProps & ICodeContentEditProps;

const CodeContent: React.FC<CodeContentProps> = (props) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const fileWithId = props.file as FileType & { id?: number };
  const fileKey = fileWithId.id ?? props.file.name;

  // Sync horizontal scroll between code layers
  React.useEffect(() => {
    const codeMain = document.getElementById('code-main');
    const codeSyntax = document.getElementById('code-syntax');
    const codeTemplate = document.getElementById('code-template');

    const horizontalCodeScroll = () => {
      if (codeMain && codeSyntax) {
        codeSyntax.scrollLeft = codeMain.scrollLeft;
      }
      if (codeMain && codeTemplate) {
        codeTemplate.scrollLeft = codeMain.scrollLeft;
      }
    };

    if (codeMain && codeSyntax) {
      codeMain.addEventListener('scroll', horizontalCodeScroll);
      return () => {
        codeMain.removeEventListener('scroll', horizontalCodeScroll);
      };
    }
  }, []);

  const addCommentAndIncrement = React.useCallback(
    (comment: CommentType, file: FileType) => {
      props.addComment(comment, file);
    },
    [props],
  );

  const codeType = File.codeType(props.file);

  const fileContent = getFileContent(props.file);
  const lineNumberPadding = React.useCallback(() => {
    return CodePanelSizing.lineNumberPadding(fileContent) + 20;
  }, [fileContent]);

  // Common container style
  const containerStyle = React.useMemo(
    () => ({
      width: '100%',
      overflowX: 'auto' as const,
      backgroundColor: consoleTheme.codeBg,
      border: `1px solid ${consoleTheme.codeBorder}`,
    }),
    [consoleTheme.codeBg, consoleTheme.codeBorder],
  );

  const commonCodeStyle = React.useMemo(
    () => ({
      lineHeight: `${themeVars.grade.codeLineHeight}px`,
      fontSize: `${themeVars.grade.codeFontSize}px`,
      fontFamily: themeVars.theme.fontCode,
      overflow: 'none',
    }),
    [],
  );

  const codeTagStyle = React.useMemo<React.CSSProperties>(
    () => ({
      fontFamily: themeVars.theme.fontCode,
      fontSize: `${themeVars.grade.codeFontSize}px`,
      lineHeight: `${themeVars.grade.codeLineHeight}px`,
    }),
    [],
  );

  // Memoize SyntaxHighlighter to prevent expensive re-renders when comments change
  const syntaxHighlighterLayer = React.useMemo(
    () => (
      <SyntaxHighlighter
        id="code-syntax"
        className="code--syntax"
        language={File.language(props.file)}
        style={consoleTheme.codeTheme}
        showLineNumbers={true}
        wrapLines={false}
        codeTagProps={{
          style: codeTagStyle,
        }}
        customStyle={{
          ...commonCodeStyle,
          overflow: 'hidden',
          padding: '0px 0px 10px 20px',
          backgroundColor: consoleTheme.codeBg,
        }}
      >
        {fileContent}
      </SyntaxHighlighter>
    ),
    [props.file, consoleTheme.codeTheme, consoleTheme.codeBg, codeTagStyle, commonCodeStyle, fileContent],
  );

  // Render logic for Edit Mode (non-notebook files only)
  // Jupyter notebooks are handled inline by the Markdown component (MarkdownCode renders Monaco editors)
  if (props.isEditMode) {
    // For code/text files use CodeWindow (Monaco)
    // PDF and Image editing not supported
    // Jupyter files fall through to the Markdown renderer below
    if (codeType !== 'pdf' && codeType !== 'image' && codeType !== 'jupyter') {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeWindow
              code={props.temporaryContent ?? fileContent}
              name={props.file.name}
              onChange={props.onContentChange}
              height="100%"
            />
          </div>
          {props.executionResult && (
            <CodeExecutionOutput
              file={props.file}
              executionResult={props.executionResult}
              onClearOutputs={props.onClearOutputs}
            />
          )}
        </div>
      );
    }
  }

  // Render markdown/jupyter/image files (Read-Only View)
  if (['markdown', 'jupyter', 'image'].includes(codeType)) {
    return (
      <div>
        <div id="code-container" className="code-container" style={containerStyle}>
          <div
            id="code-main"
            className="code code--markdown"
            style={{
              ...commonCodeStyle,
              paddingLeft: '20px',
              paddingTop: '0px',
              paddingRight: '20px',
              paddingBottom: '0px',
            }}
          >
            <Markdown
              key={fileKey}
              file={props.file}
              comments={props.comments}
              readOnly={props.readOnly}
              user={props.user}
              onHighlightClick={props.onHighlightClick}
              commentCounter={props.commentCounter}
              addComment={addCommentAndIncrement}
              assignmentFile={props.assignmentFile}
              cursorMode={props.cursorMode}
              showCursor={props.showCursor}
              updateCursorDomain={props.updateCursorDomain}
              executionResult={props.executionResult}
              onClearOutputs={props.onClearOutputs}
              isEditMode={props.isEditMode}
              onContentChange={props.onContentChange}
              temporaryContent={props.temporaryContent}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render PDF files
  if (codeType === 'pdf') {
    return (
      <CommentHighlightProvider
        file={props.file}
        comments={props.comments}
        readOnly={props.readOnly}
        user={props.user}
        onHighlightClick={props.onHighlightClick}
        addComment={props.addComment}
      >
        <div id="code-container" className="code-container" style={containerStyle}>
          <div
            id="code-main"
            className="code code--markdown"
            style={{
              ...commonCodeStyle,
              paddingLeft: '20px',
              paddingTop: '0px',
              paddingRight: '20px',
              paddingBottom: '0px',
            }}
          >
            <Pdf
              key={fileKey}
              file={props.file}
              comments={props.comments}
              readOnly={props.readOnly}
              user={props.user}
              onHighlightClick={props.onHighlightClick}
              commentCounter={props.commentCounter}
              addComment={addCommentAndIncrement}
              assignmentFile={props.assignmentFile}
              cursorMode={props.cursorMode}
              showCursor={props.showCursor}
              updateCursorDomain={props.updateCursorDomain}
              isEditMode={props.isEditMode}
              onContentChange={props.onContentChange}
              temporaryContent={props.temporaryContent}
            />
          </div>
        </div>
      </CommentHighlightProvider>
    );
  }

  // Render code files with syntax highlighting
  return (
    <div>
      <div
        id="code-container"
        className="code-container"
        style={{
          ...containerStyle,
          cursor: props.readOnly ? 'default' : 'text',
        }}
      >
        {/* Syntax Highlighting Layer allows for code to be visible with highlights*/}
        {syntaxHighlighterLayer}

        {props.assignmentFile && (
          <div
            id="code-template"
            className="code code--template"
            style={{
              ...commonCodeStyle,
              paddingLeft: `${lineNumberPadding()}px`,
              paddingBottom: '10px',
            }}
          >
            <TemplateCode file={props.file} assignmentFile={props.assignmentFile} />
          </div>
        )}
        {/* Main Code Layer handles highlights and comments, text should be invisible but cursor should be visible and highlights should be applied */}
        <div
          id="code-main"
          className="code code--underlay"
          style={{
            ...commonCodeStyle,
            paddingLeft: `${lineNumberPadding()}px`,
          }}
        >
          <Code
            file={props.file}
            readOnly={props.readOnly}
            user={props.user}
            onHighlightClick={props.onHighlightClick}
            commentCounter={props.commentCounter}
            addComment={addCommentAndIncrement}
            assignmentFile={props.assignmentFile}
            cursorMode={props.cursorMode}
            showCursor={props.showCursor}
            updateCursorDomain={props.updateCursorDomain}
            onCursorChange={props.onCursorChange}
            onUpdateCommentLocation={props.onUpdateCommentLocation}
            isEditMode={props.isEditMode}
            onContentChange={props.onContentChange}
            temporaryContent={props.temporaryContent}
          />
        </div>
      </div>

      {/* Execution Output Display */}
      {props.executionResult && (
        <CodeExecutionOutput
          file={props.file}
          executionResult={props.executionResult}
          onClearOutputs={props.onClearOutputs}
        />
      )}
    </div>
  );
};

// Read-only wrapper component for student view
const StudentCodeWrapper: React.FC<ICodeContentCoreProps> = (props) => {
  const noop = React.useCallback(() => {
    // No-op function for read-only mode
  }, []);

  return (
    <CodeContent
      {...props}
      addComment={noop}
      commentCounter={-1}
      assignmentFile={undefined}
      cursorMode={false}
      showCursor={CURSOR_DOMAIN.CODE_HIDDEN}
      updateCursorDomain={noop}
      isEditMode={false}
      onContentChange={noop}
    />
  );
};

export const GradeCode = CodeContent;
export const StudentCode = StudentCodeWrapper;
