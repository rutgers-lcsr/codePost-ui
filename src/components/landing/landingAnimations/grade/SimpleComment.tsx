import * as React from 'react';

// We ignore eslint since Popover never explicitly used. We just use the classNames
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { Input, message, Typography } from 'antd';

import CPButton from '../../../core/CPButton';
import CPFlex from '../../../core/CPFlex';
import CPPointInput from '../../../core/CPPointInput';

import Badge from '../../../core/Badge';

import { CommentType, UiComment } from '../../../../infrastructure/comment';
import { RubricCommentType } from '../../../../infrastructure/rubricComment';

import { wait } from '../../../../infrastructure/animation';

import ReactMarkdown, { Components } from 'react-markdown';
import { consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

export type UICommentType = 'readonly' | 'active' | 'inactive';

export type CommentStatus = 'edited' | 'saved' | 'idle' | 'error';

const { TextArea } = Input;
const { Paragraph } = Typography;

interface ISimpleCommentProps {
  commentType: UICommentType;
  comment: CommentType;
  rubricComment?: RubricCommentType;

  placement: number;

  changeActive: (id: number | undefined) => void;
  onSave: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;

  addUnsaved: (commentID: number) => void;
  removeUnsaved: (commentID: number) => void;
  removeRubricComment: (comment: CommentType, rubricComment: RubricCommentType) => void;

  setCommentPlacements: () => void;
}

interface ISimpleCommentState {
  status: CommentStatus;
  text: string;
  points: number;
}

class SimpleComment extends React.Component<ISimpleCommentProps, ISimpleCommentState> {
  public constructor(props: ISimpleCommentProps, context: any) {
    super(props, context);
    this.state = this.init();
  }

  public componentDidMount() {
    this.props.setCommentPlacements();
  }

  public componentDidUpdate(prevProps: ISimpleCommentProps) {
    // If a rubric comment is linked, unlinked, or updated, make sure to recalculate points
    if (this.props.rubricComment !== prevProps.rubricComment) {
      this.setState({
        points: UiComment.points(this.props.comment, this.props.rubricComment),
      });
      this.props.setCommentPlacements();
    }

    if (this.props.commentType !== prevProps.commentType) {
      this.props.setCommentPlacements();
    }

    // If a comment is finalized, then reset the state
    if (['active', 'inactive'].includes(prevProps.commentType) && this.props.commentType === 'readonly') {
      this.setState(this.init());
    }
  }

  public init = () => {
    const text: string = this.props.comment.text ? this.props.comment.text : '';
    const points: number = UiComment.points(this.props.comment, this.props.rubricComment);
    const status: CommentStatus = text === '' && points === 0 ? 'edited' : 'idle';

    return { text, points, status };
  };

  public save = async () => {
    const comment = {
      ...this.props.comment,
      text: this.state.text,
      pointDelta: this.state.points,
      rubricComment: this.props.rubricComment ? this.props.rubricComment.id : null,
    };

    try {
      await this.props.onSave(comment);
      this.fadeSavedState();
      this.props.setCommentPlacements();
    } catch (error) {
      message.error(`Error saving comment: ${JSON.stringify(error)}`);
    }
  };

  public edited = () => {
    // this.props.addUnsaved(this.props.comment.id);
    this.setState({ status: 'edited' });
  };

  public idle = () => {
    // this.props.removeUnsaved(this.props.comment.id);
    this.setState({ status: 'idle' });
  };

  // Ant type bug https://cl.ly/c5094e2c4526
  public onChangePointInput = (value: any) => {
    const parsed = parseFloat(value);
    const points = isNaN(parsed) ? this.state.points : parsed;

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

  public onCommentClick = (e: React.MouseEvent) => {
    // FIXME:
    if (e.target instanceof HTMLElement && e.target.textContent === 'expand') {
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
      this.props.setCommentPlacements();
    } catch (error) {
      message.error(`Error deleting comment: ${JSON.stringify(error)}`);
    }
  };

  public fadeSavedState = async () => {
    this.setState({ status: 'saved' });
    await wait(1000);
    this.setState({ status: 'idle' });
  };

  // FIXME: Type React.KeyboardEventHandler<HTMLTextAreaElement>
  public handleShiftEnter = (e: any) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault(); // skip OnChange method
      this.save();
    }
  };

  public markdownRenderers = (): Components => {
    const blockStyle = {
      color: consoleThemes.light.text,
    };

    return {
      div: ({ node: _node, ...props }) => (
        <div className="comment__comment" style={{ color: consoleThemes.light.text }}>
          {props.children}
        </div>
      ),
      h1: ({ node: _node, ...props }) => <h1 style={blockStyle}>{props.children}</h1>,
      h2: ({ node: _node, ...props }) => <h2 style={blockStyle}>{props.children}</h2>,
      h3: ({ node: _node, ...props }) => <h3 style={blockStyle}>{props.children}</h3>,
      h4: ({ node: _node, ...props }) => <h4 style={blockStyle}>{props.children}</h4>,
      h5: ({ node: _node, ...props }) => <h5 style={blockStyle}>{props.children}</h5>,
      h6: ({ node: _node, ...props }) => <h6 style={blockStyle}>{props.children}</h6>,
      code: ({ node: _node, ...props }) => (
        <code
          style={{
            backgroundColor: consoleThemes.light.commentTitle,
            color: consoleThemes.light.text,
          }}
        >
          {props.children}
        </code>
      ),
      hr: () => <hr style={blockStyle} />,
    };
  };

  public render() {
    const className = `comment comment--${this.props.commentType} ant-popover ant-popover-placement-rightTop`;

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
    let shadow;

    //////////////////////////////////////////////////////////////////////////////////////////
    // -------------------------- codeType ['code', 'markdown'] --------------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    commentElements.line = (
      <span className="cp-label--mid-bold cp-label--italic" style={{ color: consoleThemes.light.commentTitleText }}>
        Line {this.props.comment.startLine + 1}
      </span>
    );

    const points: number = this.state.points;
    const badge = <Badge count={points * -1} />;

    //////////////////////////////////////////////////////////////////////////////////////////
    // ------------------------------------- author --------------------------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    if (this.props.comment.author) {
      commentElements.author = (
        <span className="cp-label--italic cp-label--very-small" style={{ color: consoleThemes.light.commentAuthor }}>
          Author: {this.props.comment.author}
        </span>
      );
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // -------------------- commentStatus ['edited', 'saved', 'error'] -------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    switch (this.state.status) {
      case 'edited':
        commentElements.status = (
          <span className="cp-label--small cp-label--italic" style={{ color: consoleThemes.light.commentTitleText }}>
            Draft
          </span>
        );
        break;
      case 'saved':
        commentElements.status = <span className="cp-label--small cp-label--italic cp-label--success">Saved!</span>;
        break;
      case 'error':
        commentElements.status = <span className="cp-label--small cp-label--italic cp-label--error">Error!</span>;
        break;
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // ------------------ commentType ['active', 'inactive', 'readonly'] ------------------ //
    //////////////////////////////////////////////////////////////////////////////////////////

    if (this.props.commentType === 'active') {
      commentElements.points = (
        <CPPointInput
          value={points}
          size="small"
          onChange={this.onChangePointInput}
          disabled={this.props.rubricComment ? true : false}
          onKeyDown={this.handleShiftEnter}
        />
      );
      commentElements.comment = (
        <TextArea
          autoSize
          className="comment__text-area"
          value={this.state.text}
          onChange={this.onChangeText}
          onPressEnter={this.handleShiftEnter}
          style={{
            backgroundColor: consoleThemes.light.commentTextArea,
            color: consoleThemes.light.text,
          }}
          autoFocus
        />
      );

      commentElements.saveButton = <CPButton cpType="secondary" icon={<SaveOutlined />} onClick={this.save} />;
      commentElements.deleteButton = <CPButton cpType="danger" icon={<DeleteOutlined />} onClick={this.delete} />;

      if (this.props.rubricComment) {
        commentElements.rubricCommentAction = (
          <span style={{ position: 'absolute', right: '20px', cursor: 'pointer' }} onClick={this.removeRubricComment}>
            X
          </span>
        );
      }

      shadow = { boxShadow: consoleThemes.light.commentShadow };
    }

    const markdownRenderers = this.markdownRenderers();

    if (this.props.commentType === 'inactive') {
      commentElements.points = badge;
      // commentElements.comment = (
      //   <Paragraph
      //     className="comment__comment"
      //     style={{
      //       whiteSpace: 'pre-wrap',
      //       wordWrap: 'break-word',
      //       marginBottom: '0px',
      //       color: consoleThemes.light.text,
      //     }}
      //   >
      //     <ReactMarkdown renderers={markdownRenderers} source={this.state.text} />
      //   </Paragraph>
      // );
      commentElements.comment = <ReactMarkdown components={markdownRenderers}>{this.state.text}</ReactMarkdown>;
      commentElements.deleteButton = <CPButton cpType="danger" icon={<DeleteOutlined />} onClick={this.delete} />;

      onClick = this.onCommentClick;
      cursor = 'pointer';
    }

    if (this.props.commentType === 'readonly') {
      commentElements.points = badge;
      commentElements.comment = (
        <Paragraph
          className="comment__comment"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            marginBottom: '0px',
          }}
          ellipsis={{
            rows: 2,
            expandable: false,
            onExpand: this.props.setCommentPlacements,
          }}
        >
          <ReactMarkdown components={markdownRenderers}>{this.state.text}</ReactMarkdown>;
        </Paragraph>
      );
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // --------------------------------- rubricComment ------------------------------------ //
    //////////////////////////////////////////////////////////////////////////////////////////

    if (this.props.rubricComment) {
      let rubricCommentClassName = 'comment__rubric-comment';
      let pointsString = '';
      let style = {};
      if (this.props.rubricComment.pointDelta > 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--negative');
        pointsString = `${points * -1}`;
      } else if (this.props.rubricComment.pointDelta < 0) {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--positive');
        pointsString = `+${points * -1}`;
      } else {
        rubricCommentClassName = rubricCommentClassName.concat(' ', 'comment__rubric-comment--neutral');
        style = {
          color: consoleThemes.light.commentRubricCommentNeutral,
          borderLeft: `3px solid ${consoleThemes.light.commentRubricCommentNeutral}`,
        };
      }

      commentElements.rubricComment = (
        <div className={rubricCommentClassName} style={style}>
          <span className="cp-label--very-bold">{pointsString}</span> {this.props.rubricComment.text}
          {commentElements.rubricCommentAction}
        </div>
      );
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // ---------------------------------- Components -------------------------------------- //
    //////////////////////////////////////////////////////////////////////////////////////////

    const titleLeft = [commentElements.line, commentElements.status];

    const titleRight = [commentElements.points];

    const footerLeft = [commentElements.author];

    const footerRight = [commentElements.saveButton, commentElements.deleteButton];

    return (
      <div
        className={className}
        id={`comment-${this.props.comment.id}`}
        style={{
          top: `${this.props.placement}px`,
          cursor,
          marginBottom: 0,
          boxShadow: this.props.commentType === 'active' ? '4px 0px 8px -4px rgba(0, 0, 0, 0.15)' : '',
        }}
        onClick={onClick}
        data-status={this.state.status}
      >
        <div className="ant-popover-content">
          <div className="ant-popover-arrow" style={{ borderColor: consoleThemes.light.commentBody }} />
          <div className="ant-popover-inner" style={shadow}>
            <div style={{ backgroundColor: consoleThemes.light.commentBody }}>
              <div
                className="ant-popover-title"
                style={{
                  backgroundColor: consoleThemes.light.commentTitle,
                  borderBottom: `1px solid ${consoleThemes.light.commentTitleBorder}`,
                }}
              >
                <CPFlex left={titleLeft} right={titleRight} gutterSize={14} />
              </div>
              <div className="ant-popover-inner-content" style={{ padding: 0 }}>
                {commentElements.rubricComment}
                {commentElements.comment}
              </div>
              {this.props.commentType !== 'readonly' ? (
                <div
                  style={{
                    margin: '0px 20px 0px 20px',
                    paddingBottom: '6px',
                    lineHeight: '9px',
                  }}
                >
                  <CPFlex left={footerLeft} right={footerRight} gutterSize={10} style={{ minHeight: '32px' }} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SimpleComment;
