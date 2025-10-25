/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useContext, useEffect, useState } from 'react';

/* theme imports */
import { colors } from '../../../theme/colors';

/* antd imports */
import type { MenuProps } from 'antd';
import { Badge as AntBadge, Dropdown, Menu } from 'antd';

import moment from 'moment';

// Type for Menu onSelect callback
type SelectInfo = Parameters<NonNullable<MenuProps['onSelect']>>[0];

type FileMenuCSSVariable =
  | '--file-menu-selected-bg'
  | '--file-menu-selected-color'
  | '--file-menu-submenu-bg'
  | '--file-menu-submenu-color'
  | '--file-menu-submenu-border'
  | '--file-menu-history-badge-bg'
  | '--file-menu-history-badge-color'
  | '--file-menu-history-badge-shadow'
  | '--file-menu-bonus-badge-bg'
  | '--file-menu-deduction-badge-bg'
  | '--file-menu-comment-badge-bg';

type FileMenuRootStyle = React.CSSProperties & Record<FileMenuCSSVariable, string>;

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

const visuallyHiddenStyle: React.CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  width: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
};

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
  const { title, files, comments, selectedFile, changeSelectedFile, getPointsInFile, hidePoints } = props;
  const consoleTheme = useContext(ConsoleThemeContext);
  const isDarkTheme = consoleThemes.dark === consoleTheme.consoleTheme;

  const rootStyle = React.useMemo<FileMenuRootStyle>(() => {
    const highlightColor = consoleTheme.consoleTheme.highlight ?? '#1677ff';
    const historyBorder = consoleTheme.consoleTheme.codeBorder ?? '#d9d9d9';
    return {
      overflowY: 'auto',
      '--file-menu-selected-bg': isDarkTheme ? 'rgba(36, 190, 133, 0.28)' : '#f0fff7',
      '--file-menu-selected-color': highlightColor,
      '--file-menu-submenu-bg': consoleTheme.consoleTheme.siderSubmenuTitleBg ?? '#f9f9f9',
      '--file-menu-submenu-color': consoleTheme.consoleTheme.siderSubmenuTitleColor ?? highlightColor,
      '--file-menu-submenu-border': consoleTheme.consoleTheme.siderSubmenuBorder ?? '1px solid rgba(0, 0, 0, 0.05)',
      '--file-menu-history-badge-bg': consoleTheme.consoleTheme.commentBody ?? '#ffffff',
      '--file-menu-history-badge-color': consoleTheme.consoleTheme.commentRubricCommentNeutral ?? 'rgba(0, 0, 0, 0.45)',
      '--file-menu-history-badge-shadow': `0 0 0 1px ${historyBorder} inset`,
      '--file-menu-bonus-badge-bg': colors.brandPrimary,
      '--file-menu-deduction-badge-bg': isDarkTheme ? '#ff7875' : '#ff4d4f',
      '--file-menu-comment-badge-bg': consoleTheme.consoleTheme.commentRubricCommentNeutral ?? 'rgba(0, 0, 0, 0.45)',
    };
  }, [consoleTheme, isDarkTheme]);

  // Initialize state with useMemo for computed initial values
  const initialState = React.useMemo(() => {
    const separatedFiles = Submission.filesByVersion(files);
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
  }, [files]);

  const [directoryStructure, setDirectoryStructure] = useState<IDirectoryStructure<FileType>>(
    initialState.directoryStructure,
  );
  const [sortedFiles, setSortedFiles] = useState<FileType[]>(initialState.sortedFiles);
  const [oldVersionsMap, setOldVersionsMap] = useState<{ [path: string]: FileType[] }>(initialState.oldVersionsMap);
  const [openHistoryPath, setOpenHistoryPath] = useState<string | null>(null);

  const getFileSummaryLabel = useCallback(
    (fileName: string, commentCount: number, deductionValue: number, bonusValue: number) => {
      const summaryParts: string[] = [];

      if (!hidePoints) {
        if (bonusValue > 0) {
          summaryParts.push(`${bonusValue} ${bonusValue === 1 ? 'bonus point awarded' : 'bonus points awarded'}`);
        } else {
          summaryParts.push('No bonus points awarded');
        }

        if (deductionValue > 0) {
          summaryParts.push(`${deductionValue} ${deductionValue === 1 ? 'point deducted' : 'points deducted'}`);
        } else {
          summaryParts.push('No point deductions');
        }
      }

      summaryParts.push(
        commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}` : 'No comments',
      );

      return `File ${fileName}: ${summaryParts.join('; ')}`;
    },
    [hidePoints],
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      const os = getOperatingSystem();
      const modifierHeld = os === OS.WINDOWS ? event.ctrlKey : event.metaKey;
      if (!modifierHeld) {
        return;
      }

      const digit = Number.parseInt(event.key, 10);
      if (!Number.isInteger(digit) || digit < 1 || digit > 9) {
        return;
      }

      if (digit - 1 < sortedFiles.length) {
        event.preventDefault();
        changeSelectedFile(sortedFiles[digit - 1].id);
      }
    },
    [changeSelectedFile, sortedFiles],
  );

  // Auto-select first file on mount
  useEffect(() => {
    const autosettedFile = sortedFiles.find((f: FileType) => {
      return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
    });
    if (autosettedFile === undefined && sortedFiles.length > 0) {
      // If the file has a directory, then the order of the files in the UI might be different than the order passed in
      // After getting the order, we want to change the selected file to be the first in the list
      changeSelectedFile(sortedFiles[0].id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Update directory structure and file list when files or comments change.
   * Watching props.comments ensures the file menu re-renders when comment points are updated,
   * so the displayed point totals stay in sync with comment changes.
   */
  useEffect(() => {
    const separatedFiles = Submission.filesByVersion(files);
    const newDirectoryStructure = createDirectoryStructure(separatedFiles.new);
    const newSortedFiles = sortFiles(newDirectoryStructure);
    setDirectoryStructure(newDirectoryStructure);
    setSortedFiles(newSortedFiles);
    setOldVersionsMap(separatedFiles.old);
  }, [files, comments]);

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
        changeSelectedFile(fileID);
        if (isOldFile) {
          e.domEvent.preventDefault();
          e.domEvent.stopPropagation();
        }
      }
    },
    [changeSelectedFile],
  );

  // Get the latest number of comments in a file (file.comments might be out of date because
  //   we re-calculate sort on change of props.file, which doesn't update when comments change
  const getNumCommentsInFile = useCallback(
    (file: FileType) => {
      let commentCount;
      if (comments === undefined || !Object.prototype.hasOwnProperty.call(comments, file.id)) {
        commentCount = file.comments.length;
      } else {
        commentCount = comments[file.id].filter((comment: CommentType) => {
          return comment.id > 0;
        }).length;
      }
      return commentCount;
    },
    [comments],
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
            selectedKeys: selectedFile ? [`file-${selectedFile.id}`] : [],
            defaultOpenKeys: [`${path}-old-versions`],
            style: { minWidth: 280 },
            onSelect: (e) => onFileSelect(true, e),
          }}
          placement="bottomCenter"
          trigger={['click', 'hover']}
          open={openHistoryPath === path}
          onOpenChange={(isOpen) => setOpenHistoryPath(isOpen ? path : null)}
        >
          <button
            type="button"
            aria-label={`View version history for ${currentFile.name}`}
            aria-expanded={openHistoryPath === path}
            aria-haspopup="menu"
            style={{
              background: 'none',
              border: 0,
              margin: 0,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <AntBadge
              count={oldVersionsMap[path].length + 1}
              style={{
                backgroundColor: 'var(--file-menu-history-badge-bg)',
                color: 'var(--file-menu-history-badge-color)',
                boxShadow: 'var(--file-menu-history-badge-shadow)',
                marginLeft: 6,
                borderRadius: 0,
              }}
            />
            <span style={visuallyHiddenStyle}>
              {openHistoryPath === path
                ? `${currentFile.name} version history menu expanded. Use arrow keys to explore versions.`
                : `${currentFile.name} has ${oldVersionsMap[path].length} earlier version${
                    oldVersionsMap[path].length === 1 ? '' : 's'
                  }. Activate to open history.`}
            </span>
          </button>
        </Dropdown>
      );
    },
    [getNumCommentsInFile, selectedFile, oldVersionsMap, onFileSelect, openHistoryPath, setOpenHistoryPath],
  );

  // FILE MENU HELPER - BADGE STYLING
  const buildFileBadges = useCallback(
    (file: FileType, commentCount: number, deductions: number, bonuses: number) => {
      let faded = true;
      if (selectedFile && selectedFile.id === file.id) {
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
            {!hidePoints ? (
              <CPTooltip title={tooltips.console.fileMenu.bonuses} hideThisOnHideTips={true}>
                <div style={{ minWidth: 25 }}>{bonusBadge}</div>
              </CPTooltip>
            ) : null}
            {!hidePoints ? (
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
    [selectedFile, hidePoints],
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
          ? { fontSize: '9px', verticalAlign: 'middle' }
          : {
              fontSize: '9px',
              position: 'absolute',
              right: '-27px',
              top: '10px',
            };
        /* tslint:enable */

        // Find the file order in the list to sync the keyboard shortcuts with the UI order
        const sortedIndex = sortedFilesParam.findIndex((f) => {
          return f.id === file.id;
        });

        const [deductions, bonuses] = getPointsInFile(file);
        const commentCount = getNumCommentsInFile(file);
        const normalizedDeductions = deductions < 0 ? deductions * -1 : deductions;
        const fileSummaryLabel = getFileSummaryLabel(file.name, commentCount, normalizedDeductions, bonuses);

        const menuItem = (
          <div aria-current={selectedFile && selectedFile.id === file.id ? 'true' : undefined}>
            <span style={visuallyHiddenStyle}>{fileSummaryLabel}</span>
            <div
              style={{
                display: 'inline-block',
                lineHeight: '12px',
              }}
              aria-hidden="true"
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
            {!shrunkSider ? buildFileBadges(file, commentCount, deductions, bonuses) : <div aria-hidden="true" />}
          </div>
        );

        const badgeStyle = {
          fontSize: 10,
          padding: '0 2px',
          opacity: selectedFile && selectedFile.id === file.id ? 1 : 0.7,
        };

        const menuItemShrunkSider = (
          <AntBadge
            count={bonuses}
            dot={false}
            offset={[-6, -5]}
            style={{ backgroundColor: 'var(--file-menu-bonus-badge-bg)', ...badgeStyle }}
          >
            <AntBadge
              count={deductions}
              dot={false}
              offset={[12, -5]}
              style={{ backgroundColor: 'var(--file-menu-deduction-badge-bg)', ...badgeStyle }}
            >
              <AntBadge
                count={commentCount}
                dot={false}
                offset={[30, -5]}
                style={{ backgroundColor: 'var(--file-menu-comment-badge-bg)', ...badgeStyle }}
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
    [
      oldVersionsMap,
      buildOldVersionsMenu,
      getPointsInFile,
      selectedFile,
      getNumCommentsInFile,
      buildFileBadges,
      getFileSummaryLabel,
    ],
  );

  /**************************** RENDER *************************************/
  const rootFiles = buildFileMenu(sortedFiles, directoryStructure.files) || [];

  const theme = consoleThemes.light === consoleTheme.consoleTheme ? 'light' : 'dark';

  const className = theme === 'light' ? 'sider-menu sider-menu--light' : 'sider-menu sider-menu--dark';
  const subMenuClassName =
    theme === 'light' ? 'sider-submenu sider-submenu--light' : 'sider-submenu sider-submenu--dark';

  const folders = directoryStructure.folders.map((f: IFolder<FileType>) => {
    return buildFolderMenu('', f, (filesParam: FileType[]) => buildFileMenu(sortedFiles, filesParam), subMenuClassName);
  });

  const menuItems: MenuProps['items'] = [...rootFiles, ...folders];

  return (
    <div id="file-menu" style={rootStyle}>
      <Menu
        selectedKeys={selectedFile ? [`file-${selectedFile.id}`] : []}
        mode="inline"
        className={className}
        style={{
          backgroundColor: consoleTheme.consoleTheme.siderBg,
          color: consoleTheme.consoleTheme.siderMenuItemColor,
        }}
        aria-label={title ? `${title} file list` : 'Submission files'}
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
  const isDarkTheme = consoleThemes.dark === consoleTheme;

  const numUniqueFiles = CodeConsoleUtils.filterCurrentFileVersions(props.files)[0].size;
  const numOldVersions = props.files.length - numUniqueFiles;

  const badge = (
    <AntBadge
      style={{
        backgroundColor: isDarkTheme ? colors.neutralDarkBackground : colors.neutralBackground,
        color: isDarkTheme ? colors.neutralDarkMainText : colors.neutralMainText,
        boxShadow: `0 0 0 1px ${isDarkTheme ? colors.neutralDarkBorder : colors.neutralBorder} inset`,
      }}
      count={numUniqueFiles}
    />
  );

  const badgeWrapper = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '8px',
        verticalAlign: 'middle',
      }}
    >
      {numOldVersions > 0 ? (
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
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span>Files</span>
      {badgeWrapper}
    </div>
  );
};

const FileMenuWithWindowWatcher = withWindowWatcher(FileMenu);

export default FileMenuWithWindowWatcher;
