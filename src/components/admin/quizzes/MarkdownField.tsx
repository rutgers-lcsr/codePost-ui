// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Flex, Input, Segmented, Select, Space, Tooltip, Upload, message, type GetRef } from 'antd';
import {
  BlockOutlined,
  BoldOutlined,
  CodeOutlined,
  FontSizeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Markdown } from '@tiptap/markdown';
// lowlight v3 via the `lowlight3` alias (the real `lowlight` stays v1 for code-review).
import { createLowlight, common } from 'lowlight3';
import { getAuthToken } from '../../../utils/auth';
import './MarkdownField.css';

const lowlight = createLowlight(common);

// Languages offered for a code block's fence (drives in-editor + rendered highlighting).
const CODE_LANGUAGES = [
  'text', 'json', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
  'bash', 'sql', 'yaml', 'html', 'css', 'xml', 'go', 'rust', 'ruby', 'php',
];

type TextAreaRef = GetRef<typeof Input.TextArea>;
type Mode = 'rich' | 'markdown';

interface IProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Course the uploaded images are scoped to. */
  courseId: number;
  placeholder?: string;
  minRows?: number;
  /** Inline-only editing: bold/italic/code/strike/link, no blocks/images. For the
   *  question stem, which stays a single font. */
  basic?: boolean;
  /** Accessible name for the editing surface (rich contenteditable + markdown textarea).
   *  Falls back to the placeholder so the control is never unnamed for screen readers. */
  ariaLabel?: string;
}

/** A dual-mode description editor. Instructors can edit visually in **Rich** mode
 *  (TipTap WYSIWYG) or toggle to raw **Markdown** — both share a single Markdown value.
 *  Designed to be used standalone or as the child of an antd Form.Item (value/onChange). */
const MarkdownField: React.FC<IProps> = ({
  value,
  onChange,
  courseId,
  placeholder,
  minRows = 4,
  basic = false,
  ariaLabel,
}) => {
  const editorLabel = ariaLabel ?? placeholder ?? 'Rich text editor';
  const [mode, setMode] = React.useState<Mode>('rich');
  const [uploading, setUploading] = React.useState(false);
  const taRef = React.useRef<TextAreaRef>(null);
  // Markdown the editor last emitted, so external value changes (form reset, switching
  // items, edits made in Markdown mode) are distinguishable from editor-originated ones.
  const lastEmitted = React.useRef<string>(value ?? '');

  const editor = useEditor({
    immediatelyRender: false,
    // Tiptap v3 defaults this to false, which would freeze the toolbar's
    // isActive() highlights (read during render).
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { 'aria-label': editorLabel, role: 'textbox' } },
    extensions: basic
      ? [
          // Inline-only: keep bold/italic/code/strike marks, drop all block nodes.
          // underline: markdown has no representation for it, so keep it out of the schema.
          StarterKit.configure({
            heading: false,
            bulletList: false,
            orderedList: false,
            listItem: false,
            blockquote: false,
            codeBlock: false,
            horizontalRule: false,
            underline: false,
            link: { openOnClick: false, autolink: true },
          }),
          Markdown,
        ]
      : [
          StarterKit.configure({
            codeBlock: false,
            underline: false,
            link: { openOnClick: false, autolink: true },
          }),
          CodeBlockLowlight.configure({ lowlight }),
          Image,
          Markdown,
        ],
    content: value ?? '',
    contentType: 'markdown',
    onUpdate: ({ editor }) => {
      const md = editor.getMarkdown();
      lastEmitted.current = md;
      onChange?.(md);
    },
  });

  // Reconcile external value → editor (skip editor-originated changes to avoid cursor jumps).
  React.useEffect(() => {
    if (!editor) return;
    if ((value ?? '') === lastEmitted.current) return;
    lastEmitted.current = value ?? '';
    editor.commands.setContent(value ?? '', { emitUpdate: false, contentType: 'markdown' });
  }, [value, editor]);

  // ----- Markdown-mode text helpers (operate on the raw textarea) -----
  const getTextarea = (): HTMLTextAreaElement | null => taRef.current?.resizableTextArea?.textArea ?? null;

  const replaceSelection = (transform: (selected: string) => { text: string; cursor: number }) => {
    const ta = getTextarea();
    const val = value ?? '';
    if (!ta) {
      onChange?.(val + transform('').text);
      return;
    }
    const start = ta.selectionStart ?? val.length;
    const end = ta.selectionEnd ?? val.length;
    const { text, cursor } = transform(val.slice(start, end));
    onChange?.(val.slice(0, start) + text + val.slice(end));
    const pos = start + cursor;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const wrapMd = (before: string, after: string, ph: string) =>
    replaceSelection((sel) => {
      const inner = sel || ph;
      return { text: before + inner + after, cursor: before.length + inner.length + after.length };
    });

  const prefixLineMd = (prefix: string) => {
    const ta = getTextarea();
    const val = value ?? '';
    if (!ta) {
      onChange?.(val + (!val || val.endsWith('\n') ? '' : '\n') + prefix);
      return;
    }
    const start = ta.selectionStart ?? val.length;
    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    onChange?.(val.slice(0, lineStart) + prefix + val.slice(lineStart));
    const pos = start + prefix.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertMd = (text: string) => replaceSelection(() => ({ text, cursor: text.length }));

  // ----- Toolbar actions (branch on mode) -----
  const rich = mode === 'rich';
  const doBold = () => (rich ? editor?.chain().focus().toggleBold().run() : wrapMd('**', '**', 'bold text'));
  const doItalic = () => (rich ? editor?.chain().focus().toggleItalic().run() : wrapMd('*', '*', 'italic'));
  const doCode = () => (rich ? editor?.chain().focus().toggleCode().run() : wrapMd('`', '`', 'code'));
  const doHeading = () =>
    rich ? editor?.chain().focus().toggleHeading({ level: 3 }).run() : prefixLineMd('### ');
  const doBullet = () => (rich ? editor?.chain().focus().toggleBulletList().run() : prefixLineMd('- '));
  const doOrdered = () => (rich ? editor?.chain().focus().toggleOrderedList().run() : prefixLineMd('1. '));
  const doCodeBlock = () =>
    rich ? editor?.chain().focus().toggleCodeBlock().run() : wrapMd('\n```\n', '\n```\n', 'code');

  // Language picker for the code block the cursor is in (rich mode only).
  const inCodeBlock = rich && !!editor?.isActive('codeBlock');
  const currentLang = (editor?.getAttributes('codeBlock').language as string) || 'text';
  const setCodeLang = (lang: string) =>
    editor?.chain().focus().updateAttributes('codeBlock', { language: lang }).run();
  const doStrike = () => (rich ? editor?.chain().focus().toggleStrike().run() : wrapMd('~~', '~~', 'strikethrough'));
  const doLink = () => {
    if (rich) {
      const url = window.prompt('Link URL', 'https://');
      if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      wrapMd('[', '](https://)', 'link text');
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('course', String(courseId));
      form.append('image', file);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/quizImages/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        message.error(body?.error ?? 'Image upload failed.');
        return null;
      }
      const data = await res.json();
      return data.url as string;
    } catch {
      message.error('Image upload failed.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onImageFile = async (file: File) => {
    const url = await uploadImage(file);
    if (!url) return;
    if (rich) editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    else insertMd(`\n![${file.name}](${url})\n`);
    message.success('Image inserted.');
  };

  const tool = (title: string, icon: React.ReactNode, onClick: () => void, active?: boolean) => (
    // aria-label (not just the Tooltip title) so screen readers get the button's name —
    // antd does not expose a Tooltip's title as its child's accessible name.
    <Tooltip title={title}>
      <Button
        size="small"
        type={active ? 'primary' : 'text'}
        icon={icon}
        onClick={onClick}
        aria-label={title}
        aria-pressed={active}
      />
    </Tooltip>
  );

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
        <Space size={0} wrap>
          {tool('Bold', <BoldOutlined />, doBold, rich && editor?.isActive('bold'))}
          {tool('Italic', <ItalicOutlined />, doItalic, rich && editor?.isActive('italic'))}
          {tool('Inline code', <CodeOutlined />, doCode, rich && editor?.isActive('code'))}
          {tool('Strikethrough', <StrikethroughOutlined />, doStrike, rich && editor?.isActive('strike'))}
          {!basic && tool('Code block', <BlockOutlined />, doCodeBlock, rich && editor?.isActive('codeBlock'))}
          {!basic && tool('Heading', <FontSizeOutlined />, doHeading, rich && editor?.isActive('heading', { level: 3 }))}
          {!basic && tool('Bullet list', <UnorderedListOutlined />, doBullet, rich && editor?.isActive('bulletList'))}
          {!basic && tool('Numbered list', <OrderedListOutlined />, doOrdered, rich && editor?.isActive('orderedList'))}
          {tool('Link', <LinkOutlined />, doLink, rich && editor?.isActive('link'))}
          {!basic && (
            <Upload
              accept="image/png,image/jpeg,image/gif,image/webp"
              showUploadList={false}
              disabled={uploading}
              beforeUpload={(file) => {
                void onImageFile(file as File);
                return false; // handle manually; don't let antd upload
              }}
            >
              <Tooltip title="Upload image">
                <Button size="small" type="text" icon={<PictureOutlined />} loading={uploading} aria-label="Upload image" />
              </Tooltip>
            </Upload>
          )}
          {!basic && inCodeBlock && (
            <Select
              size="small"
              value={currentLang}
              onChange={setCodeLang}
              aria-label="Code block language"
              style={{ width: 124, marginLeft: 6 }}
              options={CODE_LANGUAGES.map((l) => ({ value: l, label: l }))}
            />
          )}
        </Space>
        <Segmented
          size="small"
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          aria-label="Editor input mode"
          options={[
            { label: 'Rich', value: 'rich' },
            { label: 'Markdown', value: 'markdown' },
          ]}
        />
      </Flex>

      {rich ? (
        // Mouse-only convenience: clicking the padding around the editor focuses it. The
        // contenteditable inside is the real (keyboard-focusable) interactive element.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="cp-rich-editor" style={{ minHeight: minRows * 24 }} onClick={() => editor?.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>
      ) : (
        <Input.TextArea
          ref={taRef}
          aria-label={editorLabel}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          autoSize={{ minRows, maxRows: 18 }}
          placeholder={placeholder ?? 'Supports Markdown — **bold**, `code`, lists, images…'}
        />
      )}
    </div>
  );
};

export default MarkdownField;
