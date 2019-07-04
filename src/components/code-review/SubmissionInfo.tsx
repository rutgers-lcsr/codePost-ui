import * as React from 'react';

import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

interface IFileMenuProps {
  title?: string;
  assignment: string;
  students: string[];
}

class SubmissionInfo extends React.Component<IFileMenuProps, {}> {
  public render() {
    return (
      <div id="file-menu" style={{ overflowY: 'scroll' }}>
        {this.props.title ? (
          <div style={{ padding: '13px 20px 0px 16px' }}>
            <div className="cp-label cp-label--plus cp-label--bold" style={{ marginBottom: '14px' }}>
              {this.props.title}
            </div>
          </div>
        ) : null}
        <div style={{ overflowY: 'scroll', paddingLeft: 15, fontSize: 12 }}>
          Assignment: {this.props.assignment}
          <br />
          Students: {this.props.students.join(', ')}
        </div>
      </div>
    );
  }
}

SubmissionInfo.contextType = ConsoleThemeContext;

export default SubmissionInfo;
