import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

import EditableComment from './EditableComment';

import { IComment, IFile, ISubmission } from '../../types/common';

interface IProps {
  deductions: number[];
  submission: ISubmission;
  readOnly: boolean;
  addComment: any;
  activeCommentId?: number;
  changeActive: any;
  deleteComment: any;
  updateComment: any;
}

class CodeGrader extends React.Component<IProps, {}> {
  public addComment = (comment: IComment, file: IFile) => {
    const { addComment } = this.props;
    this.props.changeActive(comment.localId);
    addComment(comment, file);
  };

  public changeActive = (id: number) => {
    this.props.changeActive(id);
  };

  public render() {
    const {
      activeCommentId,
      deductions,
      deleteComment,
      readOnly,
      submission,
      updateComment,
    } = this.props;

    return (
      <div className="container-code-grader">
        <Tabs>
          <TabList>
            {submission.files.map((file: IFile, i: number) => {
              const tabTitle = this.getTabTitle(file.name, deductions[i], file.comments.length);
              return (
                <Tab id="{i}" key={i}>
                  {tabTitle}
                </Tab>
              );
            })}
          </TabList>
          {submission.files.map((file: IFile, i: number) => {
            return (
              <TabPanel key={i}>
                <div className="panel-box">
                  <CodeBox file={file} readOnly={readOnly} addComment={this.addComment} />
                  <CommentBox
                    file={file}
                    comments={file.comments}
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

  private getTabTitle = (name: string, deduction: number, numComments: number) => {
    const deductionString = deduction > 0 ? `(-${deduction})` : '';
    const commentFlag =
      numComments > 0 ? <div className="tab-title-num-comments">{numComments}</div> : '';

    return (
      <div className="tab-title">
        {commentFlag}
        <div className="tab-title">{name + deductionString}</div>
      </div>
    );
  };
}

interface ICodeBoxProps {
  file: IFile;
  readOnly: boolean;
  addComment: any;
}

const CodeBox = (props: ICodeBoxProps) => {
  const { file, readOnly } = props;

  const sortedHighlights = props.file.comments.sort((a: IComment, b: IComment) => {
    if (a.startLine === b.startLine) {
      if (a.startChar > b.startChar) {
        return 1;
      }
      return -1;
    }
    if (a.startLine > b.startLine) return 1;
    return -1;
  });

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
      endChar: endIndex,
      endLine: endline,
      file: file.id,
      id: undefined,
      localId: new Date().getTime() / 1000,
      pointDelta: 0.0,
      startChar: startIndex,
      startLine: startline,
      text: '',
    };

    props.addComment(newComment, file);
  };

  const highlightText = (thetext: string, line: number) => {
    for (const highlight of sortedHighlights) {
      if (highlight.startLine < line && highlight.endLine > line) {
        // this line sits between a multi-line highlight
        return (
          <strong id={line.toString()} className={highlight.localId}>
            {thetext}
          </strong>
        );
      }
      if (highlight.startLine === line) {
        let part1 = '';
        let part2 = '';
        let part3 = '';
        // we may be in a partial highlight situation

        // is the whole comment in one line?
        if (highlight.endLine === highlight.startLine) {
          part1 = thetext.substring(0, highlight.startChar);
          part2 = thetext.substring(highlight.startChar, highlight.endChar);
          part3 = thetext.substring(highlight.endChar, thetext.length).replace(/\s*$/, '');
          return (
            <div id={line.toString()}>
              {part1}
              <strong className={highlight.localId}>{part2}</strong>
              {part3}
            </div>
          );
        }
        part1 = thetext.substring(0, highlight.startChar);
        part2 = thetext.substring(highlight.startChar, thetext.length).replace(/\s*$/, '');
        return (
          <div id={line.toString()}>
            {part1}
            <strong className={highlight.localId}>{part2}</strong>
          </div>
        );
      }
      if (highlight.endLine === line) {
        const part1 = thetext.substring(0, highlight.endChar);
        const part2 = thetext.substring(highlight.endChar, thetext.length).replace(/\s*$/, '');
        return (
          <div id={line.toString()}>
            <strong className={highlight.localId}>{part1}</strong>
            {part2}
          </div>
        );
      }
      // otherwise, the highlight ends before our line starts
    }
    return thetext;
  };

  const splitCode = props.file.code.split('\n');

  const linesOfCode = readOnly
    ? splitCode.map((item: any, i: number) => {
      return (
        <div key={i} id={i.toString()}>
          {' '}
          {highlightText(item, i)}{' '}
        </div>
      );
    })
    : splitCode.map((item: any, i: number) => {
      return (
        <div key={i} id={i.toString()} onMouseUp={onMouseUp}>
          {' '}
          {highlightText(item, i)}{' '}
        </div>
      );
    });

  const lineNumbers = splitCode.map((item: any, i: number) => {
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

interface ICommentBoxProps {
  file: IFile;
  comments: IComment[];
  readOnly: boolean;
  activeCommentId?: number;
  changeActive: any;
  deleteComment: any;
  updateComment: any;
}

const CommentBox = (props: ICommentBoxProps) => {
  const {
    activeCommentId,
    changeActive,
    comments,
    deleteComment,
    file,
    readOnly,
    updateComment,
  } = props;
  return (
    <CommentList
      file={file}
      comments={comments}
      readOnly={readOnly}
      activeCommentId={activeCommentId}
      changeActive={changeActive}
      deleteComment={deleteComment}
      updateComment={updateComment}
    />
  );
};

interface ICommentListProps {
  file: IFile;
  comments: IComment[];
  readOnly: boolean;
  activeCommentId?: number;
  changeActive: any;
  deleteComment: any;
  updateComment: any;
}

const CommentList = (props: ICommentListProps) => {
  const { activeCommentId, changeActive, deleteComment, file, readOnly, updateComment } = props;
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

    let startAt = (comment.startLine + 1) * 19; // Each line is 15px

    // If a comment starts in the range of another block, then push it down until it fits
    // Don't need to check for trailing comments because already sorting by startLine

    for (const block of ranges) {
      if (startAt >= block[0] && startAt < block[1]) {
        startAt = block[1];
      }
    }

    // Estimate the pixel size of a comment block
    const dedLines = comment.pointDelta !== 0 ? 1 : 0;

    const lines = (comment.text.length / 36 + 2 + dedLines) * 19;
    const newBlock = [startAt, startAt + lines];
    ranges.push(newBlock);

    ranges.sort((a: any, b: any) => {
      return a[0] - b[0];
    });

    const zindex = 100000 - startAt;
    const style = {
      top: `${startAt}px`,
      zIndex: zindex,
    };

    let isActive = false;
    if (activeCommentId === comment.localId) {
      isActive = true;
    }

    if (readOnly) {
      return <Comment key={comment.localId} comment={comment} style={style} />;
    }
    return (
      <EditableComment
        file={file}
        key={comment.localId}
        comment={comment}
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

interface ICommentProps {
  key: number;
  comment: IComment;
  style: any;
}

const Comment = (props: ICommentProps) => {
  const onMouseEnter = (i: string, e: any) => {
    const elems = document.getElementsByClassName(i);
    [].forEach.call(elems, (elem: any) => {
      elem.style.backgroundColor = '#FAFF91';
    });
  };

  const onMouseLeave = (i: string, e: any) => {
    const elems = document.getElementsByClassName(i);
    [].forEach.call(elems, (elem: any) => {
      elem.style.backgroundColor = '#ffca93';
    });
  };

  let deduction = '';
  if (props.comment.pointDelta && props.comment.pointDelta !== 0) {
    deduction = `(-${props.comment.pointDelta})`;
  }

  return (
    <div
      className="comment"
      style={props.style}
      onMouseEnter={onMouseEnter.bind(props, props.comment.localId.toString())}
      onMouseLeave={onMouseLeave.bind(props, props.comment.localId.toString())}
    >
      <div className="comment-deduction">{deduction}</div>
      {props.comment.text}
    </div>
  );
};

export default CodeGrader;
