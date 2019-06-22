import * as React from 'react';

import { File, FileType } from '../../../infrastructure/file';

import CodePanelSizing from './CodePanelSizing';
import { Magnifier, Sizer } from './CodePanelWidgets';

import * as Animation from '../../../infrastructure/animation';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import themeVars from '../../../styles/abstracts/_theme.js';

import ErrorBoundary from '../../core/ErrorBoundary';

interface ICodePanelLayoutProps extends IWithWindowWatcherProps {
  file: FileType;
  code: (codeStyle: React.CSSProperties) => React.ReactNode;
  comments: React.ReactNode;
}

interface ICodePanelLayoutState {
  zoom: number;
  adjustmentsVisible: boolean;
  splitBasis: number;
}

class CPLayoutCodePanel extends React.Component<ICodePanelLayoutProps, ICodePanelLayoutState> {
  public nextFrameActionId: number;

  public state: Readonly<ICodePanelLayoutState> = {
    zoom: 1,
    adjustmentsVisible: false,
    splitBasis: themeVars.grade.splitBasis,
  };

  public componentDidMount() {
    this.resizeOnNextFrame();

    const comments = document.getElementById('code-panel--comments');
    if (comments !== null) {
      comments.addEventListener('scroll', this.scrollFromComments);
    }

    const codeContainer = document.getElementById('code-container');
    if (codeContainer !== null) {
      codeContainer.addEventListener('wheel', this.scrollFromCodeContainer);
    }
  }

  public componentWillUnmount() {
    const comments = document.getElementById('code-panel--comments');
    if (comments !== null) {
      comments.removeEventListener('scroll', this.scrollFromComments);
    }

    const codeContainer = document.getElementById('code-container');
    if (codeContainer !== null) {
      codeContainer.removeEventListener('wheel', this.scrollFromCodeContainer);
    }
  }

  public scrollFromCodeContainer = (e: WheelEvent) => {
    const comments = document.getElementById('code-panel--comments');

    // Scroll vertically
    if (comments !== null) {
      comments.scrollTop = comments.scrollTop + e.deltaY;
    }

    const codeMain = document.getElementById('code-main');
    const codeSyntax = document.getElementById('code-syntax');

    // Scroll horizontally
    if (codeMain !== null && codeSyntax !== null) {
      codeSyntax.scrollLeft = codeMain.scrollLeft;
    }
  };

  public scrollFromComments = () => {
    const comments = document.getElementById('code-panel--comments');
    const codeMain = document.getElementById('code-main');
    const codeSyntax = document.getElementById('code-syntax');

    if (comments !== null && codeMain !== null) {
      codeMain.scrollTop = comments.scrollTop;

      if (codeSyntax !== null) {
        codeSyntax.scrollTop = codeMain.scrollTop;
      }
    }
  };

  public componentDidUpdate = async (prevProps: ICodePanelLayoutProps) => {
    if (this.props.windowheight !== prevProps.windowheight || this.props.windowwidth !== prevProps.windowwidth) {
      this.resizeOnNextFrame();
    }

    if (this.props.file !== prevProps.file) {
      // await Animation.wait(1000);
      this.resizeOnNextFrame();
    }
  };

  // Browser optimization to facilitate smoother animations
  public resizeOnNextFrame = () => {
    if (this.nextFrameActionId) {
      Animation.clearNextFrameAction(this.nextFrameActionId);
    }
    this.nextFrameActionId = Animation.onNextFrame(this.resizeComponents);
  };

  public resizeComponents = async () => {
    if (this.props.windowheight !== 0) {
      const codeContainer = document.getElementById('code-container');
      const codeMain = document.getElementById('code-main');
      const codeSyntax = document.getElementById('code-syntax');
      const commentsContainer = document.getElementById('code-panel--comments');
      const comments = document.getElementById('comments');

      if (codeContainer !== null && codeMain !== null && commentsContainer !== null && comments !== null) {
        const codeMainWidth =
          codeContainer.offsetWidth -
          themeVars.grade.codeContainer.paddingLeft -
          themeVars.grade.codeContainer.paddingRight;
        codeMain.style.setProperty('width', `${codeMainWidth}px`);
        if (codeSyntax !== null) {
          codeSyntax.style.setProperty('width', `${codeMainWidth}px`);
        }

        // We need to wait until after updating the width to calculate the height
        // This is mostly for Markdown files which will have wrapping text (height dependent on width)
        const codeHeight = CodePanelSizing.codeHeight(this.props.file.code);

        const codeContainerMaxHeight =
          this.props.windowheight -
          codeContainer.getBoundingClientRect().top -
          themeVars.grade.codeContainer.marginBottom -
          themeVars.grade.marginBottom;

        const codeContainerHeight = Math.min(
          codeContainerMaxHeight,
          codeHeight + themeVars.grade.codeContainer.paddingTop + themeVars.grade.codeContainer.paddingBottom,
        );

        const codeMainHeight =
          codeContainerHeight - themeVars.grade.codeContainer.paddingTop - themeVars.grade.codeContainer.paddingBottom;

        codeContainer.style.setProperty('height', `${codeContainerHeight}px`);
        codeMain.style.setProperty('height', `${codeMainHeight}px`);
        if (codeSyntax !== null) {
          codeSyntax.style.setProperty('height', `${codeMainHeight}px`);
        }

        const commentsContainerHeight =
          this.props.windowheight - commentsContainer.getBoundingClientRect().top - themeVars.grade.marginBottom;
        commentsContainer.style.setProperty('height', `${commentsContainerHeight}px`);
      }
    }
  };

  public shrink = () => {
    const splitBasis = Math.max(200, this.state.splitBasis - 100);
    this.setState({ splitBasis }, this.resizeComponents);
  };

  public grow = () => {
    const codeContainer = document.getElementById('code-container');
    if (codeContainer !== null) {
      const maxWidth = this.props.windowwidth - codeContainer.offsetLeft - themeVars.grade.commentMinWidth;
      const splitBasis = Math.min(maxWidth, this.state.splitBasis + 100);
      this.setState({ splitBasis }, this.resizeComponents);
    }
  };

  public zoomIn = () => {
    const zoom = Math.min(2, this.state.zoom + 0.1);
    this.setState({ zoom }, this.resizeComponents);
  };

  public zoomOut = () => {
    const zoom = Math.max(0.5, this.state.zoom - 0.1);
    this.setState({ zoom }, this.resizeComponents);
  };

  public getCodeStyle = () => {
    return {
      lineHeight: `${themeVars.grade.codeLineHeight * this.state.zoom}px`,
      fontSize: `${themeVars.grade.codeFontSize * this.state.zoom}px`,
      // FIXME: 10 on next line comes from SyntaxHighlighter styles
      paddingLeft: ['markdown', 'jupyter'].includes(File.codeType(this.props.file))
        ? '0px'
        : `${themeVars.grade.lineNumberPadding * this.state.zoom + 10}px`,
      highlightHeight: `${themeVars.grade.highlightHeight * this.state.zoom}px`,
    };
  };

  public onMouseEnter = () => {
    this.setState({ adjustmentsVisible: true });
  };

  public onMouseLeave = () => {
    this.setState({ adjustmentsVisible: false });
  };

  public render() {
    // @ts-ignore
    const { highlightHeight, ...codeStyle } = this.getCodeStyle();

    // FIXME: This only catches existing highlights.
    //        New highlights will start with the template height and adjust after render
    const highlights = document.getElementsByClassName('highlight');
    [].forEach.call(highlights, (highlight: any) => {
      highlight.style.setProperty('height', highlightHeight);
    });

    return (
      <ErrorBoundary type="codepanel" submissionID={this.props.file.submission} file={this.props.file}>
        <div className="code-panel-container" style={{ margin: '14px 11px 0px 0px' }}>
          <div className="code-panel">
            <div
              className="code-panel--code"
              style={{
                margin: `${themeVars.grade.codeContainer.marginTop}px 10px 0px ${
                  themeVars.grade.codeContainer.marginLeft
                }px`,
                flex: `0 1 ${this.state.splitBasis}px`,
              }}
            >
              <div
                id="code-container"
                className="code-container"
                style={{
                  padding: `${themeVars.grade.codeContainer.paddingTop}px ${
                    themeVars.grade.codeContainer.paddingRight
                  }px ${themeVars.grade.codeContainer.paddingBottom}px ${themeVars.grade.codeContainer.paddingLeft}px`,
                }}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
              >
                <Sizer shrink={this.shrink} grow={this.grow} visible={this.state.adjustmentsVisible} />
                <Magnifier zoomIn={this.zoomIn} zoomOut={this.zoomOut} visible={this.state.adjustmentsVisible} />
                {this.props.code(codeStyle)}
              </div>
            </div>
            <div id="code-panel--comments" className="code-panel--comments">
              {this.props.comments}
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
}

export default withWindowWatcher(CPLayoutCodePanel);
