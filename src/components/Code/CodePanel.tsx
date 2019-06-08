import * as React from 'react';
import { Tooltipped } from 'react-md';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../types/common';

import CodePanelUtils from './CodePanelUtils';

import { CommentType } from '../../infrastructure/comment';
import { FileType } from '../../infrastructure/file';
import { AnonymousSubmissionType } from '../../infrastructure/submission';

// @ts-ignore
import Code from './Code';
import MarkdownCode from './MarkdownCode';

import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';

const turndown = new TurndownService();
turndown.use(turndownPluginGfm.tables);

export interface ICodePanelProps {
  submission: AnonymousSubmissionType;
  files: FileType[];
  comments: IFileToCommentsMap;
  rubricComments: ICommentToRubricCommentMap;
  readOnly: boolean;
  addComment: (comment: any, file: FileType) => boolean;
  activeCommentId?: number;
  changeActive: (id: number | undefined) => void;
  deleteComment: (comment: CommentType, file: FileType) => void;
  updateComment: (commentID: number, newComment: CommentType, file: FileType, isSaved: boolean) => boolean;
  updateSubmissionGrade: () => void;
  unsavedComments: number[];
}

interface ICodePanelState {
  commentCounter: number; // negative decrementer for new, unsaved comments
  tabIndex: number;
  requireScroll: boolean;
}

class CodePanel extends React.Component<ICodePanelProps, ICodePanelState> {
  public state: Readonly<ICodePanelState> = {
    commentCounter: -1,
    tabIndex: 0,
    requireScroll: window.innerWidth < 1300,
  };

  public addComment = (comment: CommentType, file: FileType) => {
    this.props.changeActive(comment.id);
    const didCommentAdd = this.props.addComment(comment, file);
    CodePanelUtils.updateCommentPanelHeight();
    return didCommentAdd;
  };

  public changeActive = (id: number) => {
    this.props.changeActive(id);
    CodePanelUtils.updateCommentPanelHeight();
  };

  public updateCommentCounter = (): void => {
    this.setState({ commentCounter: this.state.commentCounter - 1 });
  };

  public getPointDeltaInFile = (
    file: FileType,
    comments: CommentType[],
    rubricComments: ICommentToRubricCommentMap,
  ): number => {
    return comments.reduce((accumulator: number, comment: CommentType) => {
      if (comment.pointDelta && comment.id > 0) {
        return accumulator + comment.pointDelta;
      } else if (rubricComments[comment.id] && comment.id > 0) {
        return accumulator + rubricComments[comment.id].pointDelta;
      } else {
        return accumulator;
      }
    }, 0);
  };

  public getTabTitle = (file: FileType, comments: CommentType[], rubricComments: ICommentToRubricCommentMap) => {
    const pointDelta = this.getPointDeltaInFile(file, comments, rubricComments);
    const pointDeltaLabel = pointDelta > 0 ? `-${pointDelta}` : pointDelta < 0 ? `+${pointDelta * -1}` : '';
    const pointDeltaModifier =
      pointDelta === null ? '--null' : pointDelta > 0 ? '--negative' : pointDelta < 0 ? '--positive' : '--zero';

    const pointDeltaSize = pointDeltaLabel && pointDeltaLabel.length >= 4 ? 'tab__title__pointdelta--small' : '';

    const numComments = comments.length;
    const commentFlag = numComments > 0 ? <div className="tab__title__comment-count">{numComments}</div> : <div />;

    return (
      <div className="tab__title">
        <div className="tab__title__file-name">{file.name}</div>
        <div className="tab__title__badges">
          <Tooltipped label="Number of comments" delay={750} setPosition={true} position="left">
            {commentFlag}
          </Tooltipped>
          <Tooltipped label="Amount deducted" delay={750} setPosition={true} position="left">
            <div className={`${pointDeltaSize} tab__title__pointdelta${pointDeltaModifier}`}> {pointDeltaLabel}</div>
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

  public getMarkdownFromJupyter = (code: string) => {
    let markdown = '';
    const jupyterJson = JSON.parse(code);

    jupyterJson.cells.forEach((cell: any) => {
      if (cell.cell_type === 'markdown') {
        markdown += cell.source.join('');
      }

      if (cell.cell_type === 'code') {
        markdown += '```python\n';
        markdown += cell.source.join('');
        markdown += '\n```';

        cell.outputs.map((output: any) => {
          if (output.data) {
            Object.keys(output.data).forEach((key) => {
              switch (key) {
                case 'text/plain':
                  markdown += '\n```output\n';
                  markdown += output.data['text/plain'].join('');
                  markdown += '\n```\n';
                  break;
                case 'text/html':
                  markdown += '\n';
                  // Convert HTML to markdown
                  markdown += turndown.turndown(output.data['text/html'].join(''));
                  markdown += '\n';
                  break;
                case 'image/png':
                  // We need to trim the spaces on the end of the tags, or the data won't be recognized
                  markdown += `\n![](data:image/png;base64,${output.data['image/png'].trim()})\n`;
                  break;
              }
            });
          }
          if (output.name === 'stdout') {
            if (output.text) {
              markdown += '\n```output\n';
              markdown += output.text
                .map((line: string) => {
                  return line.replace(']', ']\n').trim();
                })
                .join('');
              markdown += '\n```\n';
            }
          }
          if (output.output_type === 'error') {
            if (output.traceback) {
              markdown += '\n```output\nERRORS --->\n\n';
              markdown += output.traceback.join('\n');
              markdown += '\n```\n';
            }
          }
        });
      }

      markdown += '\n\n';
    });

    return markdown;
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const { activeCommentId, deleteComment, readOnly, files, rubricComments, updateComment } = this.props;

    const { commentCounter } = this.state;

    return (
      <Tabs selectedIndex={this.state.tabIndex} onSelect={this.onTabSelect}>
        <TabList className="tabs--grade">
          {files.map((file: FileType, i: number) => {
            const tabTitle = this.getTabTitle(file, this.props.comments[file.id], rubricComments);
            return (
              <Tab key={file.id} className="tabs--grade__tab">
                {tabTitle}
              </Tab>
            );
          })}
        </TabList>
        {files.map((file: FileType, i: number) => {
          const sortedComments = this.props.comments[file.id];

          const isJupyter = file.extension === ('ipynb' || '.ipynb');
          const isMarkdown = isJupyter || file.extension === ('md' || '.md');
          const markdown = isJupyter ? this.getMarkdownFromJupyter(file.code) : file.code;

          return (
            <TabPanel key={`${file.id}-code`}>
              {this.state.requireScroll ? (
                <div className={'grade__main-container__scroll-indicator'}>scroll>>></div>
              ) : null}

              {isMarkdown ? (
                <MarkdownCode
                  submission={this.props.submission}
                  file={file}
                  comments={sortedComments}
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
                  unsavedComments={this.props.unsavedComments}
                  markdown={markdown}
                />
              ) : (
                // @ts-ignore
                <Code
                  submission={this.props.submission}
                  file={file}
                  comments={sortedComments}
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
                  unsavedComments={this.props.unsavedComments}
                />
              )}
            </TabPanel>
          );
        })}
      </Tabs>
    );
  }
}

const makeReadOnly = (Component: React.ComponentType<any>) => {
  return class WrappedComponent extends React.Component<any, any> {
    public readOnly = true;
    public activeCommentId = undefined;

    public addComment = (comment: any, file: FileType): boolean => {
      return false;
    };

    public changeActive = (id: number) => {
      return;
    };

    public deleteComment = (comment: CommentType, file: FileType) => {
      return;
    };

    public updateComment = (commentID: number, newComment: CommentType, file: FileType) => {
      return false;
    };

    public render() {
      return (
        <Component
          {...this.props}
          addComment={this.addComment}
          readOnly={this.readOnly}
          activeCommentId={this.activeCommentId}
          changeActive={this.changeActive}
          deleteComment={this.deleteComment}
          updateComment={this.updateComment}
          unsavedComments={[]}
        />
      );
    }
  };
};

export { CodePanel, makeReadOnly };
