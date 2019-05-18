import * as React from 'react';

// @ts-ignore
import { Popover } from 'antd';

class CPComment extends React.Component<any, {}> {
  public render() {
    return (
      <div className="cp-comment ant-popover ant-popover-placement-rightTop" style={{ transformOrigin: '-4px 0px' }}>
        <div className="ant-popover-content">
          <div className="ant-popover-arrow" />
          <div className="ant-popover-inner" role="tooltip">
            <div>
              <div className="ant-popover-title">
                <span>Line 2</span>
              </div>
              <div className="ant-popover-inner-content">
                <div>
                  <p>Content</p>
                  <p>Content</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CPComment;
