import * as React from 'react';
import { Modal, Input, Tabs, Button } from 'antd';
import ReactMarkdown from 'react-markdown';
import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';

interface IMarkdownEditorModalProps {
  title: string;
  startText: string;
  onCancel: () => void;
  onSave: (text: string) => void;
  visible: boolean;
  placeholder?: string;
}

const MarkdownEditorModal: React.FC<IMarkdownEditorModalProps> = ({
  title,
  startText,
  onCancel,
  onSave,
  visible,
  placeholder = 'Write in markdown...',
}) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const [text, setText] = React.useState(startText);

  // Sync state if startText changes when reopening
  React.useEffect(() => {
    if (visible) {
      setText(startText);
    }
  }, [visible, startText]);

  const handleSave = () => {
    onSave(text);
  };

  const footer = [
    <Button key="cancel" onClick={onCancel}>
      Cancel
    </Button>,
    <Button key="save" type="primary" onClick={handleSave}>
      Save
    </Button>,
  ];

  return (
    <Modal
      open={visible}
      title={<span style={{ color: consoleTheme.text }}>{title}</span>}
      onCancel={onCancel}
      footer={footer}
      width={700}
      styles={{ body: { backgroundColor: consoleTheme.mainBg } }}
      closeIcon={<span style={{ color: consoleTheme.text }}>x</span>}
    >
      <div className="markdown-editor-modal" style={{ color: consoleTheme.text }}>
        <Tabs
          defaultActiveKey="edit"
          items={[
            {
              key: 'edit',
              label: 'Edit',
              children: (
                <Input.TextArea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={placeholder}
                  autoSize={{ minRows: 10, maxRows: 15 }}
                  style={{
                    backgroundColor: consoleTheme.subheaderBg,
                    color: consoleTheme.text,
                    borderColor: consoleTheme.siderSubmenuBorder,
                    fontFamily: 'monospace',
                  }}
                />
              ),
            },
            {
              key: 'preview',
              label: 'Preview',
              children: (
                <div
                  style={{
                    minHeight: '200px',
                    padding: '12px',
                    border: `1px solid ${consoleTheme.siderSubmenuBorder}`,
                    borderRadius: '4px',
                    backgroundColor: consoleTheme.mainBg,
                    color: consoleTheme.text,
                  }}
                >
                  {text ? <ReactMarkdown>{text}</ReactMarkdown> : <em style={{ opacity: 0.5 }}>Nothing to preview</em>}
                </div>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
};

export default MarkdownEditorModal;
