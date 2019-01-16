import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import Comment from './Comment';

import { ICommentToRubricCommentMap, ICSSStyleObject, IFileToCommentsMap } from '../types/common';

import CodePanelUtils from '../CodePanelUtils';

import { CommentType } from '../infrastructure/comment';
import { FileType } from '../infrastructure/file';
import { SubmissionType } from '../infrastructure/submission';

interface IProps {
  submission: SubmissionType;
  files: FileType[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  addComment: (comment: any, file: FileType) => void;
  activeCommentId?: number;
  changeActive: (id: number | undefined) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType) => void;
  saveGrade: () => any;
}

interface IState {
  commentCounter: number;
}

class CodePanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    commentCounter: -1,
  };

  //////////////////////////////////////
  // Lifecycle Methods
  //////////////////////////////////////

  //////////////////////////////////////
  // Prop Methods
  //////////////////////////////////////

  public addComment = (comment: CommentType, file: FileType) => {
    const { addComment } = this.props;
    this.props.changeActive(comment.id);
    addComment(comment, file);
  };

  public changeActive = (id: number) => {
    this.props.changeActive(id);
  };

  public updateCommentCounter = (): void => {
    this.setState({ commentCounter: this.state.commentCounter - 1 });
  };

  //////////////////////////////////////
  // Helpers
  //////////////////////////////////////

  public getTabTitle = (file: FileType, comments: CommentType[], rubricComments: ICommentToRubricCommentMap) => {
    // Horrific code that is happneing because the pointDelta is sometimes
    // a number and sometimes a string
    // will fix the underlying issue in a future PR
    const pointDelta = comments.reduce((accumulator: number, comment: CommentType) => {
      if (comment.pointDelta) {
        if (typeof comment.pointDelta === 'number') {
          return accumulator + comment.pointDelta;
        } else {
          return accumulator + parseInt(comment.pointDelta, 10);
        }
      } else if (rubricComments[comment.id]) {
        return accumulator + rubricComments[comment.id].pointDelta;
      } else {
        return accumulator;
      }
    }, 0);
    const pointDeltaString = pointDelta > 0 ? `(-${pointDelta})` : '';

    const numComments = comments.length;
    const commentFlag = numComments > 0 ? <div className="tab__comment-count">{numComments}</div> : '';

    return (
      <div className="tab__title">
        {commentFlag}
        <div className="tab__title">{`${file.name} ${pointDeltaString}`}</div>
      </div>
    );
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const {
      activeCommentId,
      deleteComment,
      readOnly,
      files,
      comments,
      rubricComments,
      updateComment,
      saveGrade,
    } = this.props;

    const { commentCounter } = this.state;

    return (
      <Tabs>
        <TabList>
          {files.map((file: FileType, i: number) => {
            const tabTitle = this.getTabTitle(file, comments[file.id], rubricComments);
            return (
              <Tab id="{i}" key={i}>
                {tabTitle}
              </Tab>
            );
          })}
        </TabList>
        {files.map((file: FileType, i: number) => {
          return (
            <TabPanel key={i}>
              <Code
                file={file}
                comments={comments[file.id]}
                rubricComments={rubricComments}
                readOnly={readOnly}
                addComment={this.addComment}
                commentCounter={commentCounter}
                updateCommentCounter={this.updateCommentCounter}
                activeCommentId={activeCommentId}
                changeActive={this.changeActive}
                deleteComment={deleteComment}
                updateComment={updateComment}
                saveGrade={saveGrade}
              />
            </TabPanel>
          );
        })}
      </Tabs>
    );
  }
}

interface ICodeProps {
  file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  // giving a partial comment breaks the IComment type constraint, could make some fields optional?
  addComment: (comment: any, file: FileType) => void;
  commentCounter: number;
  updateCommentCounter: () => void;

  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType) => void;
  saveGrade: () => any;
}

const Code = (props: ICodeProps) => {
  const {
    file,
    readOnly,
    commentCounter,
    updateCommentCounter,
    addComment,
    comments,
    changeActive,
    rubricComments,
    activeCommentId,
    deleteComment,
    updateComment,
    saveGrade,
  } = props;

  const onMouseUp = (event: any) => {
    const selection = window.getSelection();

    if (selection.toString() === '') {
      return;
    }

    // Hack to avoid messing with Node type checking
    const anchorParent: any = selection.anchorNode.parentNode;
    let startLine = +anchorParent.id;

    const extentParent: any = selection.extentNode.parentNode;
    let endLine = +extentParent.id;

    let startChar = selection.anchorOffset;
    let endChar = selection.extentOffset;

    // Check to see if the comment was made backwards
    if (startLine && endLine && startLine > endLine) {
      // swap endlines
      const temp1 = startLine;
      startLine = endLine;
      endLine = temp1;

      // swap char indices
      const temp2 = startChar;
      startChar = endChar;
      endChar = temp2;
    } else if (startLine === endLine) {
      // Handle reverse highlight in a single line
      const temp1 = startChar;
      const temp2 = endChar;
      startChar = temp1 < temp2 ? temp1 : temp2;
      endChar = temp1 < temp2 ? temp2 : temp1;
    }

    const newComment = {
      id: commentCounter,
      endChar,
      endLine,
      file: file.id,
      pointDelta: 0.0,
      startChar,
      startLine,
      text: '',
    };
    updateCommentCounter();
    addComment(newComment, file);
  };

  const sortedHighlights = CodePanelUtils.sortHighlights(comments);
  const splitCode = props.file.code.split('\n');

  /* tslint:disable */
  const linesOfCode = readOnly
    ? splitCode.map((item: string, i: number) => {
        if (item == '') {
          return (
            <div key={i} id={i.toString()}>
              &nbsp;
            </div>
          );
        }
        return (
          <div key={i} id={i.toString()}>
            {CodePanelUtils.highlightText(sortedHighlights, item, i)}
          </div>
        );
      })
    : splitCode.map((item: string, i: number) => {
        if (item == '') {
          return (
            <div key={i} id={i.toString()} onMouseUp={onMouseUp}>
              &nbsp;
            </div>
          );
        }
        return (
          <div key={i} id={i.toString()} onMouseUp={onMouseUp}>
            {CodePanelUtils.highlightText(sortedHighlights, item, i)}
          </div>
        );
      });
  /* tslint:enable */

  const numberOfLines = linesOfCode.length;
  const lineNumberStyle = {
    height: `${numberOfLines * 19}px`,
  };

  const codeString = props.file.code;

  return (
    <div className="code">
      <div className="code__highlighted-area">
        <div className="code__syntax-highlighter">
          <SyntaxHighlighter language="javascript" style={googlecode} showLineNumbers={true}>
            {codeString}
          </SyntaxHighlighter>
        </div>
        <div className="code__underlay">
          <div className="code__underlay--line-numbers" style={lineNumberStyle}>
            {numberOfLines}
          </div>
          <div className="code__underlay--code">{linesOfCode}</div>
        </div>
      </div>
      <CommentList
        file={file}
        readOnly={readOnly}
        comments={comments}
        rubricComments={rubricComments}
        activeCommentId={activeCommentId}
        changeActive={changeActive}
        deleteComment={deleteComment}
        updateComment={updateComment}
        saveGrade={saveGrade}
      />
    </div>
  );
};

interface ICommentListProps {
  file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType) => void;
  saveGrade: () => any;
}

interface IBlock {
  startAt: number;
  endAt: number;
}

const CommentList = (props: ICommentListProps) => {
  const {
    activeCommentId,
    changeActive,
    deleteComment,
    file,
    readOnly,
    updateComment,
    rubricComments,
    saveGrade,
  } = props;
  // Store estimated pixel ranges of comment blocks to help with stacking
  const blocks: IBlock[] = [];

  // Sort comments by startLine to help with stacking
  const comments = props.comments.sort((a: CommentType, b: CommentType) => {
    return a.startLine > b.startLine ? 1 : -1;
  });

  const commentNodes = comments.map((comment: CommentType) => {
    // Figure out where to place comment vertically
    // Placement model:
    //    - Make comment position fixed
    //    - Set upper margin at <startLine> em down from top

    let startAt = comment.startLine * CodePanelUtils.pixelsPerLine();

    // If a comment starts in the range of another block, then push it down until it fits
    // Don't need to check for trailing comments because already sorting by startLine
    for (const block of blocks) {
      if (startAt >= block.startAt && startAt < block.endAt) {
        startAt = block.endAt;
      }
    }

    const heightOfComment = CodePanelUtils.heightOfComment(comment, rubricComments[comment.id], activeCommentId);
    const newBlock: IBlock = {
      startAt,
      endAt: startAt + heightOfComment,
    };
    blocks.push(newBlock);

    blocks.sort((a: IBlock, b: IBlock) => {
      return a.startAt - b.startAt;
    });

    const zindex = 100000 - startAt;
    const style: ICSSStyleObject = {
      top: `${startAt}px`,
      zIndex: zindex.toString(),
    };

    const isActive = activeCommentId === comment.id;

    return (
      <Comment
        key={comment.id}
        comment={comment}
        rubricComment={rubricComments[comment.id]}
        style={style}
        readOnly={readOnly}
        file={file}
        active={isActive}
        changeActive={changeActive}
        deleteComment={deleteComment}
        updateComment={updateComment}
        saveGrade={saveGrade}
      />
    );
  });

  return <div className="code__comments">{commentNodes}</div>;
};

const makeReadOnly = (Component: React.ComponentType<any>) => {
  return class WrappedComponent extends React.Component<any, any> {
    public readOnly = true;
    public activeCommentId = undefined;

    public addComment = (comment: any, file: FileType) => {
      return;
    };

    public changeActive = (id: number) => {
      return;
    };

    public deleteComment = (comment: CommentType, file: FileType) => {
      return;
    };

    public updateComment = (commentID: number, newComment: CommentType, file: FileType) => {
      return;
    };

    public saveGrade = () => {
      return;
    };

    public render() {
      return (
        <Component
          {...this.props}
          readOnly={this.readOnly}
          activeCommentId={this.activeCommentId}
          changeActive={this.changeActive}
          deleteComment={this.deleteComment}
          updateComment={this.updateComment}
          saveGrade={this.saveGrade}
        />
      );
    }
  };
};

export { CodePanel, makeReadOnly };
