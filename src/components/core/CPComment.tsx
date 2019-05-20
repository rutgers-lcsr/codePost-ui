import * as React from 'react';

import { Badge, Input } from 'antd';
const { TextArea } = Input;

// We use ts-ignore since Popover never explicitly used. We just use the classNames
// @ts-ignore
import { Popover } from 'antd';

import CPButton from './CPButton';
import CPPointInput from './CPPointInput';

import { CommentType } from '../../infrastructure/comment';
import { RubricCommentType } from '../../infrastructure/rubricComment';

export type CPCommentType = 'readonly' | 'active' | 'inactive';

interface ICPCommentProps {
  commentType: CPCommentType;

  comment: CommentType;
  rubricComment?: RubricCommentType;
}

class CPComment extends React.Component<ICPCommentProps, {}> {
  public render() {
    const className = `cp-comment cp-comment--${this.props.commentType} ant-popover ant-popover-placement-rightTop`;

    const commentElements: { [key: string]: React.ReactNode } = {
      line: null,
      points: null,
      status: null,
      comment: null,
      rubricComment: null,
      saveButton: null,
      deleteButton: null,
      author: null,
    };

    commentElements.line = (
      <span className="cp-label--mid-bold cp-label--italic">Line {this.props.comment.startLine}</span>
    );

    if (this.props.comment.author) {
      commentElements.author = (
        <span className="cp-label--italic cp-label--very-small">Author: {this.props.comment.author}</span>
      );
    }

    let points: number = 0;
    if (this.props.rubricComment) {
      points = this.props.rubricComment.pointDelta;
    } else {
      points = this.props.comment.pointDelta ? this.props.comment.pointDelta : 0;
    }

    let badge = null;
    if (points > 0) {
      badge = <Badge count={points * -1} className="cp-badge" style={{ backgroundColor: '#f64852' }} />;
    } else if (points < 0) {
      badge = <Badge count={points * -1} className="cp-badge" style={{ backgroundColor: '#24be85' }} />;
    } else {
      badge = <Badge count={points} className="cp-badge" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />;
    }

    if (this.props.commentType === 'active') {
      commentElements.points = <CPPointInput />;
      commentElements.comment = <TextArea autosize className="cp-comment__text-area" />;
      commentElements.status = <span className="cp-label--small cp-label--italic">Draft</span>;
      commentElements.saveButton = <CPButton cpType="secondary" icon="save" />;
      commentElements.deleteButton = <CPButton cpType="danger" icon="delete" />;
    }

    if (this.props.commentType === 'inactive') {
      commentElements.points = badge;
      commentElements.comment = (
        <div className="cp-comment__comment">{this.props.comment.text ? this.props.comment.text : ''}</div>
      );
      commentElements.status = <span className="cp-label--small cp-label--italic cp-label--success">Saved!</span>;
      commentElements.deleteButton = <CPButton cpType="danger" icon="delete" />;
    }

    if (this.props.commentType === 'readonly') {
      commentElements.points = badge;
      commentElements.comment = (
        <div className="cp-comment__comment">{this.props.comment.text ? this.props.comment.text : ''}</div>
      );
    }

    if (this.props.rubricComment) {
      let rubricCommentClassName = 'cp-comment__rubric-comment';
      if (this.props.rubricComment.pointDelta < 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--positive');
      } else if (this.props.rubricComment.pointDelta > 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--negative');
      } else {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--neutral');
      }

      commentElements.rubricComment = (
        <div className={rubricCommentClassName}>
          <span className="cp-label--very-bold">-{this.props.rubricComment.pointDelta}</span>{' '}
          {this.props.rubricComment.text}
        </div>
      );
    }

    return (
      <div
        className={className}
        style={{ transformOrigin: '-4px 0px', top: '100px' }} // placeholders for storybook
      >
        <div className="ant-popover-content">
          <div className="ant-popover-arrow" />
          <div className="ant-popover-inner">
            <div>
              <div className="ant-popover-title">
                <div className="cp-flex--wider">
                  <div className="left">{commentElements.line}</div>
                  <div className="left">{commentElements.status}</div>
                  <div className="gap" />
                  <div className="right">{commentElements.points}</div>
                </div>
              </div>
              <div className="ant-popover-inner-content">
                {commentElements.rubricComment}
                {commentElements.comment}
              </div>
              <div style={{ margin: '0px 20px 0px 20px', paddingBottom: '15px' }}>
                <div className="cp-flex--normal" style={{ minHeight: '32px' }}>
                  <div className="left">{commentElements.author}</div>
                  <div className="gap" />
                  <div className="right">{commentElements.saveButton}</div>
                  <div className="right">{commentElements.deleteButton}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CPComment;
