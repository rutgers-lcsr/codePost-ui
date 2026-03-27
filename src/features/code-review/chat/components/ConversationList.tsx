// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, List, Popconfirm, Typography, Input, Empty, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ChatConversation } from '../../../../stores/useChatStore';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

const { Text } = Typography;

interface ConversationListProps {
  conversations: ChatConversation[];
  loading: boolean;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, title: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  onSelect,
  onNew,
  onDelete,
  onRename,
}) => {
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editTitle, setEditTitle] = React.useState('');

  const startEditing = (conv: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title || '');
  };

  const finishEditing = () => {
    if (editingId !== null && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  const textColor = isDark ? '#e0e0e0' : '#333';
  const subtextColor = isDark ? '#888' : '#999';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <Button type="primary" icon={<PlusOutlined />} block onClick={onNew} size="small">
          New Chat
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : conversations.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: subtextColor, fontSize: 12 }}>No conversations yet</span>}
            style={{ marginTop: 40 }}
          />
        ) : (
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                style={{
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.02)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ width: '100%' }}>
                  {editingId === conv.id ? (
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <Input
                        size="small"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onPressEnter={finishEditing}
                        autoFocus
                        style={{ flex: 1 }}
                      />
                      <Button size="small" icon={<CheckOutlined />} onClick={finishEditing} type="text" />
                      <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingId(null)} type="text" />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text ellipsis style={{ color: textColor, fontSize: 13, fontWeight: 500, display: 'block' }}>
                          {conv.title || 'Untitled'}
                        </Text>
                        <Text style={{ color: subtextColor, fontSize: 11 }}>
                          {conv.messageCount} messages · {new Date(conv.modified).toLocaleDateString()}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', gap: 2, opacity: 0.5 }} onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={(e) => startEditing(conv, e)}
                        />
                        <Popconfirm
                          title="Delete this conversation?"
                          onConfirm={() => onDelete(conv.id)}
                          okText="Delete"
                          cancelText="Cancel"
                        >
                          <Button size="small" type="text" icon={<DeleteOutlined />} danger />
                        </Popconfirm>
                      </div>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default ConversationList;
