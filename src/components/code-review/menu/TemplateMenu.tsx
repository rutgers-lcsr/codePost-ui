import * as React from 'react';
import { Popconfirm, message, Card, Button, InputNumber, Input, Tooltip, Switch } from 'antd';
import {
  DeleteOutlined,
  GlobalOutlined,
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { CommentTemplateIO, CommentTemplateType } from '../../../infrastructure/commentTemplate';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';
import { colors } from '../../../theme/colors';
import { useSpring, animated } from 'react-spring';

interface ITemplateMenuProps {
  assignmentId: number;
  onApplyTemplate: (template: CommentTemplateType) => void;
  currentUserEmail: string;
  refreshTrigger?: number;
  currentFilePath?: string;
  isSuperGrader?: boolean;
}

const TemplateMenu: React.FC<ITemplateMenuProps> = (props) => {
  const { onApplyTemplate, assignmentId, currentUserEmail, refreshTrigger, currentFilePath, isSuperGrader } = props;
  const [templates, setTemplates] = React.useState<CommentTemplateType[]>([]);
  const [loading, setLoading] = React.useState(false);
  // State for template editing has been moved to TemplateCard
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDarkTheme = consoleThemes.dark === consoleTheme.consoleTheme;

  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await CommentTemplateIO.list(assignmentId);
      setTemplates(data);
    } catch (e) {
      console.error(e);
      message.error('Failed to load pinned comments');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshTrigger]);

  // Filter templates by current file (show file-specific + global templates)
  const filteredTemplates = React.useMemo(() => {
    if (!currentFilePath) {
      return templates;
    }
    return templates.filter((t) => {
      // Show if: no filePath (global), or filePath matches current file
      return !t.filePath || t.filePath === currentFilePath;
    });
  }, [templates, currentFilePath]);

  const textColor = consoleTheme.consoleTheme.siderMenuItemColor;

  return (
    <div id="template-menu" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: 8 }}>
        {/* Global Templates Section */}
        {filteredTemplates.filter((t) => t.isGlobal).length > 0 && (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: isDarkTheme ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                marginBottom: 8,
                marginTop: 4,
                paddingLeft: 4,
              }}
            >
              GLOBAL COMMENTS
            </div>
            {filteredTemplates
              .filter((t) => t.isGlobal)
              .map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isSuperGrader={!!isSuperGrader}
                  currentUserEmail={currentUserEmail}
                  onApply={() => onApplyTemplate(t)}
                  onRefresh={fetchTemplates}
                  theme={consoleTheme.consoleTheme}
                  isDarkTheme={isDarkTheme}
                />
              ))}
          </>
        )}

        {/* Personal Templates Section */}
        {filteredTemplates.filter((t) => !t.isGlobal).length > 0 && (
          <>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: isDarkTheme ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                marginBottom: 8,
                marginTop: filteredTemplates.some((t) => t.isGlobal) ? 16 : 4,
                paddingLeft: 4,
              }}
            >
              MY COMMENTS
            </div>
            {filteredTemplates
              .filter((t) => !t.isGlobal)
              .map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  isSuperGrader={!!isSuperGrader}
                  currentUserEmail={currentUserEmail}
                  onApply={() => onApplyTemplate(t)}
                  onRefresh={fetchTemplates}
                  theme={consoleTheme.consoleTheme}
                  isDarkTheme={isDarkTheme}
                />
              ))}
          </>
        )}

        {filteredTemplates.length === 0 && !loading && (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              color: textColor,
              opacity: 0.7,
            }}
          >
            No pinned comments for this file. Click the pin icon on a comment to save it here.
          </div>
        )}
      </div>
    </div>
  );
};

interface ITemplateCardProps {
  template: CommentTemplateType;
  isSuperGrader: boolean;
  currentUserEmail: string;
  onApply: () => void;
  onRefresh: () => void;
  theme: any;
  isDarkTheme: boolean;
}

const TemplateCard: React.FC<ITemplateCardProps> = ({
  template: t,
  isSuperGrader,
  currentUserEmail,
  onApply,
  onRefresh,
  theme,
  isDarkTheme,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState('');
  const [editPoints, setEditPoints] = React.useState<number | null>(null);
  const [editIsGlobal, setEditIsGlobal] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const expandStyle = useSpring({
    to: {
      maxHeight: isHovered ? 500 : 36, // 36px is roughly 2 lines
    },
    config: { tension: 300, friction: 30 },
  });

  const isOwner = t.owner === currentUserEmail;
  const isGlobal = t.isGlobal;
  const icon = isGlobal ? <GlobalOutlined /> : <UserOutlined />;
  const textColor = theme.siderMenuItemColor;
  const bgHover = isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)';

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditText(t.text);
    setEditPoints(t.pointDelta ?? null);
    setEditIsGlobal(t.isGlobal);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const saveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await CommentTemplateIO.update({
        id: t.id,
        text: editText,
        pointDelta: editPoints,
        isGlobal: editIsGlobal,
      });
      message.success('Pinned comment updated');
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      message.error('Failed to update pinned comment');
    }
  };

  const handleDelete = async (e: React.MouseEvent | undefined) => {
    e?.stopPropagation();
    try {
      await CommentTemplateIO.delete({ id: t.id });
      message.success('Pinned comment deleted');
      onRefresh();
    } catch (err) {
      message.error('Failed to delete pinned comment');
    }
  };

  const handleToggleGlobal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await CommentTemplateIO.update({
        id: t.id,
        text: t.text,
        pointDelta: t.pointDelta,
        isGlobal: !t.isGlobal,
      });
      message.success(`Template made ${!t.isGlobal ? 'Global' : 'Personal'}`);
      onRefresh();
    } catch (err) {
      message.error('Failed to update template status');
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        cursor: 'pointer',
        backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.05)' : '#fafafa',
        border: `1px solid ${isDarkTheme ? colors.neutralDarkBorder : colors.neutralBorder}`,
      }}
      styles={{ body: { padding: 8 } }}
      onClick={() => !isEditing && onApply()}
      onMouseEnter={(e) => {
        if (!isEditing) {
          e.currentTarget.style.backgroundColor = bgHover;
          setIsHovered(true);
        }
        if (t.cellId) {
          const el = document.querySelector(`[data-cell-uuid='${t.cellId}']`);
          el?.classList.add('markdown-block--pulsing');
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }}
      onMouseLeave={(e) => {
        if (!isEditing) {
          e.currentTarget.style.backgroundColor = isDarkTheme ? 'rgba(255,255,255,0.05)' : '#fafafa';
          setIsHovered(false);
        }
        if (t.cellId) {
          const el = document.querySelector(`[data-cell-uuid='${t.cellId}']`);
          el?.classList.remove('markdown-block--pulsing');
        }
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onApply();
        }
      }}
    >
      {isEditing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <Input.TextArea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: textColor }}>Points:</span>
            <InputNumber value={editPoints} onChange={(val) => setEditPoints(val)} size="small" style={{ width: 80 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isSuperGrader && (
                <>
                  <span style={{ color: textColor, fontSize: 12 }}>Global:</span>
                  <Switch size="small" checked={editIsGlobal} onChange={(checked) => setEditIsGlobal(checked)} />
                </>
              )}
            </div>
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={saveEdit}>
              Save
            </Button>
            <Button size="small" icon={<CloseOutlined />} onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
            <Tooltip title={isGlobal ? 'Global Template' : 'Personal Template'}>
              <span style={{ marginRight: 6, color: textColor }}>{icon}</span>
            </Tooltip>
            <Tooltip
              title="Click to apply this template to the current file (or active comment)."
              mouseEnterDelay={0.8}
            >
              <animated.div
                style={{
                  flex: 1,
                  color: textColor,
                  fontSize: 13,
                  lineHeight: '18px', // Explicit line height for accurate height calc
                  overflow: 'hidden',
                  ...expandStyle,
                }}
              >
                {t.text}
              </animated.div>
            </Tooltip>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {t.pointDelta !== null && t.pointDelta !== undefined && t.pointDelta !== 0 ? (
              <span style={{ fontWeight: 'bold', color: t.pointDelta < 0 ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
                {t.pointDelta < 0 ? '+' : ''}
                {-t.pointDelta} pts
              </span>
            ) : (
              <span />
            )}
            {isOwner && (
              <div style={{ display: 'flex', gap: 4 }}>
                {isSuperGrader && (
                  <Tooltip title={isGlobal ? 'Make Personal' : 'Make Global'}>
                    <Button
                      size="small"
                      type="text"
                      icon={isGlobal ? <UserOutlined /> : <GlobalOutlined />}
                      onClick={handleToggleGlobal}
                    />
                  </Tooltip>
                )}
                <Tooltip title="Edit">
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={startEdit} />
                </Tooltip>
                <Popconfirm
                  title="Delete pinned comment?"
                  onConfirm={(e) => handleDelete(e as any)}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <Tooltip title="Delete">
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Tooltip>
                </Popconfirm>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default TemplateMenu;
