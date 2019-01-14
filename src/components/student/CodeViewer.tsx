import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import CodePanelUtils from '../../CodePanelUtils';

import { SubmissionType } from '../../infrastructure/submission';

import { ICommentToRubricCommentMap, ICSSStyleObject, IFileToCommentsMap } from '../../types/common';

import { AssignmentType } from '../../infrastructure/assignment';
import { CommentType, withoutEditing } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';

import Comment from '../Comment';

interface IProps {
  submission: SubmissionType;
  assignment: AssignmentType;
  files: FileType[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;
}

class CodeViewer extends React.Component<IProps, {}> {
  public getTabTitle = (file: FileType, comments: CommentType[]) => {
    const deduction = comments.reduce((accumulator: number, currentValue: CommentType) => {
      return accumulator + (currentValue.pointDelta ? currentValue.pointDelta : 0);
    }, 0);
    const deductionString = deduction > 0 ? `(-${deduction})` : '';

    const numComments = comments.length;
    const commentFlag = numComments > 0 ? <div className="tab__comment-count">{numComments}</div> : '';

    return (
      <div className="tab__title">
        {commentFlag}
        <div className="tab__title">{`${file.name} ${deductionString}`}</div>
      </div>
    );
  };

  public render() {
    const { assignment, submission, files, comments, rubricComments } = this.props;
    return (
      <div>
        <div className="code__grade">{`Grade: ${submission!.grade}/${assignment!.points}`}</div>
        <Tabs>
          <TabList>
            {files.map((file: FileType, i: number) => {
              const tabTitle = this.getTabTitle(file, comments[file.id]);
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
                <Code file={file} comments={comments[file.id]} rubricComments={rubricComments} />
              </TabPanel>
            );
          })}
        </Tabs>
      </div>
    );
  }
}

interface ICodeProps {
  file: FileType;
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
}

const Code = (props: ICodeProps) => {
  const sortedHighlights = CodePanelUtils.sortHighlights(props.comments);
  const splitCode = props.file.code.split('\n');

  const linesOfCode = splitCode.map((item: string, i: number) => {
    return <div key={i}> {CodePanelUtils.highlightText(sortedHighlights, item, i)} </div>;
  });

  const lineNumbers = splitCode.map((item: string, i: number) => {
    return (
      <div key={i + 1} className="code__line-numbers__line-number">
        {' '}
        {i + 1}{' '}
      </div>
    );
  });

  return (
    <div className="code">
      <div className="code__line-numbers">{lineNumbers}</div>
      <div className="code__highlighted-area">{linesOfCode}</div>
      <CommentList comments={props.comments} rubricComments={props.rubricComments} file={props.file} />
    </div>
  );
};

interface ICommentListProps {
  comments: CommentType[];
  rubricComments: ICommentToRubricCommentMap;
  file: FileType;
}

interface IBlock {
  startAt: number;
  endAt: number;
}

const CommentList = (props: ICommentListProps) => {
  const { rubricComments } = props;
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

    let startAt = comment.startLine * CodePanelUtils.pixelsPerLine(); // Each line is 15px

    // If a comment starts in the range of another block, then push it down until it fits
    // Don't need to check for trailing comments because already sorting by startLine
    for (const block of blocks) {
      if (startAt >= block.startAt && startAt < block.endAt) {
        startAt = block.endAt;
      }
    }

    const heightOfComment = CodePanelUtils.heightOfComment(comment, rubricComments[comment.id], undefined);
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

    const ReadOnlyComment = withoutEditing(Comment);

    return (
      <ReadOnlyComment
        key={comment.id}
        comment={comment}
        rubricComment={props.rubricComments[comment.id]}
        file={props.file}
        style={style}
      />
    );
  });

  return <div className="code__comments">{commentNodes}</div>;
};
// interface ICommentProps {
//   key: number;
//   comment: CommentType;
//   rubricComment: RubricCommentType | undefined;
//   style: ICSSStyleObject;
//   file: FileType;
// }

// const Comment = (props: ICommentProps) => {
//   const { comment, rubricComment, style } = props;

//   const onMouseEnter = (id: string, event: any) => {
//     const elems = document.getElementsByClassName(id);
//     [].forEach.call(elems, (elem: any) => {
//       elem.style.backgroundColor = '#FAFF91';
//     });
//   };

//   const onMouseLeave = (id: string, event: any) => {
//     const elems = document.getElementsByClassName(id);
//     [].forEach.call(elems, (elem: any) => {
//       elem.style.backgroundColor = '#ffca93';
//     });
//   };

//   let pointDelta = '';
//   if (comment.pointDelta && comment.pointDelta !== 0) {
//     pointDelta = `-${comment.pointDelta}`;
//   }

//   return (
//     <Card
//       className="comment"
//       style={style}
//       onMouseEnter={onMouseEnter.bind(props, comment.id.toString())}
//       onMouseLeave={onMouseLeave.bind(props, comment.id.toString())}
//     >
//       <CardText>
//         {pointDelta === '' ? null : <Chip label={pointDelta} />}
//         {/*// should make slug related rubricComment slug related on text*/}
//         {rubricComment ? <div className="comment__rubric-comment">{rubricComment.text}</div> : null}
//         <div className="comment__text">{comment.text}</div>
//       </CardText>
//     </Card>
//   );
// };
export default CodeViewer;
