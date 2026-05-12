// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect } from 'react';

/* library imports */
import { Alert, Button, Modal, Tabs, Tag, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  FileTextOutlined,
  SyncOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { AnsiUp } from 'ansi-up';
import { Editor } from '@monaco-editor/react';
import { sanitizeHtml } from '../../../../../../utils/sanitize';

/**********************************************************************************************************************/

interface IProps {
  inProgress: boolean;
  isSuccess: boolean | null;
  logs: string;
  dockerfile: string;
  open: boolean;
  onClose: () => void;
}

export const BuildDetailModal = (props: IProps) => {
  /* build pseudo-terminal */
  const scrollToBottom = () => {
    const element = document.getElementById('buildLogs-body');
    if (element) {
      // scroll smoothly if possible, but immediate is fine for logs
      element.scrollTop = element.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [props.logs, props.open]);

  // Status Badge Logic
  let statusBadge;
  if (props.inProgress) {
    statusBadge = (
      <Tag icon={<SyncOutlined spin />} color="processing">
        Building...
      </Tag>
    );
  } else if (props.isSuccess) {
    statusBadge = (
      <Tag icon={<CheckCircleOutlined />} color="success">
        Build Successful
      </Tag>
    );
  } else if (props.isSuccess === false) {
    statusBadge = (
      <Tag icon={<CloseCircleOutlined />} color="error">
        Build Failed
      </Tag>
    );
  } else {
    statusBadge = <Tag>Ready</Tag>;
  }

  // Terminal Component
  const renderTerminal = () => (
    <div
      style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace",
        display: 'flex',
        flexDirection: 'column',
        height: '500px',
      }}
    >
      <div
        style={{
          backgroundColor: '#2d2d2d',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #333',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <div style={{ color: '#aaa', fontSize: '12px' }}>build.log</div>
        <Tooltip title="Copy Logs">
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined style={{ color: '#aaa' }} />}
            onClick={() => {
              navigator.clipboard.writeText(props.logs);
            }}
          />
        </Tooltip>
      </div>
      <div
        id="buildLogs-body"
        style={{
          flexGrow: 1,
          padding: '12px',
          color: '#fff',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html:
              sanitizeHtml(new AnsiUp().ansi_to_html(props.logs)) ||
              (props.inProgress ? 'Initializing build...' : 'No logs available.'),
          }}
        />
        {props.inProgress && (
          <div style={{ marginTop: 10 }}>
            <span style={{ color: '#4caf50' }}>➜</span> <span className="cursor-blink">_</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderDockerfile = () => (
    <div
      style={{
        backgroundColor: '#f6f8fa',
        border: '1px solid #d0d7de',
        borderRadius: '6px',
        padding: '16px',
        height: '500px',
        overflow: 'auto',
        fontFamily: "'Monaco', 'Menlo', 'Consolas', monospace",
        fontSize: '13px',
      }}
    >
      <Editor
        language="dockerfile"
        theme="vs-light"
        value={props.dockerfile || '// Loading...'}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 12,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );

  const tabsItems = [
    {
      key: 'logs',
      label: (
        <span>
          <CodeOutlined /> Build Logs
        </span>
      ),
      children: renderTerminal(),
    },
    {
      key: 'dockerfile',
      label: (
        <span>
          <FileTextOutlined /> Dockerfile
        </span>
      ),
      children: renderDockerfile(),
    },
  ];

  return (
    <Modal
      open={props.open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Environment Build</span>
          {statusBadge}
        </div>
      }
      width={900}
      onCancel={props.onClose}
      footer={[
        <Button
          key="close"
          onClick={props.onClose}
          type={!props.inProgress ? 'primary' : 'default'}
          danger={props.isSuccess === false}
        >
          Close
        </Button>,
      ]}
      style={{ top: 40 }}
    >
      <div style={{ marginTop: 16 }}>
        {!props.inProgress && props.isSuccess && (
          <Alert
            title="Build Completed Successfully"
            description="Your environment is ready to use. You can now close this window."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {!props.inProgress && props.isSuccess === false && (
          <Alert
            title="Build Failed"
            description="Please check the logs below for error details."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs defaultActiveKey="logs" items={tabsItems} />
      </div>
    </Modal>
  );
};
