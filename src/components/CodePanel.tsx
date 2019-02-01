import * as React from 'react';
import { Tooltipped } from 'react-md';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import CommentList from './CommentList';

import { ICommentToRubricCommentMap, IFileToCommentsMap, POSITION } from '../types/common';

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
  updateSubmissionGrade: () => void;
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
    const pointDelta = comments.reduce((accumulator: number, comment: CommentType) => {
      if (comment.pointDelta && comment.id > 0) {
        return accumulator + comment.pointDelta;
      } else if (rubricComments[comment.id] && comment.id > 0) {
        return accumulator + rubricComments[comment.id].pointDelta;
      } else {
        return accumulator;
      }
    }, 0);
    const pointDeltaLabel = pointDelta > 0 ? `-${pointDelta}` : pointDelta < 0 ? `+${pointDelta * -1}` : '';
    const pointDeltaModifier =
      pointDelta === null ? '--null' : pointDelta > 0 ? '--negative' : pointDelta < 0 ? '--positive' : '--zero';

    const numComments = comments.length;
    const commentFlag = numComments > 0 ? <div className="tab__title__comment-count">{numComments}</div> : <div />;

    return (
      <div className="tab__title">
        <div className="tab__title__fileName">{file.name}</div>
        <div className="tab__title__badges">
          <Tooltipped label="Number of comments" delay={750} setPosition={true} position="left">
            {commentFlag}
          </Tooltipped>
          <Tooltipped label="Amount deducted" delay={750} setPosition={true} position="left">
            <div className={`tab__title__pointDelta${pointDeltaModifier}`}> {pointDeltaLabel}</div>
          </Tooltipped>
        </div>
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
      <Tabs>
        <TabList className="tabList--Grade">
          {files.map((file: FileType, i: number) => {
            const tabTitle = this.getTabTitle(file, comments[file.id], rubricComments);
            return (
              <Tab key={file.id} className="tabList--Grade__tab">
                {tabTitle}
              </Tab>
            );
          })}
        </TabList>
        {files.map((file: FileType, i: number) => {
          return (
            <TabPanel key={`${file.id}-code`}>
              <div className={'grade__main-container__scrollIndicator'}>scroll>>></div>
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
                updateSubmissionGrade={this.props.updateSubmissionGrade}
              />
            </TabPanel>
          );
        })}
      </Tabs>
    );
  }
}

// //       <TabsContainer defaultTabIndex={0} className="grade__main-container__right-panel__tabs">
//         <Tabs className="md-tabs--Grade" tabId="simple-tab">
//           {files.map((file: FileType, i: number) => {
//             const tabTitle = this.getTabTitle(file, comments[file.id], rubricComments);
//             return (
//               <Tab key={i} style={{ color: '#000000' }} label={tabTitle}>
//                 <Code
//                   file={file}
//                   comments={comments[file.id]}
//                   rubricComments={rubricComments}
//                   readOnly={readOnly}
//                   addComment={this.addComment}
//                   commentCounter={commentCounter}
//                   updateCommentCounter={this.updateCommentCounter}
//                   activeCommentId={activeCommentId}
//                   changeActive={this.changeActive}
//                   deleteComment={deleteComment}
//                   updateComment={updateComment}
//                   updateSubmissionGrade={this.props.updateSubmissionGrade}
//                 />
//               </Tab>
//             );
//           })}
//         </Tabs>
//       </TabsContainer>

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
  updateSubmissionGrade: () => void;
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
  } = props;

  const onMouseUp = (event: any) => {
    const selection = window.getSelection();

    if (selection.toString() === '') {
      return;
    }

    // Hack to avoid messing with Node type checking
    const anchorParent: any = selection.anchorNode.parentNode;
    let startLine = +anchorParent.id.split('-')[1];

    const extentParent: any = selection.extentNode.parentNode;
    let endLine = +extentParent.id.split('-')[1];

    let startChar = CodePanelUtils.getSelectionOffsetRelativeToParent(
      document.querySelector(`div#line-${startLine}`),
      null,
      POSITION.Start,
    );
    let endChar = CodePanelUtils.getSelectionOffsetRelativeToParent(
      document.querySelector(`div#line-${endLine}`),
      null,
      POSITION.End,
    );

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

  const sortedHighlights = CodePanelUtils.sortComments(comments);
  const splitCode = props.file.code.split('\n');

  /* tslint:disable */
  const linesOfCode = readOnly
    ? splitCode.map((item: string, i: number) => {
        // Don't skip rendering lines with no text
        if (item == '') {
          return (
            <div key={i} id={`line-${i}`}>
              &nbsp;
            </div>
          );
        }
        CodePanelUtils.highlight(sortedHighlights, item, i);
        return (
          <div key={i} id={`line-${i}`} dangerouslySetInnerHTML={CodePanelUtils.highlight(sortedHighlights, item, i)} />
        );
      })
    : splitCode.map((item: string, i: number) => {
        // Don't skip rendering lines with no text
        if (item == '') {
          return (
            <div key={i} id={`line-${i}`} onMouseUp={onMouseUp}>
              &nbsp;
            </div>
          );
        }
        CodePanelUtils.highlight(sortedHighlights, item, i);
        return (
          <div
            key={i}
            id={`line-${i}`}
            onMouseUp={onMouseUp}
            dangerouslySetInnerHTML={CodePanelUtils.highlight(sortedHighlights, item, i)}
          />
        );
      });
  /* tslint:enable */

  const numberOfLines = linesOfCode.length;
  const lineHeight = document.querySelector('div#line-0')
    ? document.querySelector('div#line-0')!.getBoundingClientRect().height
    : 19; // 19 as estimate
  const lineNumberStyle = {
    height: `${numberOfLines * lineHeight}px`,
  };

  const codeString = props.file.code;
  return (
    <div className="grade__main-container__tabContent">
      <div id="scroll-area" className="grade__main-container__tabContent__codePanel">
        <div className="code__highlighted-area">
          <div className="code__syntax-highlighter">
            <SyntaxHighlighter language="java" style={googlecode} showLineNumbers={true}>
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
      </div>
      <div className="grade__main-container__tabContent__commentPanel">
        <CommentList
          file={file}
          readOnly={readOnly}
          comments={comments}
          rubricComments={rubricComments}
          activeCommentId={activeCommentId}
          changeActive={changeActive}
          deleteComment={deleteComment}
          updateComment={updateComment}
          updateSubmissionGrade={props.updateSubmissionGrade}
        />
      </div>
    </div>
  );
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

    public render() {
      return (
        <Component
          {...this.props}
          readOnly={this.readOnly}
          activeCommentId={this.activeCommentId}
          changeActive={this.changeActive}
          deleteComment={this.deleteComment}
          updateComment={this.updateComment}
        />
      );
    }
  };
};

export { CodePanel, makeReadOnly };
