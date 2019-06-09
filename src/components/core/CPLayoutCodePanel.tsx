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

interface ICPLayoutCodePanelProps extends IWithWindowWatcherProps {
  file: FileType;
  code: React.ReactNode;
  comments: React.ReactNode;
}

interface ICPLayoutCodePanelState {
  zoom: number;
  zoomVisible: boolean;
}

class CPLayoutCodePanel extends React.Component<ICPLayoutCodePanelProps, ICPLayoutCodePanelState> {
  // Pre-sets
  public lineHeight = 20;
  public fontSize = 12;
  public highlightHeight = 16;
  public lineNumberPadding = 14.41;
  public commentsHeight = 0;
  public nextFrameActionId: number;

  public state: Readonly<ICPLayoutCodePanelState> = {
    zoom: 1,
    zoomVisible: false,
  };

  public componentDidMount() {
    this.resizeComponents();

    const comments = document.getElementById('cp-code-panel--comments');
    if (comments !== null) {
      comments.addEventListener('scroll', this.updateCommentScrolls);
    }

    const codeContainer = document.getElementById('cp-code-container');
    if (codeContainer !== null) {
      codeContainer.addEventListener('wheel', this.scrollFromCodeContainer);
    }

    const fileMenu = document.getElementById('file-menu');
    if (fileMenu !== null) {
      fileMenu.addEventListener('click', this.resizeOnNextFrame);
    }
  }

  public componentWillUnmount() {
    const comments = document.getElementById('cp-code-panel--comments');
    if (comments !== null) {
      comments.removeEventListener('scroll', this.updateCommentScrolls);
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

    if (comments !== null) {
      comments.scrollTop = comments.scrollTop + e.deltaY;
    }

    const codeUnderlay = document.getElementById('code-underlay');
    const codeSyntax = document.getElementById('code-syntax');

    if (codeUnderlay !== null && codeSyntax !== null) {
      codeSyntax.scrollLeft = codeUnderlay.scrollLeft;
    }
  };

  public updateCommentScrolls = () => {
    const comments = document.getElementById('cp-code-panel--comments');
    const codeUnderlay = document.getElementById('code-underlay');
    const codeSyntax = document.getElementById('code-syntax');

    if (comments !== null && codeUnderlay !== null && codeSyntax !== null) {
      codeUnderlay.scrollTop = comments.scrollTop;
      codeSyntax.scrollTop = codeUnderlay.scrollTop;
    }
  };

  public componentDidUpdate(prevProps: ICPLayoutCodePanelProps) {
    if (this.props.windowHeight !== prevProps.windowHeight || this.props.windowWidth !== prevProps.windowWidth) {
      this.resizeComponents();
    }
  }

  public resizeOnNextFrame = () => {
    if (this.nextFrameActionId) {
      Animation.clearNextFrameAction(this.nextFrameActionId);
    }
    this.nextFrameActionId = Animation.onNextFrame(this.resizeComponents);
  };

  public resizeComponents = () => {
    if (this.props.windowHeight !== 0) {
      const codeContainer = document.getElementById('cp-code-container');
      const codeUnderlay = document.getElementById('code-underlay');
      const codeSyntax = document.getElementById('code-syntax');
      const commentsContainer = document.getElementById('cp-code-panel--comments');
      const comments = document.getElementById('comments');

      const lineHeight = Layout.pixelsPerLine();
      const codeHeight = this.props.file.code.split('\n').length * lineHeight;

      if (
        codeContainer !== null &&
        codeUnderlay !== null &&
        codeSyntax !== null &&
        commentsContainer !== null &&
        comments !== null
      ) {
        // Viewport restrictions
        const codeContainerMaxHeight = this.props.windowHeight - codeContainer.offsetTop - 48 - 20;
        const codeContainerHeight = Math.min(codeContainerMaxHeight, codeHeight + 20 + 25);

        codeContainer.style.setProperty('height', `${codeContainerHeight}px`);
        codeUnderlay.style.setProperty('height', `${codeContainerHeight - 20 - 25}px`);
        codeSyntax.style.setProperty('height', `${codeContainerHeight - 20 - 25}px`);
        const codeContainerWidth = codeContainer.getBoundingClientRect().width;
        codeUnderlay.style.setProperty('width', `${codeContainerWidth - 40 - 20}px`);
        codeSyntax.style.setProperty('width', `${codeContainerWidth - 40 - 20}px`);

        const commentsContainerHeight = this.props.windowHeight - commentsContainer.offsetTop - 20;
        commentsContainer.style.setProperty('height', `${commentsContainerHeight}px`);
      }
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

  public updateCodeStyle = () => {
    return {
      lineHeight: `${this.lineHeight * this.state.zoom}px`,
      fontSize: `${this.fontSize * this.state.zoom}px`,
      paddingLeft: `${this.lineNumberPadding * this.state.zoom + 10}px`,
      highlightHeight: `${this.highlightHeight * this.state.zoom}px`,
    };
  };

  public onMouseEnter = () => {
    this.setState({ zoomVisible: true });
  };

  public onMouseLeave = () => {
    this.setState({ zoomVisible: false });
  };

  public render() {
    const { highlightHeight, paddingLeft, ...codeStyle } = this.updateCodeStyle();

    const highlights = document.getElementsByClassName('highlight');
    [].forEach.call(highlights, (highlight: any) => {
      highlight.style.setProperty('height', highlightHeight);
    });

    return (
      <div className="cp-code-panel-container" style={{ margin: '14px 11px 0px 0px' }}>
        <div className="cp-code-panel">
          <div className="cp-code-panel--code">
            <div
              id="cp-code-container"
              className="cp-code-container"
              onMouseEnter={this.onMouseEnter}
              onMouseLeave={this.onMouseLeave}
            >
              <Magnifier zoomIn={this.zoomIn} zoomOut={this.zoomOut} visible={this.state.zoomVisible} />
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

const Magnifier = (props: any) => {
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

export default withWindowWatcher(CPLayoutCodePanel);
