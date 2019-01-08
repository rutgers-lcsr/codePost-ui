import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import EditableComment from './EditableComment';

import {
  IComment,
  ICommentToRubricCommentMap,
  ICSSStyleObject,
  IFile,
  IFileToCommentsMap,
  ISubmission,
} from '../../types/common';

import CodeBoxUtils from '../../CodeBoxUtils';

interface IProps {
  submission: ISubmission;
  files: IFile[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  addComment: (comment: any, file: IFile) => void;
  activeCommentId?: number;
  changeActive: (id: number | undefined) => void;
  deleteComment: (comment: IComment, file: IFile) => void;
  updateComment: (commentID: number, newComment: IComment, file: IFile) => void;
}

interface IState {
  commentCounter: number;
}

class CodeGrader extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    commentCounter: -1,
  };

  //////////////////////////////////////
  // Lifecycle Methods
  //////////////////////////////////////

  //////////////////////////////////////
  // Prop Methods
  //////////////////////////////////////

  public addComment = (comment: IComment, file: IFile) => {
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

  public getTabTitle = (file: IFile, comments: IComment[]) => {
    const pointDelta = comments.reduce((accumulator: number, currentValue: IComment) => {
      return accumulator + currentValue.pointDelta;
    }, 0);
    const pointDeltaString = pointDelta > 0 ? `(-${pointDelta})` : '';

    const numComments = comments.length;
    const commentFlag = numComments > 0 ? <div className="tab-title-num-comments">{numComments}</div> : '';

    return (
      <div className="tab-title">
        {commentFlag}
        <div className="tab-title">{`${file.name} ${pointDeltaString}`}</div>
      </div>
    );
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const { activeCommentId, deleteComment, readOnly, files, comments, rubricComments, updateComment } = this.props;

    const { commentCounter } = this.state;

    return (
      <div className="container-code-grader">
        <Tabs>
          <TabList>
            {files.map((file: IFile, i: number) => {
              const tabTitle = this.getTabTitle(file, comments[file.id]);
              return (
                <Tab id="{i}" key={i}>
                  {tabTitle}
                </Tab>
              );
            })}
          </TabList>
          {files.map((file: IFile, i: number) => {
            return (
              <TabPanel key={i}>
                <div className="panel-box">
                  <CodeBox
                    file={file}
                    readOnly={readOnly}
                    addComment={this.addComment}
                    commentCounter={commentCounter}
                    updateCommentCounter={this.updateCommentCounter}
                    comments={comments[file.id]}
                  />
                  <CommentList
                    file={file}
                    comments={comments[file.id]}
                    rubricComments={rubricComments}
                    readOnly={readOnly}
                    activeCommentId={activeCommentId}
                    changeActive={this.changeActive}
                    deleteComment={deleteComment}
                    updateComment={updateComment}
                  />
                </div>
              </TabPanel>
            );
          })}
        </Tabs>
      </div>
    );
  }
}

interface ICodeBoxProps {
  file: IFile;
  comments: IComment[];
  readOnly: boolean;
  // giving a partial comment breaks the IComment type constraint, could make some fields optional?
  addComment: (comment: any, file: IFile) => void;
  commentCounter: number;
  updateCommentCounter: () => void;
}

const CodeBox = (props: ICodeBoxProps) => {
  const { file, readOnly, commentCounter, updateCommentCounter, addComment, comments } = props;

  const onMouseUp = (event: any) => {
    const selection = window.getSelection();

    if (selection.toString() === '') {
      console.log('nothing selected');
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

  const sortedHighlights = CodeBoxUtils.sortHighlights(comments);
  const splitCode = props.file.code.split('\n');

  const linesOfCode = readOnly
    ? splitCode.map((item: string, i: number) => {
      return (
        <div key={i} id={i.toString()}>
          {' '}
          {CodeBoxUtils.highlightText(sortedHighlights, item, i)}{' '}
        </div>
      );
    })
    : splitCode.map((item: string, i: number) => {
      return (
        <div key={i} id={i.toString()} onMouseUp={onMouseUp}>
          {' '}
          {CodeBoxUtils.highlightText(sortedHighlights, item, i)}{' '}
        </div>
      );
    });

  const lineNumbers = splitCode.map((item: string, i: number) => {
    return (
      <div key={i} className="line-number">
        {' '}
        {i}{' '}
      </div>
    );
  });

  return (
    <div className="code-box">
      <div className="line-numbers">{lineNumbers}</div>
      <div className="highlighted-area">{linesOfCode}</div>
    </div>
  );
};

interface ICommentListProps {
  file: IFile;
  comments: IComment[];
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: IComment, file: IFile) => void;
  updateComment: (commentID: number, newComment: IComment, file: IFile) => void;
}

interface IBlock {
  startAt: number;
  endAt: number;
}

const CommentList = (props: ICommentListProps) => {
  const { activeCommentId, changeActive, deleteComment, file, readOnly, updateComment, rubricComments } = props;
  // Store estimated pixel ranges of comment blocks to help with stacking
  const blocks: IBlock[] = [];

  // Sort comments by startLine to help with stacking
  const comments = props.comments.sort((a: IComment, b: IComment) => {
    return a.startLine > b.startLine ? 1 : -1;
  });

  const commentNodes = comments.map((comment: IComment) => {
    // Figure out where to place comment vertically
    // Placement model:
    //    - Make comment position fixed
    //    - Set upper margin at <startLine> em down from top

    let startAt = comment.startLine * CodeBoxUtils.pixelsPerLine();

    // If a comment starts in the range of another block, then push it down until it fits
    // Don't need to check for trailing comments because already sorting by startLine
    for (const block of blocks) {
      if (startAt >= block.startAt && startAt < block.endAt) {
        startAt = block.endAt;
      }
    }

    const heightOfComment = CodeBoxUtils.heightOfComment(comment, rubricComments[comment.id], activeCommentId);
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
      <EditableComment
        readOnly={readOnly}
        file={file}
        key={comment.id}
        comment={comment}
        rubricComment={rubricComments[comment.id]}
        style={style}
        active={isActive}
        changeActive={changeActive}
        deleteComment={deleteComment}
        updateComment={updateComment}
      />
    );
  });

  return <div className="comment-box">{commentNodes}</div>;
};

export default CodeGrader;
