/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Badge as AntBadge, Dropdown, Icon, Menu, Popconfirm, Tag } from 'antd';

import moment from 'moment';

/* codePost imports */
import { CommentType } from '../../../infrastructure/comment';
import { FileType } from '../../../infrastructure/file';

import { SelectParam } from 'antd/lib/menu';

import { IFileToCommentsMap } from '../../../types/common';

import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import layoutVars from '../../../styles/layout/_layoutVars';

import Badge from '../../core/Badge';

import withWindowWatcher, { IWithWindowWatcherProps } from '../../core/withWindowWatcher';

import { getOperatingSystem, OS } from '../useHotkeys';

import { slack } from '../../core/slack';

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
  canChange: () => boolean;
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
    if (oldVersionsMap) {
      const payload = {
        message: `File versioning:`,
        url: window.location.href,
      };
      slack(`${process.env.REACT_APP_API_URL}/logs/logFeature/`, payload);
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

  // Go through the list of files and separate the latest files from the old files
  public separateFilesByVersion = (files: FileType[]) => {
    const olderFiles: { [pathName: string]: FileType[] } = {};
    const latestFiles: { [pathName: string]: FileType } = {};
    files.forEach((file) => {
      const path = `${file.path ? file.path : ''}/${file.name}`;
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

  /**************************** File Menu Functions *************************************/
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

  // Recursive function to build a Sub Menu for a folder
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

  public buildFileBadges = (file: FileType, shrunkSider: boolean) => {
    const [deductions, bonuses] = this.props.getPointsInFile(file);
    let commentCount = 0;
    if (this.props.comments === undefined) {
      commentCount = file.comments.length;
    } else {
      commentCount = this.props.comments[file.id].filter((comment: CommentType) => {
        return comment.id > 0;
      }).length;
    }

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

    const badgesStyle: React.CSSProperties = !shrunkSider
      ? { position: 'absolute', right: '12px', top: '0px', width: '96px' }
      : { position: 'absolute', left: '24px', top: '16px', width: '96px' };

    return (
      <div style={badgesStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {!this.props.hidePoints ? (
            <CPTooltip title={tooltips.console.fileMenu.bonuses} hideThisOnHideTips={true}>
              <div>{bonusBadge}</div>
            </CPTooltip>
          ) : null}
          {!this.props.hidePoints ? (
            <CPTooltip title={tooltips.console.fileMenu.deductions} hideThisOnHideTips={true}>
              <div>{deductionBadge}</div>
            </CPTooltip>
          ) : null}
          <CPTooltip title={tooltips.console.fileMenu.comments} hideThisOnHideTips={true}>
            <div>{commentCountBadge}</div>
          </CPTooltip>
        </div>
      </div>
    );
  };

  // Build a list of Menu.Items from a set of files
  public buildFileMenu = (files: FileType[], sortedFiles: FileType[]) => {
    const shrunkSider = this.props.windowwidth < layoutVars.breakpoints.smallScreen.grade;
    const { oldVersionsMap } = this.state;

    return files.map((file: FileType) => {
      let oldVersionsMenu: any = null;
      const path = `${file.path ? file.path : ''}/${file.name}`;
      if (oldVersionsMap[path]) {
        const items = oldVersionsMap[path].map((f2: FileType) => {
          return (
            <Menu.Item key={`file-${f2.id}`} style={{ minWidth: 200 }}>
              {
                <div className="display-flex align-items-center justify-content-space-between">
                  {moment(f2.created).format('llll')}
                  <Badge count={f2.comments.length} forcedStyle="neutral" size="small" />
                </div>
              }
            </Menu.Item>
          );
        });
        const menu = (
          <UnsavedCommentsPopconfirm
            changeSelectedFile={this.props.changeSelectedFile}
            canChange={this.props.canChange}
            oldVersions={true}
          >
            <Menu
              mode="inline"
              inlineCollapsed={false}
              selectedKeys={this.props.selectedFile ? [`file-${this.props.selectedFile.id}`] : []}
              defaultOpenKeys={[`${path}-old-versions`]}
              style={{ minWidth: 280 }}
            >
              <Menu.SubMenu key={`${path}-old-versions`} title="Older Versions">
                {items}
              </Menu.SubMenu>
            </Menu>
          </UnsavedCommentsPopconfirm>
        );

        oldVersionsMenu = (
          <Dropdown overlay={menu} trigger={['hover']}>
            <AntBadge
              count={oldVersionsMap[path].length + 1}
              style={{ backgroundColor: '#fff', color: '#999', boxShadow: '0 0 0 1px #d9d9d9 inset', marginRight: 4 }}
            />
          </Dropdown>
        );
      }

      /* tslint:disable */
      const shortcutStyle: React.CSSProperties = !shrunkSider
        ? { fontSize: '9px', color: '#ccc', verticalAlign: 'middle' }
        : {
            fontSize: '9px',
            color: '#ccc',
            position: 'absolute',
            right: '15px',
            top: '17px',
          };
      /* tslint:enable */

      // Find the file order in the list to sync the keyboard shortcuts with the UI order
      const sortedIndex = sortedFiles.findIndex((f) => {
        return f.id === file.id;
      });

      return (
        <Menu.Item key={`file-${file.id}`} style={{ height: !shrunkSider ? undefined : '54px', paddingLeft: '10px' }}>
          <div
            style={{
              display: 'inline-block',
              lineHeight: '12px',
            }}
          >
            {oldVersionsMenu}
            <span style={shortcutStyle}>[⌘{sortedIndex + 1}]</span>
            <div style={{ display: 'inline-block', width: '8px' }} />
            <div
              style={{
                display: 'inline-block',
                maxWidth: !shrunkSider ? '134px' : '124px',
                verticalAlign: 'middle',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {file.name}
            </div>
          </div>
          {this.buildFileBadges(file, shrunkSider)}
        </Menu.Item>
      );
    });
  };

  /**************************** Render *************************************/
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
        <UnsavedCommentsPopconfirm
          changeSelectedFile={this.props.changeSelectedFile}
          canChange={this.props.canChange}
          oldVersions={false}
        >
          <Menu
            selectedKeys={this.props.selectedFile ? [`file-${this.props.selectedFile.id}`] : []}
            mode="inline"
            className={className}
            style={{
              backgroundColor: this.context.consoleTheme.siderBg,
              color: this.context.consoleTheme.siderMenuItemColor,
            }}
          >
            {rootFiles}
            {folders}
          </Menu>
        </UnsavedCommentsPopconfirm>
      </div>
    );
  }
}

interface IUnsavedCommentsPopconfirmProps {
  changeSelectedFile: (fileID: number) => void;
  canChange: () => boolean;
  oldVersions: boolean;
  children: any;
}

export const UnsavedCommentsPopconfirm = (props: IUnsavedCommentsPopconfirmProps) => {
  const [selectedParam, setSelectedParam] = React.useState<SelectParam | null>(null);
  const [visible, setVisible] = React.useState<boolean>(false);

  const onSelect = (selectParam: SelectParam) => {
    setSelectedParam(selectParam);
    if (selectParam && props.oldVersions) {
      // IF this is a child menu, we want to avoid the parent onSelect method from being triggered
      selectParam.domEvent.preventDefault();
      selectParam.domEvent.stopPropagation();
    }
  };

  const confirm = () => {
    if (selectedParam) {
      const fileID = +selectedParam.key.split('-')[1];
      props.changeSelectedFile(fileID);
    }
    setSelectedParam(null);
    setVisible(false);
  };

  const cancel = () => {
    setSelectedParam(null);
    setVisible(false);
  };

  React.useEffect(() => {
    if (selectedParam && props.canChange()) {
      confirm();
    } else if (selectedParam && !props.canChange()) {
      setVisible(true);
    }
  });

  // FIXME: React.cloneElement possibly very slow
  return (
    <Popconfirm
      title={
        <div>
          <p>You have draft comments that will not be saved.</p>{' '}
          <p>
            <b>Are you sure you want to continue?</b>
          </p>
        </div>
      }
      visible={visible}
      onConfirm={confirm}
      onCancel={cancel}
      okText="Yes"
      cancelText="No"
      placement="rightTop"
    >
      {React.cloneElement(props.children, { onSelect })}
    </Popconfirm>
  );
};
FileMenu.contextType = ConsoleThemeContext;

interface IFileMenuTitleProps {
  files: FileType[];
}

export const FileMenuTitle = (props: IFileMenuTitleProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  return (
    <span>
      Files
      <div style={{ display: 'inline-block', marginLeft: '8px', position: 'absolute', transform: 'translateY(-6%)' }}>
        <AntBadge
          style={{
            backgroundColor: consoleTheme.siderBg,
            color: consoleTheme.commentRubricCommentNeutral,
            boxShadow: `0 0 0 1px ${consoleTheme.buttonDisabledColor} inset`,
          }}
          count={props.files.length}
        />
      </div>
    </span>
  );
};

export default withWindowWatcher(FileMenu);
