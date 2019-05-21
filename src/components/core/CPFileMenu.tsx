import * as React from 'react';

import { Badge, Menu } from 'antd';

import { FileType } from '../../infrastructure/file';

import { SelectParam } from 'antd/lib/menu';

interface ICPFileMenuProps {
  files: FileType[];
  getPointsInFile: (file: FileType) => number;
}

interface ICPFileMenuState {
  selectedKey: string;
}

class CPFileMenu extends React.Component<ICPFileMenuProps, ICPFileMenuState> {
  public state: Readonly<ICPFileMenuState> = {
    selectedKey: this.props.files.length > 0 ? `file-${this.props.files[0].id}` : '',
  };

  public onSelect = (param: SelectParam) => {
    this.setState({ selectedKey: param.key });
  };

  public buildFileMenu = (files: FileType[]) => {
    return files.map((file: FileType) => {
      const totalPointsInFile = this.props.getPointsInFile(file) * -1;

      let opacity = 0.7;
      if (this.state.selectedKey === `file-${file.id}`) {
        opacity = 1;
      }

      let commentCountBadge = null;
      if (file.comments.length > 0) {
        commentCountBadge = (
          <Badge
            count={file.comments.length}
            className="cp-badge"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', opacity }}
          />
        );
      }

      let pointsCountBadge = null;
      if (totalPointsInFile < 0) {
        pointsCountBadge = (
          <Badge count={totalPointsInFile} className="cp-badge" style={{ backgroundColor: '#f64852', opacity }} />
        );
      } else {
        pointsCountBadge = (
          <Badge count={`+${totalPointsInFile}`} className="cp-badge" style={{ backgroundColor: '#24be85', opacity }} />
        );
      }

      return (
        <Menu.Item key={`file-${file.id}`}>
          <span>{file.name}</span>
          <span style={{ position: 'absolute', right: '60px' }}>{commentCountBadge}</span>
          <span style={{ position: 'absolute', right: '20px' }}>{pointsCountBadge}</span>
        </Menu.Item>
      );
    });
  };

  public render() {
    const fileMenu = this.buildFileMenu(this.props.files);

    return (
      <div>
        <div style={{ padding: '13px 20px 0px 16px' }}>
          <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
            Files
          </div>
        </div>
        <Menu
          defaultSelectedKeys={[this.state.selectedKey]}
          mode="inline"
          className="cp-file-menu"
          id="cp-file-menu"
          onSelect={this.onSelect}
        >
          {fileMenu}
        </Menu>
      </div>
    );
  }
}

export default CPFileMenu;
