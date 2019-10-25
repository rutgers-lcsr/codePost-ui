import * as React from 'react';

import { CommentType } from '../../../infrastructure/comment';
import { File, FileType } from '../../../infrastructure/file';
import { FileTemplateType } from '../../../infrastructure/fileTemplate';

// @ts-ignore
import SyntaxHighlighter from 'react-syntax-highlighter';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';
import { CodeConsoleDimensionsType } from './LayoutResizer';

import themeVars from '../../../styles/abstracts/_theme.js';

import Code from './Code';
import Markdown from './Markdown';
import TemplateCode from './TemplateCode';

import CodePanelSizing from './CodePanelSizing';

export interface ICodeContentCoreProps {
  file: FileType;
  comments: CommentType[];
  readOnly: boolean;
  user: string;
  onHighlightClick: (e: React.MouseEvent) => void;
  dimensions: CodeConsoleDimensionsType;
}

export interface ICodeContentEditProps {
  commentCounter: number;
  addComment: (comment: CommentType, file: FileType) => void;
  fileTemplate?: FileTemplateType;
  showCursor: boolean;
  cursorIndex: number;
  cursorExtent: number;
}

const CodeContent = (props: ICodeContentCoreProps & ICodeContentEditProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  React.useEffect(() => {
    const codeMain = document.getElementById('code-main');
    const codeSyntax = document.getElementById('code-syntax');
    const codeTemplate = document.getElementById('code-template');

    const horizontalCodeScroll = () => {
      // Scroll horizontally
      if (codeMain !== null && codeSyntax !== null) {
        codeSyntax.scrollLeft = codeMain.scrollLeft;
      }

      if (codeMain !== null && codeTemplate !== null) {
        codeTemplate.scrollLeft = codeMain.scrollLeft;
      }
    };

    if (codeMain !== null && codeSyntax !== null) {
      codeMain.addEventListener('scroll', horizontalCodeScroll);
    }

    return () => {
      if (codeMain !== null && codeSyntax !== null) {
        codeMain.removeEventListener('scroll', horizontalCodeScroll);
      }
    };
  }, []);

  const addCommentAndIncrement = (comment: CommentType, file: FileType) => {
    props.addComment(comment, file);
  };

  if (['markdown', 'jupyter', 'image'].includes(File.codeType(props.file))) {
    const { addComment, ...codeProps } = { ...props };
    return (
      <div
        id="code-container"
        className="code-container"
        style={{
          width: `${props.dimensions.codeWidth}px`,
          overflowX: 'hidden',
          backgroundColor: consoleTheme.codeBg,
          border: `1px solid ${consoleTheme.codeBorder}`,
        }}
      >
        <div
          id="code-main"
          className="code code--markdown"
          style={{
            lineHeight: `${themeVars.grade.codeLineHeight}px`,
            fontSize: `${themeVars.grade.codeFontSize}px`,
            paddingLeft: '20px',
            backgroundColor: 'white',
            paddingTop: '3px',
            paddingRight: '20px',
          }}
        >
          <Markdown
            key={props.file.id}
            {...codeProps}
            commentCounter={props.commentCounter}
            addComment={addCommentAndIncrement}
          />
        </div>
      </div>
    );
  } else {
    const { addComment, ...codeProps } = { ...props };

    return (
      <div
        id="code-container"
        className="code-container"
        style={{
          width: `${props.dimensions.codeWidth}px`,
          overflowX: 'hidden',
          backgroundColor: consoleTheme.codeBg,
          border: `1px solid ${consoleTheme.codeBorder}`,
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
            lineHeight: `${themeVars.grade.codeLineHeight}px`,
            fontSize: `${themeVars.grade.codeFontSize}px`,
            padding: '0px 0px 10px 20px',
            backgroundColor: consoleTheme.codeBg,
          }}
        >
          {props.file.code}
        </SyntaxHighlighter>
        {props.fileTemplate !== undefined ? (
          <div
            id="code-template"
            className="code code--template"
            style={{
              lineHeight: `${themeVars.grade.codeLineHeight}px`,
              fontSize: `${themeVars.grade.codeFontSize}px`,
              paddingLeft: `${CodePanelSizing.lineNumberPadding(props.file.code) + 20}px`,
              paddingBottom: '10px',
            }}
          >
            <TemplateCode file={props.file} fileTemplate={props.fileTemplate} />
          </div>
        ) : null}
        <div
          id="code-main"
          className="code code--underlay"
          style={{
            lineHeight: `${themeVars.grade.codeLineHeight}px`,
            fontSize: `${themeVars.grade.codeFontSize}px`,
            paddingLeft: `${CodePanelSizing.lineNumberPadding(props.file.code) + 20}px`,
            paddingBottom: '10px',
          }}
        >
          <Code
            {...codeProps}
            commentCounter={props.commentCounter}
            addComment={addCommentAndIncrement}
            onHighlightClick={props.onHighlightClick}
            showCursor={props.showCursor}
            cursorIndex={props.cursorIndex}
            cursorExtent={props.cursorExtent}
          />
        </div>
      </div>
    );
  }
};

const makeReadOnly = (Component: React.ComponentType<ICodeContentCoreProps & ICodeContentEditProps>) => {
  return class WrappedComponent extends React.Component<ICodeContentCoreProps, {}> {
    public addComment = (comment: CommentType, file: FileType) => {
      return;
    };

    public render() {
      return (
        <Component
          {...(this.props as ICodeContentCoreProps)}
          addComment={this.addComment}
          commentCounter={-1}
          fileTemplate={undefined}
          showCursor={false}
          cursorIndex={0}
          cursorExtent={1}
        />
      );
    }
  };
};

export const GradeCode = CodeContent;
export const StudentCode = makeReadOnly(CodeContent);
