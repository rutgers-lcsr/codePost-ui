import * as React from 'react';

import { Input } from 'antd';

import CPButton from './CPButton';
import CPPointInput from './CPPointInput';

const { TextArea } = Input;

// We use ts-ignore since Popover never explicitly used. We just use the classNames
// @ts-ignore
import { Popover } from 'antd';

class CPComment extends React.Component<any, {}> {
  public render() {
    return (
      <div
        className="cp-comment ant-popover ant-popover-placement-rightTop"
        style={{ transformOrigin: '-4px 0px', top: '100px' }} // placeholders for storybook
      >
        <div className="ant-popover-content">
          <div className="ant-popover-arrow" />
          <div className="ant-popover-inner">
            <div>
              <div className="ant-popover-title">
                <div className="cp-flex--wider">
                  <div className="left">
                    <span className="cp-label--mid-bold">Line 2</span>
                  </div>
                  <div className="left">
                    <span className="cp-label--small">Draft</span>
                  </div>
                  <div className="gap" />
                  <div className="right">
                    <CPPointInput />
                  </div>
                </div>
              </div>
              <div className="ant-popover-inner-content">
                <div
                  style={{
                    borderLeft: '3px solid #f64852',
                    fontSize: '12px',
                    lineHeight: 1.67,
                    color: '#f64852',
                    padding: '0px 10px',
                    marginBottom: '10px',
                  }}
                >
                  <span className="cp-label--very-bold">-3</span> this is a rubric comment
                </div>
                <TextArea
                  autosize
                  style={{
                    border: '0px',
                    backgroundColor: '#fafafa',
                    resize: 'none',
                    fontSize: '12px',
                    lineHeight: 1.83,
                  }}
                />
              </div>
              <div style={{ margin: '0px 20px 0px 20px', paddingBottom: '20px' }}>
                <div className="cp-flex--normal">
                  <div className="left">
                    <span className="cp-label--italic cp-label--small">Author: grader@princeton.edu</span>
                  </div>

                  <div className="gap" />
                  <div className="right">
                    <CPButton cpType="secondary" icon="save" />
                  </div>
                  <div className="right">
                    <CPButton cpType="danger" icon="delete" />
                  </div>
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
