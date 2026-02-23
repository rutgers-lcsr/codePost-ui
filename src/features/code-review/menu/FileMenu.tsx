// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
import { Badge as AntBadge, Dropdown, Menu, Tag, Typography } from 'antd';
import {
  FileImageOutlined,
  FilePdfOutlined,
  CodeOutlined,
  FileOutlined,
  FileZipOutlined,
  FileMarkdownOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  BookOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

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
import type { CommentType } from '../../../types/models';
import { File as CodePostFile } from '../../../utils/file';
import { Submission } from '../../../services/submission';

import { IFileToCommentsMap } from '../../../types/common';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import * as CodeConsoleUtils from '../codeConsoleUtils';

import Badge from '../../../components/core/Badge';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../../components/core/withWindowWatcher';

import { osControlKey, getOsTriggerKeyFromEvent } from '../../../components/core/operatingSystem';

import { sendSlack } from '../../../components/core/slack';

import { LOCAL_SETTINGS } from '../../../components/utils/LocalSettings';

import { IDirectoryStructure, IFolder, buildFolderMenu, createDirectoryStructure, sortFiles } from './fileMenuUtils';
import { FileWithId } from '../../../utils/file';

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
  files: FileWithId[];
  comments?: IFileToCommentsMap;
  selectedFile?: FileWithId;
  changeSelectedFile: (fileID: number) => void;
  getPointsInFile: (file: FileWithId) => number[];
  hidePoints?: boolean;
}

const FileMenu: React.FC<IFileMenuProps> = (props) => {
  const { title, files, comments, selectedFile, changeSelectedFile, getPointsInFile, hidePoints } = props;
  const filesWithId = files;
  const consoleTheme = useContext(ConsoleThemeContext);
  const isDarkTheme = consoleThemes.dark === consoleTheme.consoleTheme;

  const rootStyle = React.useMemo<FileMenuRootStyle>(() => {
    const highlightColor = consoleTheme.consoleTheme.highlight ?? '#1677ff';
    const historyBorder = consoleTheme.consoleTheme.codeBorder ?? '#d9d9d9';
    return {
      overflowY: 'auto',
      '--file-menu-selected-bg': isDarkTheme ? 'rgba(36, 190, 133, 0.28)' : '#f0fff7',
      '--file-menu-selected-color': highlightColor,
      '--file-menu-submenu-bg': 'transparent',
      '--file-menu-submenu-color': consoleTheme.consoleTheme.siderMenuItemColor ?? highlightColor,
      '--file-menu-submenu-border': 'none',
      '--file-menu-history-badge-bg': consoleTheme.consoleTheme.commentBody ?? '#ffffff',
      '--file-menu-history-badge-color': consoleTheme.consoleTheme.commentRubricCommentNeutral ?? 'rgba(0, 0, 0, 0.45)',
      '--file-menu-history-badge-shadow': `0 0 0 1px ${historyBorder} inset`,
      '--file-menu-bonus-badge-bg': colors.brandPrimary,
      '--file-menu-deduction-badge-bg': isDarkTheme ? '#ff7875' : '#ff4d4f',
      '--file-menu-comment-badge-bg': consoleTheme.consoleTheme.commentRubricCommentNeutral ?? 'rgba(0, 0, 0, 0.45)',
    };
  }, [consoleTheme, isDarkTheme]);

  const getFileIcon = useCallback(
    (fileName: string) => {
      const ext = CodePostFile.extension(fileName);
      const style = { marginRight: 8, fontSize: 16, color: consoleTheme.consoleTheme.siderMenuItemColor };

      switch (ext) {
        case 'ipynb':
          return <BookOutlined style={style} />;
        case 'py':
        case 'js':
        case 'ts':
        case 'tsx':
        case 'jsx':
        case 'java':
        case 'cpp':
        case 'c':
        case 'h':
        case 'rb':
        case 'go':
        case 'rs':
        case 'php':
        case 'html':
        case 'css':
        case 'scss':
        case 'json':
        case 'xml':
        case 'sql':
        case 'sh':
          return <CodeOutlined style={style} />;
        case 'md':
        case 'txt':
          return <FileMarkdownOutlined style={style} />;
        case 'pdf':
          return <FilePdfOutlined style={style} />;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'bmp':
          return <FileImageOutlined style={style} />;
        case 'zip':
        case 'tar':
        case 'gz':
          return <FileZipOutlined style={style} />;
        case 'doc':
        case 'docx':
          return <FileWordOutlined style={style} />;
        case 'xls':
        case 'xlsx':
        case 'csv':
          return <FileExcelOutlined style={style} />;
        default:
          return <FileOutlined style={style} />;
      }
    },
    [consoleTheme.consoleTheme.siderMenuItemColor],
  );

  const { directoryStructure, sortedFiles, oldVersionsMap } = React.useMemo(() => {
    const separatedFiles = Submission.filesByVersion(filesWithId);
    const directoryStructure = createDirectoryStructure(separatedFiles.new as FileWithId[]);
    const sortedFiles = sortFiles(directoryStructure) as FileWithId[];
    const oldVersionsMap = separatedFiles.old as { [path: string]: FileWithId[] };
    return {
      directoryStructure: directoryStructure as IDirectoryStructure<FileWithId>,
      sortedFiles,
      oldVersionsMap,
    };
  }, [filesWithId]);

  React.useEffect(() => {
    if (oldVersionsMap && Object.keys(oldVersionsMap).length > 0) {
      sendSlack('File Versioning', window.location.href, '#f9f9f9', '#user_notifications_beta_use');
    }
  }, [oldVersionsMap]);
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

      const triggerKey = getOsTriggerKeyFromEvent(event);
      if (!triggerKey) {
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
    const autosettedFile = sortedFiles.find((f) => {
      return f.id === LOCAL_SETTINGS.mostRecentFile.getter();
    });
    if (autosettedFile === undefined && sortedFiles.length > 0) {
      // If the file has a directory, then the order of the files in the UI might be different than the order passed in
      // After getting the order, we want to change the selected file to be the first in the list
      changeSelectedFile(sortedFiles[0].id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * directoryStructure/sortedFiles/oldVersionsMap are derived via useMemo above
   */

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
    (file: FileWithId) => {
      let commentCount;
      if (comments === undefined || !Object.prototype.hasOwnProperty.call(comments, file.id)) {
        commentCount = (file.comments ?? []).length;
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
    (currentFile: FileWithId, oldVersions: FileWithId[], path: string) => {
      const sortedOldVersions = oldVersions.sort((f1: FileWithId, f2: FileWithId) => {
        return f2.id - f1.id;
      });

      const oldVersionItems = sortedOldVersions.map((f2: FileWithId) => {
        const numComments = getNumCommentsInFile(f2);
        return {
          key: `file-${f2.id}`,
          label: (
            <div className="display-flex align-items-center justify-content-space-between">
              {dayjs(f2.created).format('lll')}
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
                    <div>{dayjs(currentFile.created).format('lll')}</div>
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
    (file: FileWithId, commentCount: number, deductions: number, bonuses: number) => {
      let faded = true;
      if (selectedFile && selectedFile.id === file.id) {
        faded = false;
      }

      const tags = [];

      if (!hidePoints && bonuses > 0) {
        tags.push(
          <CPTooltip key="bonus" title={tooltips.console.fileMenu.bonuses} hideThisOnHideTips={true}>
            <Tag color="success" style={{ margin: 0, opacity: faded ? 0.7 : 1 }}>
              +{parseFloat(bonuses.toFixed(2))}
            </Tag>
          </CPTooltip>,
        );
      }

      if (!hidePoints && deductions > 0) {
        tags.push(
          <CPTooltip key="deduction" title={tooltips.console.fileMenu.deductions} hideThisOnHideTips={true}>
            <Tag color="error" style={{ margin: 0, opacity: faded ? 0.7 : 1 }}>
              {parseFloat((deductions * -1).toFixed(2))}
            </Tag>
          </CPTooltip>,
        );
      }

      if (commentCount > 0) {
        tags.push(
          <CPTooltip key="comments" title={tooltips.console.fileMenu.comments} hideThisOnHideTips={true}>
            <Tag
              style={{
                margin: 0,
                borderColor: 'transparent',
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: consoleTheme.consoleTheme.text,
                opacity: faded ? 0.7 : 1,
              }}
            >
              {commentCount}
            </Tag>
          </CPTooltip>,
        );
      }

      return (
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: 4,
          }}
        >
          {tags}
        </div>
      );
    },
    [selectedFile, hidePoints, consoleTheme],
  );

  // FILE MENU BUILD
  const buildFileMenu = useCallback(
    (sortedFilesParam: FileWithId[], files: FileWithId[]): MenuProps['items'] => {
      const shrunkSider = LOCAL_SETTINGS.siderWidth.getter() < 202;

      const codeFiles = files.map((file: FileWithId) => {
        let oldVersionsMenu: React.ReactNode = null;
        const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;

        if (oldVersionsMap[path]) {
          oldVersionsMenu = buildOldVersionsMenu(file, oldVersionsMap[path], path);
        }

        // Find the file order in the list to sync the keyboard shortcuts with the UI order
        const sortedIndex = sortedFilesParam.findIndex((f) => {
          return f.id === file.id;
        });

        const [deductions, bonuses] = getPointsInFile(file);
        const commentCount = getNumCommentsInFile(file);
        const normalizedDeductions = deductions < 0 ? deductions * -1 : deductions;
        const fileSummaryLabel = getFileSummaryLabel(file.name, commentCount, normalizedDeductions, bonuses);

        const menuItem = (
          <div
            aria-current={selectedFile && selectedFile.id === file.id ? 'true' : undefined}
            style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
          >
            <span style={visuallyHiddenStyle}>{fileSummaryLabel}</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                paddingRight: !shrunkSider ? '100px' : 0,
                lineHeight: '12px',
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {getFileIcon(file.name)}
                <CPTooltip
                  title={sortedIndex < 9 ? `${file.name} (${osControlKey()}+${sortedIndex + 1})` : file.name}
                  placement="right"
                >
                  <Typography.Text
                    ellipsis
                    style={{
                      color: consoleTheme.consoleTheme.siderMenuItemColor,
                    }}
                  >
                    {file.name}
                  </Typography.Text>
                </CPTooltip>
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
      consoleTheme.consoleTheme.siderMenuItemColor,
      getFileIcon,
    ],
  );

  /**************************** RENDER *************************************/
  const rootFiles = buildFileMenu(sortedFiles, directoryStructure.files) || [];

  const theme = consoleThemes.light === consoleTheme.consoleTheme ? 'light' : 'dark';

  const className = theme === 'light' ? 'sider-menu sider-menu--light' : 'sider-menu sider-menu--dark';
  const subMenuClassName =
    theme === 'light' ? 'sider-submenu sider-submenu--light' : 'sider-submenu sider-submenu--dark';

  const folders = directoryStructure.folders.map((f: IFolder<FileWithId>) => {
    return buildFolderMenu(
      '',
      f,
      (filesParam: FileWithId[]) => buildFileMenu(sortedFiles, filesParam),
      subMenuClassName,
    );
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
  files: FileWithId[];
  forceDarkTheme?: boolean;
}
export const FileMenuTitle = (props: IFileMenuTitleProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isDarkTheme = props.forceDarkTheme || consoleThemes.dark === consoleTheme;

  const numUniqueFiles = CodeConsoleUtils.filterCurrentFileVersions(props.files)[0].size;

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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span>Files</span>
      {badge}
    </div>
  );
};

export const FileMenuTooltip: React.FC<{ files: FileWithId[] }> = ({ files }) => {
  const numUniqueFiles = CodeConsoleUtils.filterCurrentFileVersions(files)[0].size;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>Files</span>
      <AntBadge
        count={numUniqueFiles}
        style={{
          backgroundColor: '#fff',
          color: 'rgba(0,0,0,0.85)',
          boxShadow: '0 0 0 1px #d9d9d9 inset',
        }}
      />
      <span style={{ opacity: 0.7 }}>({osControlKey()} + Shift + F)</span>
    </div>
  );
};

const FileMenuWithWindowWatcher = withWindowWatcher(FileMenu);

export default FileMenuWithWindowWatcher;
