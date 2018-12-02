import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import 'react-tabs/style/react-tabs.css';
import '../styles/Student.scss';

import { IAssignment, IComment, IFile, ISubmission } from '../types/common';

interface IProps {
  deductions: number[];
  submission: ISubmission;
  assignment: IAssignment;
}

class CodeViewer extends React.Component<IProps, {}> {
  public render() {
    const { assignment, deductions, submission } = this.props;
    // content-box
    return (
      <div className="container-code-viewer">
        <div className="grade">{`Grade: ${submission!.grade}/${assignment!.points}`}</div>
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
                  <CodeBox file={file} />
                  <CommentBox comments={file.comments} />
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
}

const CodeBox = (props: ICodeBoxProps) => {
  const sortedHighlights = props.file.comments.sort((a: IComment, b: IComment) => {
    return a.startLine > b.startLine ? 1 : -1;
  });

  const highlightText = (thetext: string, line: number) => {
    for (const highlight of sortedHighlights) {
      if (highlight.startLine < line && highlight.endLine > line) {
        // this line sits between a multi-line highlight
        return <strong className={highlight.id}>{thetext}</strong>;
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
            <div>
              {part1}
              <strong className={highlight.id}>{part2}</strong>
              {part3}
            </div>
          );
        }
        part1 = thetext.substring(0, highlight.startChar);
        part2 = thetext.substring(highlight.startChar, thetext.length).replace(/\s*$/, '');
        return (
          <div>
            {part1}
            <strong className={highlight.id}>{part2}</strong>
          </div>
        );
      }

      if (highlight.endLine === line) {
        const part1 = thetext.substring(0, highlight.endChar);
        const part2 = thetext.substring(highlight.endChar, thetext.length).replace(/\s*$/, '');
        return (
          <div>
            <strong className={highlight.id}>{part1}</strong>
            {part2}
          </div>
        );
      }
      // otherwise, the highlight ends before our line starts
    }
    return thetext;
  };

  const splitCode = props.file.code.split('\n');
  const linesOfCode = splitCode.map((item: any, i: number) => {
    return <div key={i}> {highlightText(item, i)} </div>;
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

    const lines = (comment.text.length / 36 + 1 + dedLines) * 19;
    const newBlock = [startAt, startAt + lines];
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

  let deduction;
  if (props.comment.pointDelta == null || props.comment.pointDelta === 0) {
    deduction = '';
  } else {
    deduction = `(-${props.comment.pointDelta})`;
  }

  return (
    <div
      className="comment"
      style={props.style}
      onMouseEnter={onMouseEnter.bind(props, props.comment.id.toString())}
      onMouseLeave={onMouseLeave.bind(props, props.comment.id.toString())}
    >
      <div>{deduction}</div>
      {props.comment.text}
    </div>
  );
};
export default CodeViewer;
