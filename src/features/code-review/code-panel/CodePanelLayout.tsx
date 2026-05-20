// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../../components/core/withWindowWatcher';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import ErrorBoundary from '../../../components/core/ErrorBoundary';
import { fileTypeRegistry } from '../formats';
import SplitScreen from '../../../components/utils/SplitScreen.js';
import type { FileType } from '../../../utils/file';
// import { Divider } from 'antd';
interface ICodePanelLayoutProps extends IWithWindowWatcherProps {
  file: FileType;
  toolbarWidgets: React.ReactNode[];
  code: (onHighlightClick: (e: React.MouseEvent) => void) => React.ReactNode;
  comments: React.ReactNode;
  zoom: number;
  updateVerticalOffset: (updater: (oldValue: number) => number) => void;
  isEditMode?: boolean;
  isDiffMode?: boolean;
}

export const LayoutCodePanel: React.FC<ICodePanelLayoutProps> = (props) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isDarkTheme = consoleThemes.dark === consoleTheme;

  // Only Monaco-based files manage their own internal scrolling.
  // Inline-edit types (e.g. notebooks) need the parent container to scroll.
  const usesMonacoEdit = React.useMemo(() => fileTypeRegistry.detect(props.file).editMode === 'monaco', [props.file]);

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

  const codePanelStyle =
    localStorage.getItem('source') === 'codePost'
      ? {}
      : { backgroundColor: isDarkTheme ? consoleTheme.mainBg : 'rgb(242, 242, 242)' };

  return (
    <ErrorBoundary
      type="codepanel"
      submissionID={typeof props.file.submission === 'number' ? props.file.submission : undefined}
      file={props.file}
    >
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <div
          style={{
            ...{
              position: 'absolute',
            },
            ...zoomStyles,
          }}
        >
          <div className="code-panel" id="code-panel" style={{ ...codePanelStyle, height: '100%' }}>
            <SplitScreen initialLeftWidth={72} minLeftWidth={280} minRightWidth={220}>
              <div
                className="code-panel--code"
                style={{
                  position: 'relative',
                  minWidth: '300px',
                  height: '100%',
                  paddingBottom: (props.isEditMode || props.isDiffMode) && usesMonacoEdit ? 0 : '20em',
                  overflowY: (props.isEditMode || props.isDiffMode) && usesMonacoEdit ? 'hidden' : undefined,
                }}
              >
                {/* Toolbar */}
                {props.toolbarWidgets && props.toolbarWidgets.length > 0 && (
                  <div
                    className="code-toolbar"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderBottom: `1px solid ${isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      position: 'sticky',
                      top: 0,
                      zIndex: 100,
                      backgroundColor: isDarkTheme ? consoleTheme.codeBg : '#fafafa',
                      minHeight: 36,
                    }}
                  >
                    {props.toolbarWidgets}
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
                  overflow: 'auto',
                  overscrollBehavior: 'contain',
                  padding: '4px 8px 20em 4px',
                  minWidth: '220px',
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
