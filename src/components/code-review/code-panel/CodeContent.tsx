import * as React from 'react';

import { CommentType } from '../../../infrastructure/comment';
import { AssignmentFileType, File, FileType, getFileContent } from '../../../infrastructure/file';

import SyntaxHighlighter from 'react-syntax-highlighter';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import themeVars from '../../../styles/abstracts/_theme.js';

import Code from './Code';
import CodeExecutionOutput from './CodeExecutionOutput';
import { CommentHighlightProvider } from './CommentHighlightContext';
import Markdown from './Markdown';
import { Pdf } from './Pdf';
import TemplateCode from './TemplateCode';

import CodePanelSizing from './CodePanelSizing';

import { CURSOR_DOMAIN } from '../CodeConsoleEnums';

export interface ICodeContentCoreProps {
  file: FileType;
  comments: CommentType[]; // Still passed as prop for Markdown/PDF, but Code gets from context
  readOnly: boolean;
  user: string;
  onHighlightClick: (e: React.MouseEvent) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executionResult?: { success: boolean; output_data?: any; error?: string } | null;
  onClearOutputs?: () => void;
}

export interface ICodeContentEditProps {
  commentCounter: number;
  addComment: (comment: CommentType, file: FileType) => void;
  assignmentFile?: AssignmentFileType;
  cursorMode: boolean;
  showCursor: CURSOR_DOMAIN;
  updateCursorDomain: (domain: CURSOR_DOMAIN) => void;
}

type CodeContentProps = ICodeContentCoreProps & ICodeContentEditProps;

const CodeContent: React.FC<CodeContentProps> = (props) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

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

  // Render markdown/jupyter/image files
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
              key={props.file.id}
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
              key={props.file.id}
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
    />
  );
};

export const GradeCode = CodeContent;
export const StudentCode = StudentCodeWrapper;
