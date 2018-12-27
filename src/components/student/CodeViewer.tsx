import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import 'react-tabs/style/react-tabs.css';
import '../../styles/Student.scss';

import { Card, CardText, Chip } from 'react-md';

import CodeBoxUtils from '../../CodeBoxUtils';

import { IAssignment, IComment, ICSSStyleObject, IFile, IFileToCommentsMap, ISubmission } from '../../types/common';

interface IProps {
  submission: ISubmission;
  assignment: IAssignment;
  files: IFile[];
  comments: IFileToCommentsMap;
  getRubricCommentText: (commentID: number) => string;
}

class CodeViewer extends React.Component<IProps, {}> {
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

  public render() {
    const { assignment, submission, files, comments, getRubricCommentText } = this.props;
    // content-box
    return (
      <div className="container-code-viewer">
        <div className="grade">{`Grade: ${submission!.grade}/${assignment!.points}`}</div>
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
                  <CodeBox file={file} comments={comments[file.id]} />
                  <CommentBox comments={comments[file.id]} getRubricCommentText={getRubricCommentText} />
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
}

const CodeBox = (props: ICodeBoxProps) => {
  const sortedHighlights = CodeBoxUtils.sortHighlights(props.comments);
  const splitCode = props.file.code.split('\n');

  const linesOfCode = splitCode.map((item: string, i: number) => {
    return <div key={i}> {CodeBoxUtils.highlightText(sortedHighlights, item, i)} </div>;
  });

  const lineNumbers = splitCode.map((item: string, i: number) => {
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
  getRubricCommentText: (commentID: number) => string;
}

const CommentBox = (props: ICommentBoxProps) => {
  return <CommentList comments={props.comments} getRubricCommentText={props.getRubricCommentText} />;
};

interface ICommentListProps {
  comments: IComment[];
  getRubricCommentText: (commentID: number) => string;
}

interface IBlock {
  startAt: number;
  endAt: number;
}

const CommentList = (props: ICommentListProps) => {
  const { getRubricCommentText } = props;

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

    let startAt = comment.startLine * CodeBoxUtils.pixelsPerLine(); // Each line is 15px

    // If a comment starts in the range of another block, then push it down until it fits
    // Don't need to check for trailing comments because already sorting by startLine
    for (const block of blocks) {
      if (startAt >= block.startAt && startAt < block.endAt) {
        startAt = block.endAt;
      }
    }

    const heightOfComment = CodeBoxUtils.heightOfComment(comment, getRubricCommentText, undefined);
    const newBlock: IBlock = {
      startAt,
      endAt: startAt + heightOfComment,
    };
    blocks.push(newBlock);

    blocks.sort((a: IBlock, b: IBlock) => {
      return a.startAt - b.startAt;
    });

    const style: ICSSStyleObject = {
      top: `${startAt}px`,
    };

    return <Comment key={comment.id} comment={comment} style={style} />;
  });

  return <div className="comment-box">{commentNodes}</div>;
};

interface ICommentProps {
  key: number;
  comment: IComment;
  style: ICSSStyleObject;
}

const Comment = (props: ICommentProps) => {
  const { comment, style } = props;

  const onMouseEnter = (id: string, event: any) => {
    const elems = document.getElementsByClassName(id);
    [].forEach.call(elems, (elem: any) => {
      elem.style.backgroundColor = '#FAFF91';
    });
  };

  const onMouseLeave = (id: string, event: any) => {
    const elems = document.getElementsByClassName(id);
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
