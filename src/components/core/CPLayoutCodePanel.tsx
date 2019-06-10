import * as React from 'react';

import { Button, Icon } from 'antd';

const ButtonGroup = Button.Group;

import SyntaxHighlighter from 'react-syntax-highlighter';
import { googlecode } from 'react-syntax-highlighter/dist/styles/hljs';

import { File, FileType } from '../../infrastructure/file';

import CPButton from '../core/CPButton';
import Layout from '../core/LayoutUtils';

import * as Animation from '../../infrastructure/animation';

import withWindowWatcher, { IWithWindowWatcherProps } from './withWindowWatcher';

import themeVars from '../../styles/abstracts/_theme.js';

interface ICPLayoutCodePanelProps extends IWithWindowWatcherProps {
  file: FileType;
  code: React.ReactNode;
  comments: React.ReactNode;
}

interface ICPLayoutCodePanelState {
  zoom: number;
  adjustmentsVisible: boolean;
  splitBasis: number;
}

class CPLayoutCodePanel extends React.Component<ICPLayoutCodePanelProps, ICPLayoutCodePanelState> {
  public nextFrameActionId: number;

  public state: Readonly<ICPLayoutCodePanelState> = {
    zoom: 1,
    adjustmentsVisible: false,
    splitBasis: themeVars.grade.splitBasis,
  };

  public componentDidMount() {
    this.resizeOnNextFrame();

    const comments = document.getElementById('cp-code-panel--comments');
    if (comments !== null) {
      comments.addEventListener('scroll', this.scrollFromComments);
    }

    const codeContainer = document.getElementById('cp-code-container');
    if (codeContainer !== null) {
      codeContainer.addEventListener('wheel', this.scrollFromCodeContainer);
    }

    // Make sure to resize when changing files
    const fileMenu = document.getElementById('file-menu');
    if (fileMenu !== null) {
      fileMenu.addEventListener('click', this.resizeOnNextFrame);
    }
  }

  public componentWillUnmount() {
    const comments = document.getElementById('cp-code-panel--comments');
    if (comments !== null) {
      comments.removeEventListener('scroll', this.scrollFromComments);
    }

    const codeContainer = document.getElementById('cp-code-container');
    if (codeContainer !== null) {
      codeContainer.removeEventListener('wheel', this.scrollFromCodeContainer);
    }

    const fileMenu = document.getElementById('file-menu');
    if (fileMenu !== null) {
      fileMenu.removeEventListener('click', this.resizeOnNextFrame);
    }
  }

  public scrollFromCodeContainer = (e: WheelEvent) => {
    const comments = document.getElementById('cp-code-panel--comments');

    // Scroll vertically
    if (comments !== null) {
      comments.scrollTop = comments.scrollTop + e.deltaY;
    }

    const codeUnderlay = document.getElementById('code-underlay');
    const codeSyntax = document.getElementById('code-syntax');

    // Scroll horizontally
    if (codeUnderlay !== null && codeSyntax !== null) {
      codeSyntax.scrollLeft = codeUnderlay.scrollLeft;
    }
  };

  public scrollFromComments = () => {
    const comments = document.getElementById('cp-code-panel--comments');
    const codeUnderlay = document.getElementById('code-underlay');
    const codeSyntax = document.getElementById('code-syntax');

    if (comments !== null && codeUnderlay !== null && codeSyntax !== null) {
      codeUnderlay.scrollTop = comments.scrollTop;
      codeSyntax.scrollTop = codeUnderlay.scrollTop;
    }
  };

  public componentDidUpdate(prevProps: ICPLayoutCodePanelProps) {
    if (this.props.windowheight !== prevProps.windowheight || this.props.windowwidth !== prevProps.windowwidth) {
      this.resizeOnNextFrame();
    }
  }

  // Browser optimization to facilitate smoother animations
  public resizeOnNextFrame = () => {
    if (this.nextFrameActionId) {
      Animation.clearNextFrameAction(this.nextFrameActionId);
    }
    this.nextFrameActionId = Animation.onNextFrame(this.resizeComponents);
  };

  public resizeComponents = () => {
    if (this.props.windowheight !== 0) {
      const codeContainer = document.getElementById('cp-code-container');
      const codeUnderlay = document.getElementById('code-underlay');
      const codeSyntax = document.getElementById('code-syntax');
      const commentsContainer = document.getElementById('cp-code-panel--comments');
      const comments = document.getElementById('comments');

      const codeHeight = Layout.codeHeight(this.props.file.code);

      if (
        codeContainer !== null &&
        codeUnderlay !== null &&
        codeSyntax !== null &&
        commentsContainer !== null &&
        comments !== null
      ) {
        const codeContainerMaxHeight =
          this.props.windowheight -
          codeContainer.getBoundingClientRect().top -
          themeVars.grade.codeContainer.marginBottom -
          themeVars.grade.marginBottom;

        const codeContainerHeight = Math.min(
          codeContainerMaxHeight,
          codeHeight + themeVars.grade.codeContainer.paddingTop + themeVars.grade.codeContainer.paddingBottom,
        );

        const codeUnderlayHeight =
          codeContainerHeight - themeVars.grade.codeContainer.paddingTop - themeVars.grade.codeContainer.paddingBottom;

        codeContainer.style.setProperty('height', `${codeContainerHeight}px`);
        codeUnderlay.style.setProperty('height', `${codeUnderlayHeight}px`);
        codeSyntax.style.setProperty('height', `${codeUnderlayHeight}px`);

        const codeUnderlayWidth =
          codeContainer.offsetWidth -
          themeVars.grade.codeContainer.paddingLeft -
          themeVars.grade.codeContainer.paddingRight;
        codeUnderlay.style.setProperty('width', `${codeUnderlayWidth}px`);
        codeSyntax.style.setProperty('width', `${codeUnderlayWidth}px`);

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
    const codeContainer = document.getElementById('cp-code-container');
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
      paddingLeft: `${themeVars.grade.lineNumberPadding * this.state.zoom + 10}px`,
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
    const { highlightHeight, paddingLeft, ...codeStyle } = this.getCodeStyle();

    // FIXME: This only catches existing highlights.
    //        New highlights will start with the template height and adjust after render
    const highlights = document.getElementsByClassName('highlight');
    [].forEach.call(highlights, (highlight: any) => {
      highlight.style.setProperty('height', highlightHeight);
    });

    return (
      <div className="cp-code-panel-container" style={{ margin: '14px 11px 0px 0px' }}>
        <div className="cp-code-panel">
          <div
            className="cp-code-panel--code"
            style={{
              margin: `${themeVars.grade.codeContainer.marginTop}px 10px 0px ${
                themeVars.grade.codeContainer.marginLeft
              }px`,
              flex: `0 1 ${this.state.splitBasis}px`,
            }}
          >
            <div
              id="cp-code-container"
              className="cp-code-container"
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
              <SyntaxHighlighter
                id="code-syntax"
                className="cp-code"
                language={File.language(this.props.file)}
                style={googlecode}
                showLineNumbers={true}
                wrapLines={false}
                customStyle={{ ...codeStyle, padding: '0px' }}
              >
                {this.props.file.code}
              </SyntaxHighlighter>
              ;
              <div id="code-underlay" className="cp-code" style={{ ...codeStyle, paddingLeft }}>
                {this.props.code}
              </div>
            </div>
          </div>
          <div id="cp-code-panel--comments" className="cp-code-panel--comments">
            {this.props.comments}
          </div>
        </div>
      </div>
    );
  }
}

interface IMagnifierProps {
  visible: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
}

const Magnifier = (props: IMagnifierProps) => {
  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '5px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <ButtonGroup>
        <CPButton id="zoom-out" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.zoomOut}>
          <Icon type="zoom-out" />
        </CPButton>
        <CPButton id="zoom-in" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.zoomIn}>
          <Icon type="zoom-in" />
        </CPButton>
      </ButtonGroup>
    </div>
  );
};

interface ISizerProps {
  visible: boolean;
  shrink: () => void;
  grow: () => void;
}

const Sizer = (props: ISizerProps) => {
  return (
    <div
      style={{
        ...{ position: 'absolute', top: '5px', right: '68px' },
        visibility: props.visible ? 'visible' : 'hidden',
      }}
    >
      <ButtonGroup>
        <CPButton id="shrink" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.shrink}>
          <Icon type="double-left" />
        </CPButton>
        <CPButton id="grow" cpType="secondary" size="small" style={{ minWidth: '20px' }} onClick={props.grow}>
          <Icon type="double-right" />
        </CPButton>
      </ButtonGroup>
    </div>
  );
};

export default withWindowWatcher(CPLayoutCodePanel);
