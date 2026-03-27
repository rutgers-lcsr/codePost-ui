// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Card, Tag, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, BookOutlined, MessageOutlined, AimOutlined } from '@ant-design/icons';
import type { PendingToolCall } from '../../../../stores/useChatStore';
import { getTool } from '../tools/registry';
import type { ToolFileInfo } from '../tools/types';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';
import { colors } from '../../../../theme/colors';

interface ToolCallCardProps {
  toolCall: PendingToolCall;
  onApprove: (messageId: number) => void;
  onReject: (messageId: number) => void;
  files?: ToolFileInfo[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOutlined: <BookOutlined />,
  MessageOutlined: <MessageOutlined />,
  AimOutlined: <AimOutlined />,
};

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall, onApprove, onReject, files }) => {
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;

  const tool = getTool(toolCall.name);
  const label = tool?.label || toolCall.name;
  const icon = tool ? ICON_MAP[tool.icon] || null : null;
  const description = tool ? tool.describeArgs(toolCall.args, { files }) : toolCall.description;

  return (
    <div style={{ padding: '4px 12px' }}>
      <Card
        size="small"
        style={{
          backgroundColor: isDark ? '#1a2733' : '#f0f7ff',
          borderColor: isDark ? '#2a4a6b' : colors.actionBlue,
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {icon}
          <Tag color="blue">{label}</Tag>
          <span style={{ fontSize: 11, color: isDark ? '#888' : '#999' }}>wants to:</span>
        </div>

        <div
          style={{
            fontSize: 13,
            color: isDark ? '#ccc' : '#333',
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Tooltip title="Reject this action">
            <Button size="small" icon={<CloseOutlined />} onClick={() => onReject(toolCall.messageId)} danger>
              Reject
            </Button>
          </Tooltip>
          <Tooltip title="Approve and execute">
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => onApprove(toolCall.messageId)}>
              Approve
            </Button>
          </Tooltip>
        </div>
      </Card>
    </div>
  );
};

export default ToolCallCard;
