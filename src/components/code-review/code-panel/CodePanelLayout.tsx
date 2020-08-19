import * as React from 'react';

import { FileType } from '../../../infrastructure/file';

import * as Animation from '../../../infrastructure/animation';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import themeVars from '../../../styles/abstracts/_theme.js';

import ErrorBoundary from '../../core/ErrorBoundary';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { CodeConsoleDimensionsType } from './LayoutResizer';

interface ICodePanelLayoutProps extends IWithWindowWatcherProps {
  file: FileType;
  toolbarWidgets: React.ReactNode[];
  code: (onHighlightClick: (e: React.MouseEvent) => void) => React.ReactNode;
  comments: React.ReactNode;
  zoom: number;
  dimensions: CodeConsoleDimensionsType;
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
}

class LayoutCodePanel extends React.Component<ICodePanelLayoutProps, {}> {
  // @ts-ignore
  public nextFrameActionId: number;

  public componentDidUpdate = async (prevProps: ICodePanelLayoutProps) => {
    if (this.props.windowheight !== prevProps.windowheight || this.props.windowwidth !== prevProps.windowwidth) {
      this.resizeOnNextFrame();
    }

    if (this.props.file !== prevProps.file) {
      // await Animation.wait(1000);
      this.resizeOnNextFrame();
    }

    if (this.props.dimensions !== prevProps.dimensions) {
      this.resizeComponents();
    }
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

  public resizeComponents = async () => {
    if (this.props.windowheight !== 0) {
      const codeContainer = document.getElementById('code-container');
      const codeMain = document.getElementById('code-main');
      const codeSyntax = document.getElementById('code-syntax');
      const commentsContainer = document.getElementById('code-panel--comments');
      const comments = document.getElementById('comments');
      const codeTemplate = document.getElementById('code-template');

      if (codeContainer !== null && codeMain !== null && commentsContainer !== null && comments !== null) {
        //  parseInt(codeMain.style.marginLeft, 10)
        const codeMainWidth = codeContainer.offsetWidth;
        codeMain.style.setProperty('width', `${codeMainWidth}px`);
        if (codeSyntax !== null) {
          codeSyntax.style.setProperty('width', `${codeMainWidth}px`);
        }
        if (codeTemplate !== null) {
          codeTemplate.style.setProperty('width', `${codeMainWidth}px`);
        }

        const commentsContainerHeight =
          this.props.windowheight - commentsContainer.getBoundingClientRect().top - themeVars.grade.marginBottom;
        commentsContainer.style.setProperty('min-height', `${commentsContainerHeight}px`);
      }
    }
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
    const zoomStyles = {
      transform: `scale(${this.props.zoom})`,
      transformOrigin: '0 0',
      width: `${100 / this.props.zoom}%`,
      height: `${100 / this.props.zoom}%`,
    };

    const codePanelStyle =
      localStorage.getItem('source') === 'codePost' ? {} : { backgroundColor: 'rgb(242, 242, 242)' };

    return (
      <ErrorBoundary type="codepanel" submissionID={this.props.file.submission} file={this.props.file}>
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
          <div
            style={{
              ...{
                position: 'absolute',
              },
              ...zoomStyles,
            }}
          >
            <div className="code-panel" id="code-panel" style={codePanelStyle}>
              <div
                style={{
                  margin: `4px 0px 4px ${themeVars.grade.codeContainer.marginLeft}px`,
                }}
              >
                {this.props.toolbarWidgets}
              </div>
              <div
                className="code-panel--code"
                style={{
                  margin: `${themeVars.grade.codeContainer.marginTop}px 10px 0px ${themeVars.grade.codeContainer.marginLeft}px`,
                  position: 'relative',
                }}
              >
                <div
                  id="code-tour-target"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: `${this.props.windowheight - 78}px`,
                  }}
                />
                {this.props.code(this.onHighlightClick)}
              </div>
              <div
                id="code-panel--comments"
                className="code-panel--comments"
                style={{
                  minWidth: `${this.props.dimensions.commentsWidth}px`,
                  height: 'fit-content',
                }}
              >
                {this.props.comments}
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
