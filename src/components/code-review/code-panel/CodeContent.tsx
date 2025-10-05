import * as React from 'react';

import { CommentType } from '../../../infrastructure/comment';
import { File, FileType } from '../../../infrastructure/file';
import { FileTemplateType } from '../../../infrastructure/fileTemplate';

// @ts-expect-error - No type definitions available
import SyntaxHighlighter from 'react-syntax-highlighter';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import themeVars from '../../../styles/abstracts/_theme.js';

import Code from './Code';
import Markdown from './Markdown';
import { Pdf } from './Pdf';
import TemplateCode from './TemplateCode';

import CodePanelSizing from './CodePanelSizing';

import { CURSOR_DOMAIN } from '../CodeConsole';

export interface ICodeContentCoreProps {
  file: FileType;
  comments: CommentType[];
  readOnly: boolean;
  user: string;
  onHighlightClick: (e: React.MouseEvent) => void;
}

export interface ICodeContentEditProps {
  commentCounter: number;
  addComment: (comment: CommentType, file: FileType) => void;
  fileTemplate?: FileTemplateType;
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
  const lineNumberPadding = CodePanelSizing.lineNumberPadding(props.file.code) + 20;

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
      overflow: 'none',
    }),
    [],
  );

  // Render markdown/jupyter/image files
  if (['markdown', 'jupyter', 'image'].includes(codeType)) {
    return (
      <div id="code-container" className="code-container" style={containerStyle}>
        <div
          id="code-main"
          className="code code--markdown"
          style={{
            ...commonCodeStyle,
            paddingLeft: '20px',
            backgroundColor: 'white',
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
            fileTemplate={props.fileTemplate}
            cursorMode={props.cursorMode}
            showCursor={props.showCursor}
            updateCursorDomain={props.updateCursorDomain}
          />
        </div>
      </div>
    );
  }

  // Render PDF files
  if (codeType === 'pdf') {
    return (
      <div id="code-container" className="code-container" style={containerStyle}>
        <div
          id="code-main"
          className="code code--markdown"
          style={{
            ...commonCodeStyle,
            paddingLeft: '20px',
            backgroundColor: 'white',
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
            fileTemplate={props.fileTemplate}
            cursorMode={props.cursorMode}
            showCursor={props.showCursor}
            updateCursorDomain={props.updateCursorDomain}
          />
        </div>
      </div>
    );
  }

  // Render code files with syntax highlighting
  return (
    <div
      id="code-container"
      className="code-container"
      style={{
        ...containerStyle,
        cursor: props.readOnly ? 'default' : 'text',
      }}
    >
      <SyntaxHighlighter
        id="code-syntax"
        className="code--syntax"
        language={File.language(props.file)}
        style={consoleTheme.codeTheme}
        showLineNumbers={true}
        wrapLines={false}
        customStyle={{
          ...commonCodeStyle,
          padding: '0px 0px 10px 20px',
          backgroundColor: consoleTheme.codeBg,
        }}
      >
        {props.file.code}
      </SyntaxHighlighter>
      {props.fileTemplate && (
        <div
          id="code-template"
          className="code code--template"
          style={{
            ...commonCodeStyle,
            paddingLeft: `${lineNumberPadding}px`,
            paddingBottom: '10px',
          }}
        >
          <TemplateCode file={props.file} fileTemplate={props.fileTemplate} />
        </div>
      )}
      <div
        id="code-main"
        className="code code--underlay"
        style={{
          ...commonCodeStyle,
          paddingLeft: `${lineNumberPadding}px`,
        }}
      >
        <Code
          file={props.file}
          comments={props.comments}
          readOnly={props.readOnly}
          user={props.user}
          onHighlightClick={props.onHighlightClick}
          commentCounter={props.commentCounter}
          addComment={addCommentAndIncrement}
          fileTemplate={props.fileTemplate}
          cursorMode={props.cursorMode}
          showCursor={props.showCursor}
          updateCursorDomain={props.updateCursorDomain}
        />
      </div>
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
      fileTemplate={undefined}
      cursorMode={false}
      showCursor={CURSOR_DOMAIN.CODE_HIDDEN}
      updateCursorDomain={noop}
    />
  );
};

export const GradeCode = CodeContent;
export const StudentCode = StudentCodeWrapper;
