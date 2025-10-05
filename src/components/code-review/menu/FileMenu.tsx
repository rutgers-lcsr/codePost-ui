/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';

/* antd imports */
import type { MenuProps } from 'antd';
import { Badge as AntBadge, Dropdown, Menu } from 'antd';

import moment from 'moment';

// Type for Menu onSelect callback
type SelectInfo = Parameters<NonNullable<MenuProps['onSelect']>>[0];

/* codePost imports */
import { CommentType } from '../../../infrastructure/comment';
import { FileType } from '../../../infrastructure/file';
import { Submission } from '../../../infrastructure/submission';

import { IFileToCommentsMap } from '../../../types/common';

import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import * as CodeConsoleUtils from '../codeConsoleUtils';

import Badge from '../../core/Badge';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import { OS, getOperatingSystem, osControlKey } from '../../core/operatingSystem';

import { sendSlack } from '../../core/slack';

import { LOCAL_SETTINGS } from '../../utils/LocalSettings';

import { IDirectoryStructure, IFolder, buildFolderMenu, createDirectoryStructure, sortFiles } from './fileMenuUtils';

/*************************************** Helper Interfaces for Directory rendering ******************************/

/*************************************** State and Props Interfaces **********************************/

interface IFileMenuProps extends IWithWindowWatcherProps {
  title?: string;
  files: FileType[];
  comments?: IFileToCommentsMap;
  selectedFile?: FileType;
  changeSelectedFile: (fileID: number) => void;
  getPointsInFile: (file: FileType) => number[];
  hidePoints?: boolean;
}

const FileMenu: React.FC<IFileMenuProps> = (props) => {
  const consoleTheme = useContext(ConsoleThemeContext);

  // Initialize state with useMemo for computed initial values
  const initialState = React.useMemo(() => {
    const separatedFiles = Submission.filesByVersion(props.files);
    const directoryStructure = createDirectoryStructure(separatedFiles.new);
    const sortedFiles = sortFiles(directoryStructure);
    const oldVersionsMap = separatedFiles.old;
    if (oldVersionsMap && Object.keys(oldVersionsMap).length > 0) {
      sendSlack('File Versioning', window.location.href, '#f9f9f9', '#user_notifications_beta_use');
    }
    return {
      directoryStructure,
      sortedFiles,
      oldVersionsMap,
    };
  }, [props.files]);

  const [directoryStructure, setDirectoryStructure] = useState<IDirectoryStructure<FileType>>(
    initialState.directoryStructure,
  );
  const [sortedFiles, setSortedFiles] = useState<FileType[]>(initialState.sortedFiles);
  const [oldVersionsMap, setOldVersionsMap] = useState<{ [path: string]: FileType[] }>(initialState.oldVersionsMap);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const os = getOperatingSystem();
      const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

      if (e.which >= 49 && e.which <= 57 && triggerKey) {
        e.preventDefault();
        if (e.which - 49 < props.files.length) {
          props.changeSelectedFile(sortedFiles[e.which - 49].id);
        }
      }
    },
    [props, sortedFiles],
  );

  // Auto-select first file on mount
  useEffect(() => {
    const autosettedFile = sortedFiles.find((f: FileType) => {
      return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
    });
    if (autosettedFile === undefined && sortedFiles.length > 0) {
      // If the file has a directory, then the order of the files in the UI might be different than the order passed in
      // After getting the order, we want to change the selected file to be the first in the list
      props.changeSelectedFile(sortedFiles[0].id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Update directory structure and file list when files or comments change.
   * Watching props.comments ensures the file menu re-renders when comment points are updated,
   * so the displayed point totals stay in sync with comment changes.
   */
  useEffect(() => {
    const separatedFiles = Submission.filesByVersion(props.files);
    const newDirectoryStructure = createDirectoryStructure(separatedFiles.new);
    const newSortedFiles = sortFiles(newDirectoryStructure);
    setDirectoryStructure(newDirectoryStructure);
    setSortedFiles(newSortedFiles);
    setOldVersionsMap(separatedFiles.old);
  }, [props.files, props.comments]);

  // Keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  /**************************** MENU BUILD HELPER FUNCTIONS *************************************/
  // File select handler
  const onFileSelect = useCallback(
    (isOldFile: boolean, e: SelectInfo) => {
      if (e) {
        const fileID = +e.key.split('-')[1];
        props.changeSelectedFile(fileID);
        if (isOldFile) {
          e.domEvent.preventDefault();
          e.domEvent.stopPropagation();
        }
      }
    },
    [props],
  );

  // Get the latest number of comments in a file (file.comments might be out of date because
  //   we re-calculate sort on change of props.file, which doesn't update when comments change
  const getNumCommentsInFile = useCallback(
    (file: FileType) => {
      let commentCount;
      if (props.comments === undefined || !Object.prototype.hasOwnProperty.call(props.comments, file.id)) {
        commentCount = file.comments.length;
      } else {
        commentCount = props.comments[file.id].filter((comment: CommentType) => {
          return comment.id > 0;
        }).length;
      }
      return commentCount;
    },
    [props.comments],
  );

  // OLD VERSIONS MENU BUILD
  const buildOldVersionsMenu = useCallback(
    (currentFile: FileType, oldVersions: FileType[], path: string) => {
      const sortedOldVersions = oldVersions.sort((f1: FileType, f2: FileType) => {
        return f2.id - f1.id;
      });

      const oldVersionItems = sortedOldVersions.map((f2: FileType) => {
        const numComments = getNumCommentsInFile(f2);
        return {
          key: `file-${f2.id}`,
          label: (
            <div className="display-flex align-items-center justify-content-space-between">
              {moment(f2.created).format('lll')}
              {numComments > 0 ? <Badge count={numComments} forcedStyle="neutral" size="small" /> : <div />}
            </div>
          ),
          style: { minWidth: 200 },
        };
      });

      const currentFileNumComments = getNumCommentsInFile(currentFile);
      const menuItems = [
        {
          key: `${path}-old-versions`,
          label: `${currentFile.name} history`,
          children: [
            {
              key: `file-${currentFile.id}`,
              label: (
                <div className="display-flex align-items-center justify-content-space-between">
                  <div style={{ lineHeight: 1.5, marginTop: 4 }}>
                    <div style={{ fontSize: 10, fontStyle: 'italic' }}>Current Version</div>
                    <div>{moment(currentFile.created).format('lll')}</div>
                  </div>
                  {currentFileNumComments > 0 ? (
                    <Badge count={currentFileNumComments} forcedStyle="neutral" size="small" />
                  ) : (
                    <div />
                  )}
                </div>
              ),
              style: { minWidth: 200 },
            },
            ...oldVersionItems,
          ],
        },
      ];

      return (
        <Dropdown
          menu={{
            items: menuItems,
            mode: 'inline',
            selectedKeys: props.selectedFile ? [`file-${props.selectedFile.id}`] : [],
            defaultOpenKeys: [`${path}-old-versions`],
            style: { minWidth: 280 },
            onSelect: (e) => onFileSelect(true, e),
          }}
          placement="bottomCenter"
          trigger={['hover']}
        >
          <AntBadge
            count={oldVersionsMap[path].length + 1}
            style={{
              backgroundColor: '#fff',
              color: '#999',
              boxShadow: '0 0 0 1px #d9d9d9 inset',
              marginLeft: 6,
              borderRadius: 0,
            }}
          />
        </Dropdown>
      );
    },
    [getNumCommentsInFile, props.selectedFile, oldVersionsMap, onFileSelect],
  );

  // FILE MENU HELPER - BADGE STYLING
  const buildFileBadges = useCallback(
    (file: FileType, commentCount: number, deductions: number, bonuses: number) => {
      let faded = true;
      if (props.selectedFile && props.selectedFile.id === file.id) {
        faded = false;
      }

      let commentCountBadge = null;
      if (commentCount > 0) {
        commentCountBadge = <Badge count={commentCount} forcedStyle="neutral" faded={faded} size="small" />;
      } else {
        commentCountBadge = null;
      }

      let deductionBadge = null;
      let bonusBadge = null;

      if (deductions > 0) {
        deductionBadge = <Badge count={parseFloat((deductions * -1).toFixed(2))} faded={faded} size="small" />;
      } else {
        deductionBadge = null;
      }

      if (bonuses > 0) {
        bonusBadge = <Badge count={parseFloat(bonuses.toFixed(2))} faded={faded} size="small" />;
      } else {
        bonusBadge = null;
      }

      const badgesStyle: React.CSSProperties = { position: 'absolute', right: '12px', top: '0px', width: '96px' };

      return (
        <div style={badgesStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {!props.hidePoints ? (
              <CPTooltip title={tooltips.console.fileMenu.bonuses} hideThisOnHideTips={true}>
                <div style={{ minWidth: 25 }}>{bonusBadge}</div>
              </CPTooltip>
            ) : null}
            {!props.hidePoints ? (
              <CPTooltip title={tooltips.console.fileMenu.deductions} hideThisOnHideTips={true}>
                <div style={{ minWidth: 25 }}>{deductionBadge}</div>
              </CPTooltip>
            ) : null}
            <CPTooltip title={tooltips.console.fileMenu.comments} hideThisOnHideTips={true}>
              <div style={{ minWidth: 25 }}>{commentCountBadge}</div>
            </CPTooltip>
          </div>
        </div>
      );
    },
    [props.selectedFile, props.hidePoints],
  );

  // FILE MENU BUILD
  const buildFileMenu = useCallback(
    (sortedFilesParam: FileType[], files: FileType[]): MenuProps['items'] => {
      const shrunkSider = LOCAL_SETTINGS.siderWidth.getter() < 202;

      const codeFiles = files.map((file: FileType) => {
        let oldVersionsMenu: React.ReactNode = null;
        const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;

        if (oldVersionsMap[path]) {
          oldVersionsMenu = buildOldVersionsMenu(file, oldVersionsMap[path], path);
        }

        /* tslint:disable */
        const shortcutStyle: React.CSSProperties = !shrunkSider
          ? { fontSize: '9px', color: '#ccc', verticalAlign: 'middle' }
          : {
              fontSize: '9px',
              color: '#ccc',
              position: 'absolute',
              right: '-27px',
              top: '10px',
            };
        /* tslint:enable */

        // Find the file order in the list to sync the keyboard shortcuts with the UI order
        const sortedIndex = sortedFilesParam.findIndex((f) => {
          return f.id === file.id;
        });

        const [deductions, bonuses] = props.getPointsInFile(file);
        const commentCount = getNumCommentsInFile(file);

        const menuItem = (
          <div>
            <div
              style={{
                display: 'inline-block',
                lineHeight: '12px',
              }}
            >
              {sortedIndex < 9 ? (
                <span style={shortcutStyle}>
                  [{osControlKey()}
                  {sortedIndex + 1}]
                </span>
              ) : null}
              <div style={{ display: 'inline-block', width: '8px' }} />
              <div
                style={{
                  minWidth: !shrunkSider ? 0 : '124px',
                  verticalAlign: 'middle',
                  fontSize: 12,
                  display: 'inline-block',
                }}
                title={file.name}
              >
                <span
                  style={{
                    maxWidth: !shrunkSider ? '134px' : '124px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }}
                >
                  {file.name}
                </span>
                {oldVersionsMenu}
              </div>
            </div>
            {!shrunkSider ? buildFileBadges(file, commentCount, deductions, bonuses) : <div />}
          </div>
        );

        const badgeStyle = {
          fontSize: 10,
          padding: '0 2px',
          opacity: props.selectedFile && props.selectedFile.id === file.id ? 1 : 0.7,
        };

        const menuItemShrunkSider = (
          <AntBadge count={bonuses} dot={false} offset={[-6, -5]} style={{ backgroundColor: '#24be85', ...badgeStyle }}>
            <AntBadge
              count={deductions}
              dot={false}
              offset={[12, -5]}
              style={{ backgroundColor: 'red', ...badgeStyle }}
            >
              <AntBadge
                count={commentCount}
                dot={false}
                offset={[30, -5]}
                style={{ backgroundColor: 'grey', ...badgeStyle }}
              >
                {menuItem}
              </AntBadge>
            </AntBadge>
          </AntBadge>
        );

        return {
          key: `file-${file.id}`,
          label: shrunkSider ? menuItemShrunkSider : menuItem,
          style: { height: !shrunkSider ? undefined : '54px', paddingLeft: '10px' },
        };
      });

      return codeFiles;
    },
    [oldVersionsMap, buildOldVersionsMenu, props, getNumCommentsInFile, buildFileBadges],
  );

  /**************************** RENDER *************************************/
  const rootFiles = buildFileMenu(sortedFiles, directoryStructure.files) || [];

  const theme = consoleThemes.light === consoleTheme.consoleTheme ? 'light' : 'dark';

  const className = theme === 'light' ? 'sider-menu sider-menu--light' : 'sider-menu sider-menu--dark';
  const subMenuClassName =
    theme === 'light' ? 'sider-submenu sider-submenu--light' : 'sider-submenu sider-submenu--dark';

  const folders = directoryStructure.folders.map((f: IFolder<FileType>) => {
    return buildFolderMenu('', f, (files: FileType[]) => buildFileMenu(sortedFiles, files), subMenuClassName);
  });

  const menuItems: MenuProps['items'] = [...rootFiles, ...folders];

  return (
    <div id="file-menu" style={{ overflowY: 'auto' }}>
      <Menu
        selectedKeys={props.selectedFile ? [`file-${props.selectedFile.id}`] : []}
        mode="inline"
        className={className}
        style={{
          backgroundColor: consoleTheme.consoleTheme.siderBg,
          color: consoleTheme.consoleTheme.siderMenuItemColor,
        }}
        onSelect={(e) => onFileSelect(false, e)}
        items={menuItems}
      />
    </div>
  );
};

interface IFileMenuTitleProps {
  files: FileType[];
}

export const FileMenuTitle = (props: IFileMenuTitleProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const numUniqueFiles = CodeConsoleUtils.filterCurrentFileVersions(props.files)[0].size;
  const badge = (
    <AntBadge
      style={{
        backgroundColor: consoleTheme.siderBg,
        color: consoleTheme.commentRubricCommentNeutral,
        boxShadow: `0 0 0 1px ${consoleTheme.buttonDisabledColor} inset`,
      }}
      count={numUniqueFiles}
    />
  );

  const numOldVersions = props.files.length - numUniqueFiles;

  return (
    <span>
      Files
      <div style={{ display: 'inline-block', marginLeft: '8px', position: 'absolute', transform: 'translateY(-6%)' }}>
        {numOldVersions ? (
          <CPTooltip
            title={`This submission contains ${numOldVersions} older version${
              numOldVersions > 1 ? 's' : ''
            } of these files.`}
            placement="right"
          >
            {badge}
          </CPTooltip>
        ) : (
          badge
        )}
      </div>
    </span>
  );
};

const FileMenuWithWindowWatcher = withWindowWatcher(FileMenu);

export default FileMenuWithWindowWatcher;
