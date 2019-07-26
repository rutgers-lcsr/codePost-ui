/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Badge as AntBadge, Menu, Popconfirm } from 'antd';

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

/**********************************************************************************************************************/

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

class FileMenu extends React.Component<IFileMenuProps, {}> {
  public componentWillMount() {
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
        this.props.changeSelectedFile(this.props.files[e.which - 49].id);
      }
    }
  };

  public onSelect = (selectedParam: SelectParam) => {
    const fileID = +selectedParam.key.split('-')[1];
    this.props.changeSelectedFile(fileID);
  };

  public buildFileMenu = (files: FileType[]) => {
    const shrunkSider = this.props.windowwidth < layoutVars.breakpoints.smallScreen.grade;

    return files.map((file: FileType, index: number) => {
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
        commentCountBadge = <Badge count={'-'} forcedStyle="neutral" placeholder={true} faded={faded} size="small" />;
      }

      let deductionBadge = null;
      let bonusBadge = null;

      if (deductions > 0) {
        deductionBadge = <Badge count={deductions * -1} faded={faded} size="small" />;
      } else {
        deductionBadge = <Badge count={'-1'} forcedStyle="negative" placeholder={true} faded={faded} size="small" />;
      }

      if (bonuses > 0) {
        bonusBadge = <Badge count={bonuses} faded={faded} size="small" />;
      } else {
        bonusBadge = <Badge count={'+1'} forcedStyle="positive" placeholder={true} faded={faded} size="small" />;
      }

      const badgesStyle: React.CSSProperties = !shrunkSider
        ? { position: 'absolute', right: '8px', top: '0px', width: '96px' }
        : { position: 'absolute', left: '24px', top: '16px', width: '96px' };

      return (
        <Menu.Item key={`file-${file.id}`} style={{ height: !shrunkSider ? undefined : '54px' }}>
          <div
            style={{
              display: 'inline-block',
              maxWidth: !shrunkSider ? '136px' : '124px',
              lineHeight: '12px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {file.name}
          </div>
          <span
            style={{
              fontSize: '10.5px',
              color: '#ccc',
              position: 'absolute',
              right: !shrunkSider ? '112px' : '15px',
              top: !shrunkSider ? '1px' : '0px',
            }}
          >
            [⌘{index + 1}]
          </span>

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
        </Menu.Item>
      );
    });
  };

  public render() {
    const fileMenu = this.buildFileMenu(this.props.files);
    const theme = consoleThemes.light === this.context.consoleTheme ? 'light' : 'dark';

    const className = theme === 'light' ? 'sider-menu sider-menu--light' : 'sider-menu sider-menu--dark';

    return (
      <div id="file-menu" style={{ overflowY: 'auto' }}>
        <UnsavedCommentsPopconfirm changeSelectedFile={this.props.changeSelectedFile} canChange={this.props.canChange}>
          <Menu
            selectedKeys={this.props.selectedFile ? [`file-${this.props.selectedFile.id}`] : []}
            mode="inline"
            className={className}
            style={{
              backgroundColor: this.context.consoleTheme.siderBg,
              color: this.context.consoleTheme.siderMenuItemColor,
            }}
          >
            {fileMenu}
          </Menu>
        </UnsavedCommentsPopconfirm>
      </div>
    );
  }
}

interface IUnsavedCommentsPopconfirmProps {
  changeSelectedFile: (fileID: number) => void;
  canChange: () => boolean;
  children: any;
}

export const UnsavedCommentsPopconfirm = (props: IUnsavedCommentsPopconfirmProps) => {
  const [selectedParam, setSelectedParam] = React.useState<SelectParam | null>(null);
  const [visible, setVisible] = React.useState<boolean>(false);

  const onSelect = (selectParam: SelectParam) => {
    setSelectedParam(selectParam);
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
