import * as React from 'react';

// We use ts-ignore since Popover never explicitly used. We just use the classNames
// @ts-ignore: no-unused-variable
import { Badge, Input, message, Popover, Typography } from 'antd';
const { TextArea } = Input;
const { Paragraph } = Typography;

import CPButton from './CPButton';
import CPFlex from './CPFlex';
import CPPointInput from './CPPointInput';

import { CommentType, UiComment } from '../../infrastructure/comment';
import { RubricCommentType } from '../../infrastructure/rubricComment';

import themeVars from '../../styles/abstracts/_theme.js';

export type CPCommentType = 'readonly' | 'active' | 'inactive';

export type CommentStatus = 'edited' | 'saved' | 'idle' | 'error';

interface ICPCommentProps {
  commentType: CPCommentType;
  comment: CommentType;
  rubricComment?: RubricCommentType;

  placement: number;

  changeActive: (id: number | undefined) => void;
  onSave: any;
  onDelete: (comment: CommentType) => void;

  addUnsaved: any;
  removeUnsaved: any;
  removeRubricComment: any;

  setCommentPlacements: () => void;
}

interface ICPCommentState {
  status: CommentStatus;
  text: string;
  points: number;
}

class CPComment extends React.Component<ICPCommentProps, ICPCommentState> {
  public state: Readonly<ICPCommentState> = {
    status: 'idle',
    text: this.props.comment.text ? this.props.comment.text : '',
    points: UiComment.points(this.props.comment, this.props.rubricComment),
  };

  public componentDidMount() {
    console.log(`Mounted: ${this.props.comment.id}`);
    this.props.setCommentPlacements();
  }

  public componentDidUpdate(prevProps: ICPCommentProps) {
    if (this.props.commentType !== prevProps.commentType || this.props.rubricComment !== prevProps.rubricComment) {
      this.setState({ points: UiComment.points(this.props.comment, this.props.rubricComment) });
      this.props.setCommentPlacements();
    }
  }

  public save = async () => {
    this.unhighlightRelatedComment();

    const comment = {
      ...this.props.comment,
      text: this.state.text,
      pointDelta: this.state.points,
      rubricComment: this.props.rubricComment ? this.props.rubricComment.id : null,
    };

    try {
      await this.props.onSave(comment, this.props.rubricComment);
      this.fadeSavedState();
    } catch (error) {
      message.error(`Error saving comment: ${JSON.stringify(error)}`);
    }
  };

  public edited = () => {
    this.props.addUnsaved(this.props.comment.id);
    this.setState({ status: 'edited' });
  };

  public idle = () => {
    this.props.removeUnsaved(this.props.comment.id);
    this.setState({ status: 'idle' });
  };

  // Ant type bug https://cl.ly/c5094e2c4526
  public onChangePointInput = (value: any) => {
    const parsed = parseFloat(value);
    const points = parsed ? parsed : this.state.points;

    if (points !== UiComment.points(this.props.comment, this.props.rubricComment)) {
      this.edited();
    } else {
      this.idle();
    }

    this.setState({ points });
  };

  public roundDownToNearestMultiple = (n: number, m: number) => {
    return Math.floor(n / m) * m;
  };

  public roundUpToNearestMultiple = (n: number, m: number) => {
    return Math.ceil(n / m) * m;
  };

  public onPlus = () => {
    const points = this.roundDownToNearestMultiple(this.state.points, 0.5) + 0.5;
    this.onChangePointInput(points);
  };

  public onMinus = () => {
    const points = this.roundUpToNearestMultiple(this.state.points, 0.5) - 0.5;
    this.onChangePointInput(points);
  };

  public onCommentClick = (e: any) => {
    if (e.target.textContent === 'expand') {
      e.stopPropagation();
    } else {
      this.activate();
    }
  };

  public activate = () => {
    this.props.changeActive(this.props.comment.id);
  };

  public deactivate = () => {
    this.props.changeActive(undefined);
  };

  public onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    this.setState({ text });
    if (text !== this.props.comment.text) {
      this.edited();
    } else {
      this.idle();
    }

    this.props.setCommentPlacements();
  };

  public removeRubricComment = () => {
    if (this.props.rubricComment) {
      this.edited();
      this.props.removeRubricComment(this.props.comment, this.props.rubricComment);
    }
  };

  public delete = async (e: any) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      await this.props.onDelete(this.props.comment);
    } catch (error) {
      message.error(`Error deleting comment: ${JSON.stringify(error)}`);
    }
  };

  public fadeSavedState = () => {
    this.setState({ status: 'saved' });
    window.setTimeout(() => this.setState({ status: 'idle' }), 1000);
  };

  // FIXME: Type React.KeyboardEventHandler<HTMLTextAreaElement>
  public handleShiftEnter = (e: any) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); // skip OnChange method
      this.save();
    }
  };

  public highlightRelatedComment = (event?: any) => {
    const className = `highlight-${this.props.comment.id}`;
    const elems = document.getElementsByClassName(className);
    [].forEach.call(elems, (elem: any) => {
      elem.style.setProperty('background-color', themeVars.theme.highlightActive, 'important');
    });

    // For handling markdown
    // const blockElement: HTMLElement | null = document.querySelector(`[index-number="${comment.startLine}"]`);
    // if (blockElement) {
    //   blockElement.className = 'markdown-code__block--focused';
    //   // blockElement.style.setProperty('border-left', '5px solid #f9ff91');
    // }
  };

  public unhighlightRelatedComment = (event?: any) => {
    const className = `highlight-${this.props.comment.id}`;
    const elems = document.getElementsByClassName(className);
    [].forEach.call(elems, (elem: any) => {
      elem.style.setProperty('background-color', themeVars.theme.highlight, 'important');
      // elem.style.setProperty('opacity', '0.2', 'important');
    });

    // For handling markdown
    // const blockElement: HTMLElement | null = document.querySelector(`[index-number="${comment.startLine}"]`);
    // if (blockElement) {
    //   blockElement.className = 'markdown-code__block--commented';
    //   // blockElement.style.setProperty('border-left', '5px solid #24b47e');
    // }
  };

  public render() {
    const className = `cp-comment cp-comment--${this.props.commentType} ant-popover ant-popover-placement-rightTop`;

    const commentElements: { [key: string]: React.ReactNode } = {
      line: null,
      points: null,
      status: null,
      comment: null,
      rubricComment: null,
      rubricCommentAction: null,
      saveButton: null,
      deleteButton: null,
      author: null,
    };

    let onClick;
    let cursor = 'auto';

    commentElements.line = (
      <span className="cp-label--mid-bold cp-label--italic">Line {this.props.comment.startLine + 1}</span>
    );

    if (this.props.comment.author) {
      commentElements.author = (
        <span className="cp-label--italic cp-label--very-small">Author: {this.props.comment.author}</span>
      );
    }

    const points: number = this.state.points;

    let badge = null;
    if (points > 0) {
      badge = <Badge count={points * -1} className="cp-badge" style={{ backgroundColor: themeVars.theme.actionRed }} />;
    } else if (points < 0) {
      badge = (
        <Badge
          count={`+${points * -1}`}
          className="cp-badge"
          style={{ backgroundColor: themeVars.theme.actionGreen }}
        />
      );
    } else {
      badge = (
        <Badge count={points} className="cp-badge" style={{ backgroundColor: themeVars.theme.neutralSecondaryText }} />
      );
    }

    switch (this.state.status) {
      case 'edited':
        commentElements.status = <span className="cp-label--small cp-label--italic">Draft</span>;
        break;
      case 'saved':
        commentElements.status = <span className="cp-label--small cp-label--italic cp-label--success">Saved!</span>;
        break;
      case 'error':
        commentElements.status = <span className="cp-label--small cp-label--italic cp-label--error">Error!</span>;
        break;
    }

    if (this.props.commentType === 'active') {
      commentElements.points = (
        <CPPointInput
          value={points}
          size="small"
          onPlus={this.onPlus}
          onMinus={this.onMinus}
          onChange={this.onChangePointInput}
          disabled={this.props.rubricComment ? true : false}
        />
      );
      commentElements.comment = (
        <TextArea
          autosize
          className="cp-comment__text-area"
          value={this.state.text}
          onChange={this.onChangeText}
          onPressEnter={this.handleShiftEnter}
        />
      );

      commentElements.saveButton = <CPButton cpType="secondary" icon="save" onClick={this.save} />;
      commentElements.deleteButton = <CPButton cpType="danger" icon="delete" onClick={this.delete} />;

      if (this.props.rubricComment) {
        commentElements.rubricCommentAction = (
          <span style={{ position: 'absolute', right: '20px', cursor: 'pointer' }} onClick={this.removeRubricComment}>
            X
          </span>
        );
      }
    }

    if (this.props.commentType === 'inactive') {
      commentElements.points = badge;
      commentElements.comment = (
        <Paragraph
          className="cp-comment__comment"
          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginBottom: '0px' }}
          ellipsis={{ rows: 2, expandable: true, onExpand: this.props.setCommentPlacements }}
        >
          {this.state.text}
        </Paragraph>
      );
      commentElements.deleteButton = <CPButton cpType="danger" icon="delete" onClick={this.delete} />;

      onClick = this.onCommentClick;
      cursor = 'pointer';
    }

    if (this.props.commentType === 'readonly') {
      commentElements.points = badge;
      commentElements.comment = (
        <Paragraph
          className="cp-comment__comment"
          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', marginBottom: '0px' }}
          ellipsis={{ rows: 2, expandable: true, onExpand: this.props.setCommentPlacements }}
        >
          {this.state.text}
        </Paragraph>
      );
    }

    if (this.props.rubricComment) {
      let rubricCommentClassName = 'cp-comment__rubric-comment';
      let pointsString = '';
      if (this.props.rubricComment.pointDelta > 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--negative');
        pointsString = `${points * -1}`;
      } else if (this.props.rubricComment.pointDelta < 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--positive');
        pointsString = `+${points * -1}`;
      } else {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'cp-comment__rubric-comment--neutral');
      }

      commentElements.rubricComment = (
        <div className={rubricCommentClassName}>
          <span className="cp-label--very-bold">{pointsString}</span> {this.props.rubricComment.text}
          {commentElements.rubricCommentAction}
        </div>
      );
    }

    const titleLeft = [commentElements.line, commentElements.status];

    const titleRight = [commentElements.points];

    const footerLeft = [commentElements.author];

    const footerRight = [commentElements.saveButton, commentElements.deleteButton];

    return (
      <div
        className={className}
        id={`comment-${this.props.comment.id}`}
        style={{ top: `${this.props.placement}px`, cursor }}
        onClick={onClick}
        onMouseEnter={this.highlightRelatedComment}
        onMouseLeave={this.unhighlightRelatedComment}
      >
        <div className="ant-popover-content">
          <div className="ant-popover-arrow" />
          <div className="ant-popover-inner">
            <div>
              <div className="ant-popover-title">
                <CPFlex left={titleLeft} right={titleRight} gutterSize={14} />
              </div>
              <div className="ant-popover-inner-content">
                {commentElements.rubricComment}
                {commentElements.comment}
              </div>
              <div style={{ margin: '0px 20px 0px 20px', paddingBottom: '6px', lineHeight: '9px' }}>
                <CPFlex left={footerLeft} right={footerRight} gutterSize={10} style={{ minHeight: '32px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CPComment;
