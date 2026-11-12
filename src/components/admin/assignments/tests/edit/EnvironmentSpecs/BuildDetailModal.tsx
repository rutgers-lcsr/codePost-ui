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
import { Editor } from '../../../../../../lib/monaco';
import { sanitizeHtml } from '../../../../../../utils/sanitize';
import { BRAND_GREEN_VIBRANT, LINE_SOFT, PAGE_GREY } from '../../../../../../theme/tokens';
import { prefersReducedMotion } from './environmentStatus';

/**********************************************************************************************************************/

// Secondary text on the dark log surface.
const LOG_SECONDARY = 'rgba(255, 255, 255, 0.7)';

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
      <Tag icon={<SyncOutlined aria-hidden spin={!prefersReducedMotion()} />} color="processing">
        Building
      </Tag>
    );
  } else if (props.isSuccess) {
    statusBadge = (
      <Tag icon={<CheckCircleOutlined aria-hidden />} color="success">
        Last build succeeded
      </Tag>
    );
  } else if (props.isSuccess === false) {
    statusBadge = (
      <Tag icon={<CloseCircleOutlined aria-hidden />} color="error">
        Build failed
      </Tag>
    );
  } else {
    statusBadge = <Tag>Not built</Tag>;
  }

  // Terminal Component
  const renderTerminal = () => (
    <div
      style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '4px',
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
        <div style={{ color: LOG_SECONDARY, fontSize: '12px' }}>build.log</div>
        <Tooltip title="Copy logs">
          <Button
            type="text"
            size="small"
            aria-label="Copy logs"
            icon={<CopyOutlined aria-hidden style={{ color: LOG_SECONDARY }} />}
            onClick={() => {
              navigator.clipboard.writeText(props.logs);
            }}
          />
        </Tooltip>
      </div>
      <div
        id="buildLogs-body"
        // A scrolling log has to be reachable without a mouse.
        role="log"
        aria-label="Build log"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
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
            <span style={{ color: BRAND_GREEN_VIBRANT }}>$</span> _
          </div>
        )}
      </div>
    </div>
  );

  const renderDockerfile = () => (
    <div
      style={{
        backgroundColor: PAGE_GREY,
        border: `1px solid ${LINE_SOFT}`,
        borderRadius: '4px',
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
          <CodeOutlined aria-hidden /> Build log
        </span>
      ),
      children: renderTerminal(),
    },
    {
      key: 'dockerfile',
      label: (
        <span>
          <FileTextOutlined aria-hidden /> Dockerfile
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
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Environment build</span>
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
            title="The last build succeeded"
            description="This is the log of the image now in use. Changes made since then show on the page as Out of date."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {!props.inProgress && props.isSuccess === false && (
          <Alert
            title="The last build failed"
            description="The reason is at the end of the log below."
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
