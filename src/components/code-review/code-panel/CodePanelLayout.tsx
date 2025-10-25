import * as React from 'react';

import { FileType } from '../../../infrastructure/file';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import ErrorBoundary from '../../core/ErrorBoundary';
import SplitScreen from '../../utils/SplitScreen.js';
import { Divider } from 'antd';
interface ICodePanelLayoutProps extends IWithWindowWatcherProps {
  file: FileType;
  toolbarWidgets: React.ReactNode[];
  code: (onHighlightClick: (e: React.MouseEvent) => void) => React.ReactNode;
  comments: React.ReactNode;
  zoom: number;
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
}

export const LayoutCodePanel: React.FC<ICodePanelLayoutProps> = (props) => {
  const onHighlightClick = React.useCallback(
    (e: React.MouseEvent) => {
      let commentID;
      if (e.currentTarget !== null && e.currentTarget.id.split('-').length === 3) {
        commentID = e.currentTarget.id.split('-')[2];
      }

      if (!commentID && e.currentTarget instanceof HTMLElement) {
        const datasetComment = e.currentTarget.dataset.commentId;
        if (datasetComment) {
          commentID = datasetComment;
        }
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
            style={{ ...codePanelStyle, height: props.windowheight - 50, padding: '20px 20px' }}
          >
            <SplitScreen initialLeftWidth={72}>
              <div
                className="code-panel--code"
                style={{
                  position: 'relative',
                  minWidth: '300px',
                  height: '100%',
                }}
              >
                {/* Toolbar widgets (e.g., Execute button) */}
                {props.toolbarWidgets && props.toolbarWidgets.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      // backgroundColor: '#f5f5f5',

                      marginBottom: '10px',
                    }}
                  >
                    <Divider orientation="left">{props.toolbarWidgets}</Divider>
                  </div>
                )}
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
                  height: '100%',
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
