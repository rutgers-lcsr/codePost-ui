/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect } from 'react';

import { animateScroll } from 'react-scroll';

/* library imports */
import { Collapse, Modal, Tag, Tooltip } from 'antd';

interface IProps {
  inProgress: boolean;
  isSuccess: boolean | null;
  logs: string;
  dockerfile: string;
}

export const BuildDetailModal = (props: IProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Newly finished build that failed
    if (props.inProgress) {
      setVisible(true);
    }
  }, [props.inProgress]);

  /* build pseudo-terminal */
  const scrollToBottom = () => {
    animateScroll.scrollToBottom({
      containerId: 'buildLogs-body',
      animate: false,
    });
  };

  React.useEffect(scrollToBottom, [props.logs]);

  const tagColor = props.inProgress ? 'grey' : props.isSuccess ? 'green' : 'red';
  const tagText = props.inProgress ? 'Building...' : props.isSuccess ? 'Build successful' : 'Build failed';

  const smallTag = <Tag color={tagColor}>{tagText}</Tag>;
  const bigTag = (
    <Tag color={tagColor} style={{ fontSize: 18, padding: '10px 16px' }}>
      {tagText}
    </Tag>
  );

  const tooltipText = `Last build ${props.isSuccess ? 'was successful' : 'failed'}. Click to see details.`;

  return (
    <div>
      <Modal
        visible={visible}
        title={<span style={{ display: 'flex', justifyContent: 'center' }}>{bigTag}</span>}
        width={700}
        onCancel={() => setVisible(false)}
        onOk={() => setVisible(false)}
      >
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
          <Collapse bordered={false} defaultActiveKey="2">
            <Collapse.Panel header="Dockerfile" key="1">
              <span style={{ whiteSpace: 'pre-wrap' }}>{props.dockerfile}</span>
            </Collapse.Panel>
            <Collapse.Panel header="Logs stream" key="2">
              <div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
                <div id="buildLogs-body" style={{ flexGrow: 1, overflow: 'auto' }}>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{props.logs}</span>
                </div>
              </div>
            </Collapse.Panel>
          </Collapse>
        </div>
      </Modal>
      {props.isSuccess !== null && (
        <span onClick={() => setVisible(true)} style={{ cursor: 'pointer', marginLeft: 10 }}>
          <Tooltip title={tooltipText}>{smallTag}</Tooltip>
        </span>
      )}
    </div>
  );
};
