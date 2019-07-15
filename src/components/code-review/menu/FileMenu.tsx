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

import Badge from '../../core/Badge';

/**********************************************************************************************************************/

interface IFileMenuProps {
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
    // Keyboard shortcuts{
    if (e.which >= 49 && e.which <= 57 && e.metaKey) {
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
        commentCountBadge = (
          <CPTooltip title={tooltips.console.fileMenu.comments} hideThisOnHideTips={true}>
            <Badge count={commentCount} forcedStyle="neutral" faded={faded} />
          </CPTooltip>
        );
      }

      let deductionBadge = null;
      let bonusBadge = null;

      if (deductions > 0) {
        deductionBadge = (
          <CPTooltip title={tooltips.console.fileMenu.deductions} hideThisOnHideTips={true}>
            <Badge count={deductions * -1} faded={faded} />
          </CPTooltip>
        );
      }

      if (bonuses > 0) {
        bonusBadge = (
          <CPTooltip title={tooltips.console.fileMenu.bonuses} hideThisOnHideTips={true}>
            <Badge count={bonuses} faded={faded} />
          </CPTooltip>
        );
      }

      return (
        <Menu.Item key={`file-${file.id}`}>
          <div
            style={{
              display: 'inline-block',
              maxWidth: '148px',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: '12px',
              verticalAlign: 'middle',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                color: '#ccc',
                position: 'absolute',
                left: '3px',
              }}
            >
              ⌘{index + 1}
            </div>
            {file.name}
          </div>
          <span style={{ position: 'absolute', right: '95px' }}>{this.props.hidePoints ? '' : bonusBadge}</span>
          <span style={{ position: 'absolute', right: '55px' }}>{this.props.hidePoints ? '' : deductionBadge}</span>
          <span style={{ position: 'absolute', right: '15px' }}>
            {this.props.hidePoints && commentCount > 0 ? <div>Comments: {commentCountBadge}</div> : commentCountBadge}
          </span>
        </Menu.Item>
      );
    });
  };

  public render() {
    const fileMenu = this.buildFileMenu(this.props.files);
    const theme = consoleThemes.light === this.context.consoleTheme ? 'light' : 'dark';

    const className = theme === 'light' ? 'sider-menu sider-menu--light' : 'sider-menu sider-menu--dark';

    return (
      <div id="file-menu" style={{ overflowY: 'scroll' }}>
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

export default FileMenu;
