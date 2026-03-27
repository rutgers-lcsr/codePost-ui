// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Input, Button, Tag } from 'antd';
import { SendOutlined, CodeOutlined } from '@ant-design/icons';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';
import type { CodeContext } from '../../../../stores/useChatStore';

const { TextArea } = Input;

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  attachedContext?: CodeContext | null;
  onRemoveContext?: () => void;
  onAttachContext?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled,
  attachedContext,
  onRemoveContext,
  onAttachContext,
}) => {
  const [text, setText] = React.useState('');
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const contextLabel = attachedContext
    ? attachedContext.startLine === attachedContext.endLine
      ? `${attachedContext.fileName}:${attachedContext.startLine}`
      : `${attachedContext.fileName}:${attachedContext.startLine}-${attachedContext.endLine}`
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 12px',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
        backgroundColor: isDark ? '#1f1f1f' : '#fafafa',
      }}
    >
      {/* Attached context chip */}
      {attachedContext && contextLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Tag
            closable
            onClose={onRemoveContext}
            style={{
              margin: 0,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 11,
              lineHeight: '18px',
              backgroundColor: isDark ? '#1a3a5c' : '#e6f4ff',
              borderColor: isDark ? '#2a5a8c' : '#91caff',
              color: isDark ? '#a0c8f0' : '#0958d9',
            }}
            icon={<CodeOutlined />}
          >
            {contextLabel}
          </Tag>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          type="text"
          size="small"
          icon={<CodeOutlined />}
          onClick={onAttachContext}
          disabled={disabled}
          title="Attach current selection as context"
          style={{
            alignSelf: 'center',
            color: isDark ? '#888' : '#999',
          }}
        />
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachedContext ? 'Ask about the selected code...' : 'Ask about the submission...'}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled}
          style={{
            flex: 1,
            backgroundColor: isDark ? '#2a2a2a' : '#fff',
            color: isDark ? '#e0e0e0' : '#333',
            borderColor: isDark ? '#444' : '#d9d9d9',
            resize: 'none',
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          style={{ alignSelf: 'flex-end' }}
        />
      </div>
    </div>
  );
};

export default MessageInput;
