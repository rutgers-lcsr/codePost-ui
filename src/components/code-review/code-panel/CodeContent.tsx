import * as React from 'react';

import { CommentType } from '../../../infrastructure/comment';
import { File, FileType } from '../../../infrastructure/file';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import Code from './Code';
import Markdown from './Markdown';

export interface ICodeContentCoreProps {
  file: FileType;
  comments: CommentType[];
  readOnly: boolean;
  user: string;
  codeStyle?: React.CSSProperties;
}

export interface ICodeContentEditProps {
  addComment: (comment: CommentType, file: FileType) => void;
}

const CodeContent = React.memo((props: ICodeContentCoreProps & ICodeContentEditProps) => {
  const [commentCounter, setCommentCounter] = React.useState(-1);

  // console.log('props', props);

  const addCommentAndIncrement = (comment: CommentType, file: FileType) => {
    setCommentCounter(commentCounter - 1);
    props.addComment(comment, file);
  };

  if (File.codeType(props.file) === ('markdown' || 'jupyter')) {
    const { addComment, codeStyle, ...codeProps } = { ...props };
    console.log('markdown');
    return (
      <div id="code-main" className="code code--markdown" style={codeStyle}>
        <Markdown {...codeProps} commentCounter={commentCounter} addComment={addCommentAndIncrement} />
      </div>
    );
  } else {
    console.log('code');
    const { addComment, ...codeProps } = { ...props };
    // @ts-ignore
    const { paddingLeft, ...codeStyle } = props.codeStyle;

    return (
      <div>
        <SyntaxHighlighter
          id="code-syntax"
          className="code code--syntax"
          language={File.language(props.file)}
          style={googlecode}
          showLineNumbers={true}
          wrapLines={false}
          customStyle={{ ...codeStyle, padding: '0px' }}
        >
          {props.file.code}
        </SyntaxHighlighter>
        <div id="code-main" className="code code--underlay" style={props.codeStyle}>
          <Code {...codeProps} commentCounter={commentCounter} addComment={addCommentAndIncrement} />;
        </div>
      </div>
    );
  }
});

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
