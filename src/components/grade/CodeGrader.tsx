import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import EditableComment from './EditableComment';

import { IComment, ICSSStyleObject, IFile, IFileToCommentsMap, IRubricComment, ISubmission } from '../../types/common';

import CodeBoxUtils from '../../CodeBoxUtils';

interface IProps {
  submission: ISubmission;
  files: IFile[];
  comments: IFileToCommentsMap;
  readOnly: boolean;
  addComment: (comment: any, file: IFile) => void;
  activeCommentId?: number;
  changeActive: (id: number | undefined) => void;
  deleteComment: (comment: IComment, file: IFile) => void;
  updateComment: (commentID: number, newComment: IComment, file: IFile) => void;
  getRubricComment: (rubricCommentID: number) => IRubricComment | undefined;
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
    const deduction = comments.reduce((accumulator: number, currentValue: IComment) => {
      return accumulator + currentValue.pointDelta;
    }, 0);
    const deductionString = deduction > 0 ? `(-${deduction})` : '';

    const numComments = comments.length;
    const commentFlag = numComments > 0 ? <div className="tab-title-num-comments">{numComments}</div> : '';

    return (
      <div className="tab-title">
        {commentFlag}
        <div className="tab-title">{`${file.name} ${deductionString}`}</div>
      </div>
    );
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const { activeCommentId, deleteComment, readOnly, files, comments, updateComment, getRubricComment } = this.props;

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
                    readOnly={readOnly}
                    activeCommentId={activeCommentId}
                    changeActive={this.changeActive}
                    deleteComment={deleteComment}
                    updateComment={updateComment}
                    getRubricComment={getRubricComment}
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
    const selectedText = window.getSelection().toString();
    if (selectedText === '') {
      console.log('nothing selected');
      return;
    }

    // we're trying to make a comment by highlighting

    // figure out where the comment starts and stops
    const selection = window.getSelection();

    const anchorParent = $(selection.anchorNode).closest('div');
    const extentParent = $(selection.extentNode).closest('div');

    // console.log("contents", anchorParent.contents())

    const startid = anchorParent.attr('id');
    let startline = startid ? parseInt(startid, undefined) : undefined;
    // <font /> html tag is disallowed now
    // sometimes endline will find the parent div
    // sometimes it will find the formerly <font><strong> div
    // both will contain the line number as the id
    // there might be a better way to handle this
    const endid = extentParent.attr('id');
    let endline = endid ? parseInt(endid, undefined) : undefined;

    // console.log(startline, endline, anchorParent, extentParent)
    // console.log("----", selection)

    // If el is not and does not contain targetEl
    //    Return: the number of text characters inside el
    // Otherwise:
    //    Return the number of characters occuring before targetEl
    //    in el w.r.t. DOM order
    const getCharsBefore = (el: any, targetEl: any) => {
      // el is targetEl, so no preceeding chars
      if ($(el).is(targetEl)) {
        return 0;
      }

      // if el does not contain targetEl, return the text length
      // of el
      if ($(el).find(targetEl).length === 0) {
        // console.log('div does not contain el')
        // console.log(el)
        return $(el).text().length;
      }

      // last case: el is a parent of targetEl, so recursively repeat
      // on children of el
      let toRet = 0;
      $(el)
        .contents()
        .each((c: any) => {
          toRet += getCharsBefore(c, targetEl);
          if ($(c).find(targetEl).length !== 0 || $(c).is(targetEl)) {
            return; // break out if we find the element
          }
        });
      return toRet;
    };

    let startIndex = getCharsBefore(anchorParent, selection.anchorNode);
    startIndex += selection.anchorOffset;

    let endIndex = getCharsBefore(extentParent, selection.extentNode);
    endIndex += selection.extentOffset;

    // Check to see if the comment was made backwards
    if (startline && endline && startline > endline) {
      // swap endlines
      const temp1 = startline;
      startline = endline;
      endline = temp1;

      // swap indexes
      const temp2 = startIndex;
      startIndex = endIndex;
      endIndex = temp2;
    } else if (startline === endline) {
      // Handle reverse highlight in a single line
      const temp1 = startIndex;
      const temp2 = endIndex;
      startIndex = temp1 < temp2 ? temp1 : temp2;
      endIndex = temp1 < temp2 ? temp2 : temp1;
    }

    const newComment = {
      id: commentCounter,
      endChar: endIndex,
      endLine: endline,
      file: file.id,
      pointDelta: 0.0,
      startChar: startIndex,
      startLine: startline,
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
  readOnly: boolean;
  activeCommentId?: number;
  changeActive: (id: number | number) => void;
  deleteComment: (comment: IComment, file: IFile) => void;
  updateComment: (commentID: number, newComment: IComment, file: IFile) => void;
  getRubricComment: (rubricCommentID: number) => IRubricComment | undefined;
}

const CommentList = (props: ICommentListProps) => {
  const { activeCommentId, changeActive, deleteComment, file, readOnly, updateComment, getRubricComment } = props;
  // Store estimated pixel ranges of comment blocks to help with stacking
  const ranges: any[] = [];

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
    for (const block of ranges) {
      if (startAt >= block[0] && startAt < block[1]) {
        startAt = block[1];
      }
    }

    const heightOfComment = CodeBoxUtils.heightOfComment(comment, getRubricComment, activeCommentId);
    const newBlock = [startAt, startAt + heightOfComment];
    ranges.push(newBlock);

    ranges.sort((a: any, b: any) => {
      return a[0] - b[0];
    });

    const zindex = 100000 - startAt;
    const style: ICSSStyleObject = {
      top: `${startAt}px`,
      zIndex: zindex.toString(),
    };

    let isActive = false;
    if (activeCommentId === comment.id) {
      isActive = true;
    }

    return (
      <EditableComment
        readOnly={readOnly}
        file={file}
        key={comment.id}
        comment={comment}
        style={style}
        active={isActive}
        changeActive={changeActive}
        deleteComment={deleteComment}
        updateComment={updateComment}
        getRubricComment={getRubricComment}
      />
    );
  });

  return <div className="comment-box">{commentNodes}</div>;
};

export default CodeGrader;
