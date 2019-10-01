/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Badge as AntBadge, Dropdown, Icon, Menu, Tag } from 'antd';

import moment from 'moment';

/* codePost imports */
import { CommentType } from '../../../infrastructure/comment';
import { FileType } from '../../../infrastructure/file';

import { SelectParam } from 'antd/lib/menu';

import { IFileToCommentsMap } from '../../../types/common';

import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import CodeConsole from '../CodeConsole';

import layoutVars from '../../../styles/layout/_layoutVars';

import Badge from '../../core/Badge';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import { getOperatingSystem, osControlKey, OS } from '../../core/operatingSystem';

import { sendSlack } from '../../core/slack';

const { SubMenu } = Menu;

/*************************************** Helper Interfaces for Directory rendering ******************************/

interface IFolder {
  files: FileType[];
  folders: IFolder[];
  name: string;
}
interface IDirectoryStructure {
  files: FileType[]; // Files without a path specified
  folders: IFolder[];
}

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

interface IFileMenuState {
  // Storing both of these in state for speed (avoid recreating directory on each render)
  directoryStructure: IDirectoryStructure; // The nested directory of the files, after path is parsed
  sortedFiles: FileType[]; // The ordered array of files that will be visually rendered (for shortcut mapping)
  oldVersionsMap: { [path: string]: FileType[] };
}

class FileMenu extends React.Component<IFileMenuProps, IFileMenuState> {
  public constructor(props: IFileMenuProps) {
    super(props);
    const separatedFiles = this.separateFilesByVersion(props.files);
    const directoryStructure = this.createDirectoryStructure(separatedFiles.new);
    const sortedFiles = this.sortFiles(directoryStructure);
    const oldVersionsMap = separatedFiles.old;
    if (oldVersionsMap && Object.keys(oldVersionsMap).length > 0) {
      sendSlack('File Versioning', window.location.href, '#f9f9f9', '#user_notifications_beta_use');
    }
    this.state = {
      directoryStructure,
      sortedFiles,
      oldVersionsMap,
    };
    if (sortedFiles.length > 0) {
      // If the file has a directory, then the order of the files in the UI might be different than the order passed in
      // After getting the order, we want to change the selected file to be the first in the list
      this.props.changeSelectedFile(sortedFiles[0].id);
    }
  }

  public componentDidUpdate(prevProps: IFileMenuProps) {
    if (prevProps.files !== this.props.files) {
      const separatedFiles = this.separateFilesByVersion(this.props.files);
      const directoryStructure = this.createDirectoryStructure(separatedFiles.new);
      const sortedFiles = this.sortFiles(directoryStructure);
      this.setState({ directoryStructure, sortedFiles, oldVersionsMap: separatedFiles.old });
    }
  }

  public componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  public componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  public handleKeyDown = (e: any) => {
    const os = getOperatingSystem();
    const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

    if (e.which >= 49 && e.which <= 57 && triggerKey) {
      e.preventDefault();
      if (e.which - 49 < this.props.files.length) {
        this.props.changeSelectedFile(this.state.sortedFiles[e.which - 49].id);
      }
    }
  };

  public onSelect = (selectedParam: SelectParam) => {
    const fileID = +selectedParam.key.split('-')[1];
    this.props.changeSelectedFile(fileID);
  };

  /**************************** FILE VERSIONING AND DIRECTORY HELPERS*************************************/
  // Go through the list of files and separate the latest files from the old files
  public separateFilesByVersion = (files: FileType[]) => {
    const olderFiles: { [pathName: string]: FileType[] } = {};
    const latestFiles: { [pathName: string]: FileType } = {};
    files.forEach((file) => {
      const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;
      if (!latestFiles[path]) latestFiles[path] = file;
      else {
        if (Date.parse(latestFiles[path].created) <= Date.parse(file.created)) {
          const oldLatest = latestFiles[path];
          olderFiles[path] ? olderFiles[path].push(oldLatest) : (olderFiles[path] = [oldLatest]);
          latestFiles[path] = file;
        } else olderFiles[path] ? olderFiles[path].push(file) : (olderFiles[path] = [file]);
      }
    });

    const latestFilesArr: FileType[] = [];
    Object.keys(latestFiles).forEach((path) => {
      const file = latestFiles[path];
      latestFilesArr.push(file);
    });

    return { new: latestFilesArr, old: olderFiles };
  };

  // Create a nested directory corresponding to the folder and file structure
  public createDirectoryStructure = (files: FileType[]) => {
    const root: IDirectoryStructure = { folders: [], files: [] };

    // Search through a list of folders match with same name
    const search = (nameKey: string, folderList: IFolder[]) => {
      for (const i of folderList) {
        if (i['name'] === nameKey) {
          return i;
        }
      }
      return false;
    };
    // Loop through files and process them
    files.forEach((f) => {
      if (!f.path) {
        // If no path specified, add them to root.files
        root.files.push(f);
      } else {
        // remove starting and trailing slashes
        const cleanedPath = f.path.replace(/^\/+|\/+$/g, '');
        const dirs = cleanedPath.split('/');
        dirs.reduce((acc, dirName, index) => {
          const el = search(dirName, acc['folders']);
          if (el) {
            if (index === dirs.length - 1) {
              // Reached the last directory in the path, so push the file
              el['files'].push(f);
            }
            return el;
          } else {
            acc['folders'].push({
              name: dirName,
              folders: [],
              files: index === dirs.length - 1 ? [f] : [],
            });
            return acc['folders'][acc['folders'].length - 1];
          }
        }, root);
      }
    });
    return root;
  };

  // Figure out the file order to be shown in the UI based on the nested file directory
  public sortFiles = (directoryStructure: IDirectoryStructure) => {
    const sortedFiles: FileType[] = [];

    // Put the files in the root directory last
    const sortedDirectFiles = directoryStructure.files.sort((f1: FileType, f2: FileType) => {
      return f1.id - f2.id;
    });

    sortedDirectFiles.forEach((f) => {
      sortedFiles.push(f);
    });

    // Put the files in the root directory first
    const addFilesOfFolder = (folder: IFolder, currentList: FileType[]) => {
      folder.files.forEach((f: FileType) => {
        currentList.push(f);
      });
      folder.folders.forEach((f: IFolder) => {
        addFilesOfFolder(f, currentList);
      });
    };
    directoryStructure.folders.forEach((f: IFolder) => {
      addFilesOfFolder(f, sortedFiles);
    });

    return sortedFiles;
  };

  /**************************** MENU BUILD HELPER FUNCTIONS *************************************/
  // Get the latest number of comments in a file (file.comments might be out of date because
  //   we re-calculate sort on change of props.file, which doesn't update when comments change
  public getNumCommentsInFile = (file: FileType) => {
    let commentCount;
    if (this.props.comments === undefined) {
      commentCount = file.comments.length;
    } else {
      commentCount = this.props.comments[file.id].filter((comment: CommentType) => {
        return comment.id > 0;
      }).length;
    }
    return commentCount;
  };

  // OLD VERSIONS MENU BUILD
  public buildOldVersionsMenu = (currentFile: FileType, oldVersions: FileType[], path: string) => {
    const { oldVersionsMap } = this.state;

    const sortedOldVersions = oldVersions.sort((f1: FileType, f2: FileType) => {
      return f2.id - f1.id;
    });

    const items = sortedOldVersions.map((f2: FileType) => {
      const numComments = this.getNumCommentsInFile(f2);
      return (
        <Menu.Item key={`file-${f2.id}`} style={{ minWidth: 200 }}>
          {
            <div className="display-flex align-items-center justify-content-space-between">
              {moment(f2.created).format('lll')}
              {numComments > 0 ? <Badge count={numComments} forcedStyle="neutral" size="small" /> : <div />}
            </div>
          }
        </Menu.Item>
      );
    });
    const currentFileNumComments = this.getNumCommentsInFile(currentFile);
    const menu = (
      <div>
        <Menu
          mode="inline"
          inlineCollapsed={false}
          selectedKeys={this.props.selectedFile ? [`file-${this.props.selectedFile.id}`] : []}
          defaultOpenKeys={[`${path}-old-versions`]}
          style={{ minWidth: 280 }}
          onSelect={this.onFileSelect.bind(this, true)}
        >
          <Menu.SubMenu key={`${path}-old-versions`} title="File History">
            <Menu.Item key={`file-${currentFile.id}`} style={{ minWidth: 200 }}>
              {
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
              }
            </Menu.Item>
            {items}
          </Menu.SubMenu>
        </Menu>
      </div>
    );

    return (
      <Dropdown overlay={menu} placement="bottomCenter" trigger={['hover']}>
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
  };

  // FILE MENU HELPER - BADGE STYLING
  public buildFileBadges = (file: FileType, commentCount: number, deductions: number, bonuses: number) => {
    let faded = true;
    if (this.props.selectedFile && this.props.selectedFile.id === file.id) {
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
      deductionBadge = <Badge count={deductions * -1} faded={faded} size="small" />;
    } else {
      deductionBadge = null;
    }

    if (bonuses > 0) {
      bonusBadge = <Badge count={bonuses} faded={faded} size="small" />;
    } else {
      bonusBadge = null;
    }

    const badgesStyle: React.CSSProperties = { position: 'absolute', right: '12px', top: '0px', width: '96px' };

    return (
      <div style={badgesStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {!this.props.hidePoints ? (
            <CPTooltip title={tooltips.console.fileMenu.bonuses} hideThisOnHideTips={true}>
              <div style={{ minWidth: 25 }}>{bonusBadge}</div>
            </CPTooltip>
          ) : null}
          {!this.props.hidePoints ? (
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
  };

  // FILE MEN BUILD
  public buildFileMenu = (files: FileType[], sortedFiles: FileType[]) => {
    const shrunkSider = this.props.windowwidth < layoutVars.breakpoints.smallScreen.grade;
    const { oldVersionsMap } = this.state;

    return files.map((file: FileType) => {
      let oldVersionsMenu: any = null;
      const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;

      if (oldVersionsMap[path]) {
        oldVersionsMenu = this.buildOldVersionsMenu(file, oldVersionsMap[path], path);
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
      const sortedIndex = sortedFiles.findIndex((f) => {
        return f.id === file.id;
      });

      const [deductions, bonuses] = this.props.getPointsInFile(file);
      const commentCount = this.getNumCommentsInFile(file);

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
                display: 'inline-block',
                maxWidth: !shrunkSider ? '134px' : '124px',
                minWidth: !shrunkSider ? 0 : '124px',
                verticalAlign: 'middle',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                fontSize: 12,
              }}
              title={file.name}
            >
              {file.name}
              {oldVersionsMenu}
            </div>
          </div>
          {!shrunkSider ? this.buildFileBadges(file, commentCount, deductions, bonuses) : <div />}
        </div>
      );

      const badgeStyle = {
        fontSize: 10,
        padding: '0 2px',
        opacity: this.props.selectedFile && this.props.selectedFile.id === file.id ? 1 : 0.7,
      };

      const menuItemShrunkSider = (
        <AntBadge count={bonuses} dot={false} offset={[-6, -5]} style={{ backgroundColor: '#24be85', ...badgeStyle }}>
          <AntBadge count={deductions} dot={false} offset={[12, -5]} style={{ backgroundColor: 'red', ...badgeStyle }}>
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

      return (
        <Menu.Item key={`file-${file.id}`} style={{ height: !shrunkSider ? undefined : '54px', paddingLeft: '10px' }}>
          {shrunkSider ? menuItemShrunkSider : menuItem}
        </Menu.Item>
      );
    });
  };

  // FOLDER MENU BUILD
  public onFileSelect = (isOldFile: boolean, e: SelectParam) => {
    if (e) {
      const fileID = +e.key.split('-')[1];
      this.props.changeSelectedFile(fileID);
      if (isOldFile) {
        e.domEvent.preventDefault();
        e.domEvent.stopPropagation();
      }
    }
  };

  public buildFolderMenu = (parentPath: string, folder: { name: string; files: FileType[]; folders: IFolder[] }) => {
    const theme = consoleThemes.light === this.context.consoleTheme ? 'light' : 'dark';
    const className = theme === 'light' ? 'sider-submenu sider-submenu--light' : 'sider-submenu sider-submenu--dark';
    const fileItems = this.buildFileMenu(folder.files, this.state.sortedFiles);
    return (
      <SubMenu
        key={`${parentPath}'/'${folder.name}`}
        title={
          <div>
            <Icon type="folder" />
            {folder.name}
          </div>
        }
        className={className}
      >
        {fileItems}
        {folder.folders.map((f: IFolder) => {
          return this.buildFolderMenu(`${parentPath}'/'${folder.name}`, f);
        })}
      </SubMenu>
    );
  };

  /**************************** RENDER *************************************/
  public render() {
    const { directoryStructure } = this.state;
    const rootFiles = this.buildFileMenu(directoryStructure.files, this.state.sortedFiles);
    const folders = directoryStructure.folders.map((f: IFolder) => {
      return this.buildFolderMenu('', f);
    });

    const theme = consoleThemes.light === this.context.consoleTheme ? 'light' : 'dark';

    const className = theme === 'light' ? 'sider-menu sider-menu--light' : 'sider-menu sider-menu--dark';

    return (
      <div id="file-menu" style={{ overflowY: 'auto' }}>
        <Menu
          selectedKeys={this.props.selectedFile ? [`file-${this.props.selectedFile.id}`] : []}
          mode="inline"
          className={className}
          style={{
            backgroundColor: this.context.consoleTheme.siderBg,
            color: this.context.consoleTheme.siderMenuItemColor,
          }}
          onSelect={this.onFileSelect.bind(this, false)}
        >
          {rootFiles}
          {folders}
        </Menu>
      </div>
    );
  }
}

FileMenu.contextType = ConsoleThemeContext;

interface IFileMenuTitleProps {
  files: FileType[];
}

export const FileMenuTitle = (props: IFileMenuTitleProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const numUniqueFiles = CodeConsole.filterCurrentFileVersions(props.files)[0].size;
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

export default withWindowWatcher(FileMenu);
