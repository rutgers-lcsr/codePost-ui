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

import * as moment from 'moment';

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
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => void;
  updateSubmissionGrade: () => void;
  showLastEdited: boolean;
  unsavedComments: number[];
}

interface IState {
  commentCounter: number;
  tabIndex: number;
}

class CodePanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    commentCounter: -1,
    tabIndex: 0,
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
    CodePanelUtils.updateCommentPanelHeight();
  };

  public changeActive = (id: number) => {
    this.props.changeActive(id);
    CodePanelUtils.updateCommentPanelHeight();
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

    const pointDeltaSize = pointDeltaLabel && pointDeltaLabel.length >= 4 ? 'tab__title__pointDelta--small' : '';

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
            <div className={`${pointDeltaSize} tab__title__pointDelta${pointDeltaModifier}`}> {pointDeltaLabel}</div>
          </Tooltipped>
        </div>
      </div>
    );
  };

  public onTabSelect = (tabIndex: number) => {
    this.setState({ tabIndex }, () => {
      CodePanelUtils.updateCommentPanelHeight();
    });
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const { activeCommentId, deleteComment, readOnly, files, comments, rubricComments, updateComment } = this.props;

    const { commentCounter } = this.state;

    return (
      <Tabs selectedIndex={this.state.tabIndex} onSelect={this.onTabSelect}>
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
          const box = document.getElementById(`syntax-highlighter-${file.id}`);
          const code = box ? box!.getElementsByTagName('code')[1] : null;

          let requireScroll = false;
          if (box && code && code.getBoundingClientRect().width > box.getBoundingClientRect().width) {
            requireScroll = true;
          }

          return (
            <TabPanel key={`${file.id}-code`}>
              {requireScroll ? <div className={'grade__main-container__scrollIndicator'}>scroll>>></div> : null}
              <Code
                submission={this.props.submission}
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
                showLastEdited={this.props.showLastEdited}
                unsavedComments={this.props.unsavedComments}
              />
            </TabPanel>
          );
        })}
      </Tabs>
    );
  }
}

interface ICodeProps {
  submission: SubmissionType;
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
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => void;
  updateSubmissionGrade: () => void;
  showLastEdited: boolean;
  unsavedComments: number[];
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
    showLastEdited,
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

    // Check to see if the comment was made backwards
    if (startLine !== null && endLine != null && startLine > endLine) {
      // swap endlines
      const temp1 = startLine;
      startLine = endLine;
      endLine = temp1;
    }

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

    if (startLine === endLine) {
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
        return (
          <div key={i} id={`line-${i}`}>
            {CodePanelUtils.highlight(sortedHighlights, item, i)}
          </div>
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
        return (
          <div key={i} id={`line-${i}`} onMouseUp={onMouseUp}>
            {CodePanelUtils.highlight(sortedHighlights, item, i)}
          </div>
        );
      });
  /* tslint:enable */

  const numberOfLines = linesOfCode.length;
  const lineHeight = document.querySelector('div#line-0')
    ? document.querySelector('div#line-0')!.getBoundingClientRect().height
    : 18; // 18 as estimate

  const codeHeight = numberOfLines * lineHeight;

  const lineNumberStyle = {
    height: `${codeHeight}px`,
  };

  const commentPanelStyle = {
    height: `${codeHeight + 20}px`,
  };

  CodePanelUtils.updateCommentPanelHeight(codeHeight + 20);

  const codeString = props.file.code;
  return (
    <div id="scroll-container" className="grade__main-container__right-panel__scroll-container">
      <div className="grade__main-container__tabContent">
        <div className="grade__main-container__tabContent__codePanel">
          <div className="grade__main-container__tabContent__codePanel-container">
            <div className="code__highlighted-area">
              <div id={`syntax-highlighter-${props.file.id}`} className="code__syntax-highlighter">
                <SyntaxHighlighter language="java" style={googlecode} showLineNumbers={true} wrapLines={false}>
                  {codeString}
                </SyntaxHighlighter>
              </div>
              <div className="code__underlay">
                <div id={`code-underlay-pre-${props.file.id}`} className="code__underlay__pre">
                  <div className="code__underlay--line-numbers" style={lineNumberStyle}>
                    {numberOfLines}
                  </div>
                  <div className="code__underlay--code">{linesOfCode}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          id={`comment-panel-${props.file.id}`}
          className="grade__main-container__tabContent__commentPanel"
          style={commentPanelStyle}
        >
          {showLastEdited ? (
            <div className={'grade__main-container__tabContent__commentPanel__lastEdited'}>
              Last edited: {props.submission.dateEdited ? moment(props.submission.dateEdited).format('llll') : '--'}
            </div>
          ) : null}
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
            unsavedComments={props.unsavedComments}
          />
        </div>
      </div>
    </div>
  );
};

const makeReadOnly = (Component: React.ComponentType<any>) => {
  return class WrappedComponent extends React.Component<any, any> {
    public readOnly = true;
    public activeCommentId = undefined;
    public showLastEdited = false;

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
          showLastEdited={false}
          unsavedComments={[]}
        />
      );
    }
  };
};

export { CodePanel, makeReadOnly };
