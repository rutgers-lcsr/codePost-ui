/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* other library imports */
import { animateScroll } from 'react-scroll';

/* library imports */
import { Button, Collapse, Modal, Result, Spin, Tag, Tooltip, Typography } from 'antd';

/**********************************************************************************************************************/

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
  const tagText = props.inProgress ? 'Building...' : props.isSuccess ? 'Last build successful' : 'Last build failed';

  const smallTag = <Tag color={tagColor}>{tagText}</Tag>;

  const tooltipText = `Last build ${props.isSuccess ? 'was successful' : 'failed'}. Click to see details.`;

  return (
    <div>
      <Modal
        visible={visible}
        title="Build status"
        width={700}
        onCancel={() => setVisible(false)}
        footer={[
          <Button onClick={() => setVisible(false)} type={!props.inProgress ? 'primary' : undefined}>
            Close
          </Button>,
        ]}
      >
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
          {props.inProgress && (
            <div style={{ textAlign: 'center', margin: '0 auto', padding: '30px 50px' }}>
              <Spin size="large" />
              <br />
              <Typography.Title level={4}>Building your environment</Typography.Title>
            </div>
          )}

          {!props.inProgress && props.isSuccess && (
            <Result
              status="success"
              title="Your environment built successfully!"
              subTitle="Click Close below to continue"
            />
          )}
          {!props.inProgress && !props.isSuccess && (
            <Result status="error" title="Your build failed" subTitle="Check the logs stream below for more details." />
          )}
          <Collapse bordered={false}>
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
