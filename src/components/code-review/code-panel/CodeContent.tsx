import * as React from 'react';

import { CommentType } from '../../../infrastructure/comment';
import { File, FileType } from '../../../infrastructure/file';

import SyntaxHighlighter from 'react-syntax-highlighter';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import Code from './Code';
import Markdown from './Markdown';

export interface ICodeContentCoreProps {
  file: FileType;
  comments: CommentType[];
  readOnly: boolean;
  user: string;
  codeStyle: React.CSSProperties;
  highlightHeight: string;
  onHighlightClick: (e: React.MouseEvent) => void;
}

export interface ICodeContentEditProps {
  addComment: (comment: CommentType, file: FileType) => void;
}

const CodeContent = (props: ICodeContentCoreProps & ICodeContentEditProps) => {
  const [commentCounter, setCommentCounter] = React.useState(-1);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  React.useEffect(() => {
    const codeMain = document.getElementById('code-main');
    const codeSyntax = document.getElementById('code-syntax');

    const horizontalCodeScroll = () => {
      // Scroll horizontally
      if (codeMain !== null && codeSyntax !== null) {
        codeSyntax.scrollLeft = codeMain.scrollLeft;
      }
    };

    if (codeMain !== null) {
      codeMain.addEventListener('scroll', horizontalCodeScroll);
    }

    return () => {
      if (codeMain !== null) {
        codeMain.removeEventListener('scroll', horizontalCodeScroll);
      }
    };
  }, []);

  const addCommentAndIncrement = (comment: CommentType, file: FileType) => {
    setCommentCounter(commentCounter - 1);
    props.addComment(comment, file);
  };

  if (['markdown', 'jupyter'].includes(File.codeType(props.file))) {
    const { addComment, ...codeProps } = { ...props };
    return (
      <div id="code-main" className="code code--markdown" style={props.codeStyle}>
        <Markdown
          key={props.file.id}
          {...codeProps}
          commentCounter={commentCounter}
          addComment={addCommentAndIncrement}
        />
      </div>
    );
  } else {
    const { addComment, ...codeProps } = { ...props };
    const { paddingLeft, ...codeStyle } = props.codeStyle;

    return (
      <div>
        <SyntaxHighlighter
          id="code-syntax"
          className="code code--syntax"
          language={File.language(props.file)}
          style={consoleTheme.codeTheme}
          showLineNumbers={true}
          wrapLines={false}
          customStyle={{ ...codeStyle, padding: '0px 0px 0px 20px', backgroundColor: consoleTheme.codeBg }}
        >
          {props.file.code}
        </SyntaxHighlighter>
        <div id="code-main" className="code code--underlay" style={props.codeStyle}>
          <Code
            {...codeProps}
            commentCounter={commentCounter}
            addComment={addCommentAndIncrement}
            highlightHeight={props.highlightHeight}
            onHighlightClick={props.onHighlightClick}
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
      return <Component {...this.props as ICodeContentCoreProps} addComment={this.addComment} />;
    }
  };
};

export const GradeCode = CodeContent;
export const StudentCode = makeReadOnly(CodeContent);
