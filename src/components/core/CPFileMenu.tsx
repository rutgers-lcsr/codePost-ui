import * as React from 'react';

import { Badge, Menu, Popconfirm } from 'antd';

import { FileType } from '../../infrastructure/file';

import themeVars from '../../styles/abstracts/_theme.js';

import { SelectParam } from 'antd/lib/menu';

interface ICPFileMenuProps {
  title?: string;
  files: FileType[];
  selectedFile?: FileType;
  changeSelectedFile: (fileID: number) => void;
  canChange: boolean;
  getPointsInFile: (file: FileType) => number[];
}

class CPFileMenu extends React.Component<ICPFileMenuProps, {}> {
  public onSelect = (selectedParam: SelectParam) => {
    const fileID = +selectedParam.key.split('-')[1];
    this.props.changeSelectedFile(fileID);
  };

  public buildFileMenu = (files: FileType[]) => {
    return files.map((file: FileType) => {
      // const totalPointsInFile = 10;
      const [deductions, bonuses] = this.props.getPointsInFile(file);

      let opacity = 0.7;
      if (this.props.selectedFile && this.props.selectedFile.id === file.id) {
        opacity = 1;
      }

      let commentCountBadge = null;
      if (file.comments.length > 0) {
        commentCountBadge = (
          <Badge
            count={file.comments.length}
            className="cp-badge"
            style={{ backgroundColor: themeVars.theme.neutralSecondaryText, opacity }}
          />
        );
      }

      let deductionBadge = null;
      let bonusBadge = null;

      if (deductions > 0) {
        deductionBadge = (
          <Badge
            count={deductions * -1}
            className="cp-badge"
            style={{ backgroundColor: themeVars.theme.actionRed, opacity }}
          />
        );
      }

      if (bonuses > 0) {
        bonusBadge = (
          <Badge
            count={`+${bonuses}`}
            className="cp-badge"
            style={{ backgroundColor: themeVars.theme.actionGreen, opacity }}
          />
        );
      }

      return (
        <Menu.Item key={`file-${file.id}`}>
          <span
            style={{
              display: 'inline-block',
              maxWidth: '148px',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: '12px',
              verticalAlign: 'middle',
            }}
          >
            {file.name}
          </span>
          <span style={{ position: 'absolute', right: '95px' }}>{bonusBadge}</span>
          <span style={{ position: 'absolute', right: '55px' }}>{deductionBadge}</span>
          <span style={{ position: 'absolute', right: '15px' }}>{commentCountBadge}</span>
        </Menu.Item>
      );
    });
  };

  public render() {
    const fileMenu = this.buildFileMenu(this.props.files);

    return (
      <div id="file-menu">
        {this.props.title ? (
          <div style={{ padding: '13px 20px 0px 16px' }}>
            <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
              {this.props.title}
            </div>
          </div>
        ) : null}
        <UnsavedCommentsPopconfirm changeSelectedFile={this.props.changeSelectedFile} canChange={this.props.canChange}>
          <Menu
            selectedKeys={this.props.selectedFile ? [`file-${this.props.selectedFile.id}`] : []}
            mode="inline"
            className="sider-menu"
            id="cp-file-menu"
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
  canChange: boolean;
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
    if (selectedParam && props.canChange) {
      confirm();
    } else if (selectedParam && !props.canChange) {
      setVisible(true);
    }
  });

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

export default CPFileMenu;
