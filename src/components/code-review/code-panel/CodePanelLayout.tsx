import * as React from 'react';

import { FileType } from '../../../infrastructure/file';

import * as Animation from '../../../infrastructure/animation';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import themeVars from '../../../styles/abstracts/_theme.js';

import ErrorBoundary from '../../core/ErrorBoundary';
import SplitScreen from '../../utils/SplitScreen.js';

interface ICodePanelLayoutProps extends IWithWindowWatcherProps {
  file: FileType;
  toolbarWidgets: React.ReactNode[];
  code: (onHighlightClick: (e: React.MouseEvent) => void) => React.ReactNode;
  comments: React.ReactNode;
  zoom: number;
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
}

export const LayoutCodePanel: React.FC<ICodePanelLayoutProps> = (props) => {
  const nextFrameActionIdRef = React.useRef<number>();

  const resizeComponents = React.useCallback(async () => {
    if (props.windowheight !== 0) {
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
          props.windowheight - commentsContainer.getBoundingClientRect().top - themeVars.grade.marginBottom;
        commentsContainer.style.setProperty('min-height', `${commentsContainerHeight}px`);
      }
    }
  }, [props.windowheight]);

  // Browser optimization to facilitate smoother animations
  const resizeOnNextFrame = React.useCallback(() => {
    if (nextFrameActionIdRef.current) {
      Animation.clearNextFrameAction(nextFrameActionIdRef.current);
    }
    nextFrameActionIdRef.current = Animation.onNextFrame(resizeComponents);
  }, [resizeComponents]);

  const onHighlightClick = React.useCallback(
    (e: React.MouseEvent) => {
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
            props.updateVerticalOffset((oldValue: number) => {
              return commentTop - offSetValue + oldValue + -18;
            });
          }
        }
      }
    },
    [props],
  );

  // ComponentDidMount - resize on initial mount
  React.useEffect(() => {
    resizeOnNextFrame();
  }, [resizeOnNextFrame]);

  // ComponentDidUpdate - handle window size changes
  React.useEffect(() => {
    resizeOnNextFrame();
  }, [props.windowheight, props.windowwidth, resizeOnNextFrame]);

  // ComponentDidUpdate - handle file changes
  React.useEffect(() => {
    resizeOnNextFrame();
  }, [props.file, resizeOnNextFrame]);

  const zoomStyles = {
    transform: `scale(${props.zoom})`,
    transformOrigin: '0 0',
    width: `${100 / props.zoom}%`,
    height: `${100 / props.zoom}%`,
  };

  const codePanelStyle = localStorage.getItem('source') === 'codePost' ? {} : { backgroundColor: 'rgb(242, 242, 242)' };

  return (
    <ErrorBoundary type="codepanel" submissionID={props.file.submission} file={props.file}>
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div
          style={{
            ...{
              position: 'absolute',
            },
            ...zoomStyles,
          }}
        >
          <div
            className="code-panel"
            id="code-panel"
            style={{ ...codePanelStyle, height: props.windowheight - 78, padding: '20px 20px' }}
          >
            <SplitScreen>
              <div
                className="code-panel--code"
                style={{
                  position: 'relative',
                  // flex: '1 1 60%',
                  minWidth: '400px',
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'auto',
                }}
              >
                <div
                  id="code-tour-target"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: `${props.windowheight - 78}px`,
                  }}
                />
                {props.code(onHighlightClick)}
              </div>
              <div
                id="code-panel--comments"
                className="code-panel--comments"
                style={{
                  flex: '1 1 40%',
                  // minWidth: '300px',
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}
              >
                {props.comments}
              </div>
            </SplitScreen>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

const CodePanelLayout = withWindowWatcher(LayoutCodePanel);
export default CodePanelLayout;
