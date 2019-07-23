import * as React from 'react';

import { File, FileType } from '../../../infrastructure/file';

import CodePanelSizing from './CodePanelSizing';

import * as Animation from '../../../infrastructure/animation';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import themeVars from '../../../styles/abstracts/_theme.js';

import ErrorBoundary from '../../core/ErrorBoundary';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import LayoutResizer from './LayoutResizer';

interface ICodePanelLayoutProps extends IWithWindowWatcherProps {
  file: FileType;
  code: (
    codeStyle: React.CSSProperties,
    onHighlightClick: (e: React.MouseEvent) => void,
    splitBasis: number,
  ) => React.ReactNode;
  comments: (commentsWidth: number) => React.ReactNode;
  zoom: number;
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
}

interface ICodePanelLayoutState {
  adjustmentsVisible: boolean;
  lineNumberPadding: number;
  codeWidth: number;
  commentsWidth: number;
}

class LayoutCodePanel extends React.Component<ICodePanelLayoutProps, ICodePanelLayoutState> {
  public nextFrameActionId: number;

  public state: Readonly<ICodePanelLayoutState> = {
    adjustmentsVisible: false,
    lineNumberPadding: CodePanelSizing.lineNumberPadding(this.props.file.code),
    codeWidth: Math.max(Math.min(themeVars.grade.splitBasis, window.innerWidth - 700), 400),
    commentsWidth: 360,
  };

  public componentDidUpdate = async (prevProps: ICodePanelLayoutProps) => {
    if (this.props.windowheight !== prevProps.windowheight || this.props.windowwidth !== prevProps.windowwidth) {
      this.resizeOnNextFrame();
    }

    if (this.props.file !== prevProps.file) {
      // await Animation.wait(1000);
      this.resizeOnNextFrame();
    }

    // if (this.props.splitBasis !== prevProps.splitBasis) {
    //   this.resizeComponents();
    // }
  };

  public componentDidMount() {
    this.resizeOnNextFrame();
  }

  // Browser optimization to facilitate smoother animations
  public resizeOnNextFrame = () => {
    if (this.nextFrameActionId) {
      Animation.clearNextFrameAction(this.nextFrameActionId);
    }
    this.nextFrameActionId = Animation.onNextFrame(this.resizeComponents);
  };

  public setDimensions = (codeWidth: number, commentsWidth: number) => {
    this.setState({ codeWidth, commentsWidth }, () => {
      this.resizeOnNextFrame();
    });
  };

  public resizeComponents = async () => {
    if (this.props.windowheight !== 0) {
      const codeContainer = document.getElementById('code-container');
      const codeMain = document.getElementById('code-main');
      const codeSyntax = document.getElementById('code-syntax');
      const commentsContainer = document.getElementById('code-panel--comments');
      const comments = document.getElementById('comments');

      if (codeContainer !== null && codeMain !== null && commentsContainer !== null && comments !== null) {
        const codeMainWidth = codeContainer.offsetWidth;
        codeMain.style.setProperty('width', `${codeMainWidth}px`);
        if (codeSyntax !== null) {
          codeSyntax.style.setProperty('width', `${codeMainWidth}px`);
        }

        const commentsContainerHeight =
          this.props.windowheight - commentsContainer.getBoundingClientRect().top - themeVars.grade.marginBottom;
        commentsContainer.style.setProperty('height', `${commentsContainerHeight}px`);
      }

      this.setState({ lineNumberPadding: CodePanelSizing.lineNumberPadding(this.props.file.code) });
    }
  };

  public getCodeStyle = () => {
    // return {
    //   lineHeight: `${themeVars.grade.codeLineHeight * this.props.zoom}px`,
    //   fontSize: `${themeVars.grade.codeFontSize * this.props.zoom}px`,
    //   paddingLeft: ['markdown', 'jupyter'].includes(File.codeType(this.props.file))
    //     ? '20px'
    //     : `${this.state.lineNumberPadding + 20}px`,
    // };
    return {
      lineHeight: `${themeVars.grade.codeLineHeight}px`,
      fontSize: `${themeVars.grade.codeFontSize}px`,
      paddingLeft: ['markdown', 'jupyter'].includes(File.codeType(this.props.file))
        ? '20px'
        : `${this.state.lineNumberPadding + 20}px`,
    };
  };

  public onMouseEnter = () => {
    this.setState({ adjustmentsVisible: true });
  };

  public onMouseLeave = () => {
    this.setState({ adjustmentsVisible: false });
  };

  public onHighlightClick = (e: React.MouseEvent) => {
    let commentID;
    if (e.currentTarget !== null && e.currentTarget.id.split('-').length === 3) {
      commentID = e.currentTarget.id.split('-')[2];
    }

    const codeMain = document.getElementById('code-main');
    if (codeMain !== null && commentID !== undefined) {
      if (e.currentTarget instanceof HTMLElement) {
        const comment = document.getElementById(`comment-${commentID}`);
        if (comment !== null && comment.style.top !== null) {
          const commentTop = parseInt(comment.style.top, 10);
          const offSetValue = e.currentTarget.offsetTop;
          this.props.updateVerticalOffset((oldValue: number) => {
            return commentTop - offSetValue + oldValue + -18;
          });
        }
      }
    }
  };

  public render() {
    const codeStyle = this.getCodeStyle();

    const transform = `scale(${this.props.zoom})`;
    const transformOrigin = '0 0';
    const width = `${100 / this.props.zoom}%`;
    const height = `${100 / this.props.zoom}%`;

    return (
      <ErrorBoundary type="codepanel" submissionID={this.props.file.submission} file={this.props.file}>
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              transform,
              transformOrigin,
              width,
              height,
            }}
          >
            <div className="code-panel" id="code-panel">
              <div
                style={{
                  marginLeft: `${themeVars.grade.codeContainer.marginLeft}px`,
                  width: `${this.props.windowwidth * 2}px`,
                  marginTop: '4px',
                  marginBottom: '4px',
                }}
              >
                <LayoutResizer
                  initialCodeWidth={this.state.codeWidth}
                  initialCommentsWidth={this.state.commentsWidth}
                  setDimensions={this.setDimensions}
                />
              </div>
              <div
                className="code-panel--code"
                style={{
                  margin: `${themeVars.grade.codeContainer.marginTop}px 10px 0px ${
                    themeVars.grade.codeContainer.marginLeft
                  }px`,
                  position: 'relative',
                }}
              >
                {this.props.code(codeStyle, this.onHighlightClick, this.state.codeWidth)}
              </div>
              <div
                id="code-panel--comments"
                className="code-panel--comments"
                style={{ minWidth: `${this.state.commentsWidth}px` }}
              >
                {this.props.comments(this.state.commentsWidth)}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}
LayoutCodePanel.contextType = ConsoleThemeContext;

export default withWindowWatcher(LayoutCodePanel);
