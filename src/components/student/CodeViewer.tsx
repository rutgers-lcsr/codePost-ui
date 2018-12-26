import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import 'react-tabs/style/react-tabs.css';
import '../../styles/Student.scss';

import { Card, CardText, Chip } from 'react-md';

import CodeBoxUtils from '../../CodeBoxUtils';

import { IAssignment, IComment, IFile, IFileToCommentsMap, ISubmission } from '../../types/common';

interface IProps {
  deductions: number[];
  submission: ISubmission;
  assignment: IAssignment;
  files: IFile[];
  comments: IFileToCommentsMap;
}

class CodeViewer extends React.Component<IProps, {}> {
  public render() {
    const { assignment, deductions, submission, files, comments } = this.props;
    // content-box
    return (
      <div className="container-code-viewer">
        <div className="grade">{`Grade: ${submission!.grade}/${assignment!.points}`}</div>
        <Tabs>
          <TabList>
            {files.map((file: IFile, i: number) => {
              const tabTitle = this.getTabTitle(file.name, deductions[i], comments[file.id].length);
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
                  <CodeBox file={file} comments={comments[file.id]} />
                  <CommentBox comments={comments[file.id]} />
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
    const commentFlag = numComments > 0 ? <div className="tab-title-num-comments">{numComments}</div> : '';

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
  comments: IComment[];
}

const CodeBox = (props: ICodeBoxProps) => {
  const sortedHighlights = CodeBoxUtils.sortHighlights(props.comments);
  const splitCode = props.file.code.split('\n');

  const linesOfCode = splitCode.map((item: any, i: number) => {
    return <div key={i}> {CodeBoxUtils.highlightText(sortedHighlights, item, i)} </div>;
  });

  const lineNumbers = splitCode.map((item: any, i: number) => {
    return (
      <div key={i + 1} className="line-number">
        {' '}
        {i + 1}{' '}
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
  comments: IComment[];
}

const CommentBox = (props: ICommentBoxProps) => {
  return <CommentList comments={props.comments} />;
};

interface ICommentListProps {
  comments: IComment[];
}

const CommentList = (props: ICommentListProps) => {
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

    let startAt = comment.startLine * CodeBoxUtils.pixelsPerLine(); // Each line is 15px

    // If a comment starts in the range of another block, then push it down until it fits
    // Don't need to check for trailing comments because already sorting by startLine

    for (const block of ranges) {
      if (startAt >= block[0] && startAt < block[1]) {
        startAt = block[1];
      }
    }

    const heightOfComment = CodeBoxUtils.heightOfComment(comment, undefined);
    const newBlock = [startAt, startAt + heightOfComment];
    ranges.push(newBlock);

    ranges.sort((a: any, b: any) => {
      return a[0] - b[0];
    });

    const style = {
      top: `${startAt}px`,
    };

    return <Comment key={comment.id} comment={comment} style={style} />;
  });

  return <div className="comment-box">{commentNodes}</div>;
};

interface ICommentProps {
  key: number;
  comment: IComment;
  style: any;
}

const Comment = (props: ICommentProps) => {
  const { comment, style } = props;

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

  let pointDelta = '';
  if (comment.pointDelta && comment.pointDelta !== 0) {
    pointDelta = `-${comment.pointDelta}`;
  }

  return (
    <Card
      className="comment"
      style={style}
      onMouseEnter={onMouseEnter.bind(props, comment.id.toString())}
      onMouseLeave={onMouseLeave.bind(props, comment.id.toString())}
    >
      <CardText>
        {pointDelta === '' ? null : <Chip label={pointDelta} />}
        {/*// should make slug related rubricComment slug related on text*/}
        {comment.rubricComment ? <div className="comment-rubric">{comment.rubricComment}</div> : null}
        <div className="comment-text">{comment.text}</div>
      </CardText>
    </Card>
  );
};
export default CodeViewer;
