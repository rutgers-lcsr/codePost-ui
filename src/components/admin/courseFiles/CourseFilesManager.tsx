// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Course-level file management: instructors upload course materials of any type (syllabi,
// slides, PDFs, images, datasets, or text notes). Any file can be flipped to Public, which
// exposes a no-login download link. Text files remain referenceable in AI quiz-generation
// prompts as {course_file:name}. A dedicated admin page (course admins only — writes are
// gated server-side by CourseFilePermissions). Content is stored inline: text as UTF-8, and
// binary as a base64 `data:` URI.
import * as React from 'react';
import {
  Card,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  Button,
  message,
} from 'antd';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { courseFilesApi } from '../../../api-client/clients';
import { Course, CourseFile } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { courseKeys } from '../../../lib/queryKeys';
import { ImageExtensions, PDFExtensions, BinaryExtensions } from '../../../utils/file';
import { dataBytes, dataUriMime, downloadCourseFile, formatBytes } from '../../../utils/courseFiles';
import { useCourseFiles } from './queries';

const { Text } = Typography;

// Heavy renderers load on demand so this page doesn't pull the monaco/pdf/markdown
// vendor chunks until a matching file is opened (same pattern as CodeContent.tsx).
const CourseFileEditorLazy = React.lazy(() => import('./CourseFileEditor'));
const CourseFilePdfPreviewLazy = React.lazy(() => import('./CourseFilePdfPreview'));
const MarkdownLazy = React.lazy(() => import('../../core/Markdown'));

const lazyFallback = (
  <Flex justify="center" style={{ padding: 40 }}>
    <Spin />
  </Flex>
);

// Bridges an antd Form.Item (which injects value/onChange into its child) to the
// lazy-loaded Monaco editor — Suspense itself can't forward those props.
const LazyContentsEditor: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  name: string;
}> = (props) => (
  <React.Suspense fallback={lazyFallback}>
    <CourseFileEditorLazy {...props} />
  </React.Suspense>
);

// Text formats that get a rendered Preview tab next to the editor (includes R/Quarto
// markdown, common as course materials in R courses).
const MARKDOWN_PREVIEW_EXTS = new Set(['.md', '.markdown', '.rmd', '.qmd']);

const binaryKindLabel = (mime: string): string =>
  mime.startsWith('image/') ? 'Image' : mime === 'application/pdf' ? 'PDF' : 'Binary file';

// Match the server-side cap (core/constants.py MAX_COURSE_FILE_SIZE): course-file bytes live
// in the DB as base64 text, so large files are out of scope.
const MAX_COURSE_FILE_BYTES = 25 * 1024 * 1024;

// application/* MIME types that are really text (kept editable + usable as {course_file:name}).
const TEXTUAL_MIME = new Set([
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-yaml',
  'application/yaml',
  'application/x-sh',
]);

interface IProps {
  course: Course;
}

interface IFileForm {
  name: string;
  data: string;
  isPublic: boolean;
  studentVisible: boolean;
  description: string;
}

const extOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
};

// CourseFile.extension is a required, non-blank field on create, so always send one derived
// from the filename (default .txt when the name carries no extension).
const extensionFor = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot) : '.txt';
};

// Fast path: files that claim to be binary via MIME type or a known-binary extension skip
// the UTF-8 sniff in readFile. Files with unknown types (e.g. .rds, .parquet — the browser
// reports no MIME) are decided by content instead, so this list never has to be complete.
const isLikelyBinary = (file: RcFile): boolean => {
  const type = file.type || '';
  const ext = extOf(file.name);
  if (type.includes('image') || type.includes('pdf')) return true;
  if (ImageExtensions.includes(ext) || PDFExtensions.includes(ext) || BinaryExtensions.includes(ext)) return true;
  if (type && !type.startsWith('text/') && !TEXTUAL_MIME.has(type)) return true;
  return false;
};

// Chunked so a 25 MB file doesn't blow the argument-spread stack limit.
const toBase64 = (buf: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) {
    s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  }
  return btoa(s);
};

const CourseFilesManager: React.FC<IProps> = ({ course }) => {
  const courseId = course.id!;
  const queryClient = useQueryClient();
  const { data: files = [], isLoading } = useCourseFiles(courseId);
  const [form] = Form.useForm<IFileForm>();
  const [editing, setEditing] = React.useState<CourseFile | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  // Set when the loaded content is binary (a data: URI) — the text editor is meaningless then.
  const [binarySummary, setBinarySummary] = React.useState<{ size: number; mime: string } | null>(null);
  // Live form values: the filename drives the editor's syntax highlighting, and the
  // contents feed the markdown Preview tab.
  const nameValue = (Form.useWatch('name', form) as string | undefined) ?? '';
  const dataValue = (Form.useWatch('data', form) as string | undefined) ?? '';
  const isMarkdownFile = !binarySummary && MARKDOWN_PREVIEW_EXTS.has(extOf(nameValue));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: courseKeys.files(courseId) });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setBinarySummary(null);
    setModalOpen(true);
  };

  const openEdit = (file: CourseFile) => {
    setEditing(file);
    const data = file.data ?? '';
    form.setFieldsValue({
      name: file.name,
      data,
      isPublic: !!file.isPublic,
      studentVisible: !!file.studentVisible,
      description: file.description ?? '',
    });
    setBinarySummary(data.startsWith('data:') ? { size: dataBytes(data), mime: dataUriMime(data) } : null);
    setModalOpen(true);
  };

  // Read a dropped/selected file and prefill the form (name only if still empty, so an
  // in-progress rename isn't clobbered). The text/binary decision is made by CONTENT, not
  // just the claimed type: anything that isn't valid UTF-8 (or claims a binary type) is
  // stored as a base64 data: URI, so unknown types like .rds or .parquet survive intact
  // instead of being corrupted by a lossy text decode. Valid UTF-8 stays editable text.
  const readFile = (options: {
    file: RcFile;
    onSuccess: (body: unknown, file: RcFile) => void;
    onError: (err: Error) => void;
  }) => {
    const { file, onSuccess, onError } = options;
    if (file.size > MAX_COURSE_FILE_BYTES) {
      const err = new Error(`${file.name} is larger than 25 MB.`);
      message.error(err.message);
      onError(err);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        const err = new Error(`${file.name} could not be read.`);
        message.error(err.message);
        onError(err);
        return;
      }
      const buf = new Uint8Array(reader.result);
      let text: string | null = null;
      if (!isLikelyBinary(file)) {
        try {
          const decoded = new TextDecoder('utf-8', { fatal: true }).decode(buf);
          if (!decoded.includes('\0')) text = decoded;
        } catch {
          // Not valid UTF-8 — fall through to the binary path.
        }
      }
      if (text !== null) {
        form.setFieldsValue({
          data: text,
          ...(form.getFieldValue('name') ? {} : { name: file.name }),
        });
        setBinarySummary(null);
      } else {
        const mime = file.type || 'application/octet-stream';
        form.setFieldsValue({
          data: `data:${mime};base64,${toBase64(buf)}`,
          ...(form.getFieldValue('name') ? {} : { name: file.name }),
        });
        setBinarySummary({ size: file.size, mime });
      }
      onSuccess(file.name, file);
    };
    reader.onerror = () => onError(new Error(`Failed to read ${file.name}.`));
    reader.readAsArrayBuffer(file);
  };

  const onUploadChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'error') message.error(`${info.file.name} could not be uploaded.`);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const data = form.getFieldValue('data') as string; // may come from a hidden (binary) field
    if (!data) {
      message.error('Add the file contents (upload or paste).');
      return;
    }
    setSaving(true);
    try {
      const name = values.name.trim();
      const payload = {
        name,
        data,
        extension: extensionFor(name),
        isPublic: !!values.isPublic,
        studentVisible: !!values.studentVisible,
        description: values.description?.trim() ?? '',
      };
      if (editing) {
        await courseFilesApi.partialUpdate({ id: editing.id, patchedCourseFile: payload });
        message.success('Course file updated.');
      } else {
        await courseFilesApi.create({ courseFile: { course: courseId, ...payload } });
        message.success('Course file added.');
      }
      setModalOpen(false);
      invalidate();
    } catch (err) {
      message.error(apiErrorMessage(err, 'name') ?? 'Failed to save the course file.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublic = async (file: CourseFile, next: boolean) => {
    try {
      await courseFilesApi.partialUpdate({ id: file.id, patchedCourseFile: { isPublic: next } });
      invalidate();
    } catch {
      message.error('Failed to update sharing.');
    }
  };

  const toggleStudentVisible = async (file: CourseFile, next: boolean) => {
    try {
      await courseFilesApi.partialUpdate({ id: file.id, patchedCourseFile: { studentVisible: next } });
      invalidate();
    } catch {
      message.error('Failed to update student visibility.');
    }
  };

  const copyLink = async (file: CourseFile) => {
    if (!file.publicUrl) return;
    try {
      await navigator.clipboard.writeText(file.publicUrl);
      message.success('Public link copied.');
    } catch {
      message.error('Could not copy the link.');
    }
  };

  const handleDelete = (file: CourseFile) => {
    Modal.confirm({
      title: `Delete "${file.name}"?`,
      content: 'The file (and any public link or {course_file:…} AI-prompt reference) will no longer be available.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await courseFilesApi.destroy({ id: file.id });
          message.success('Course file deleted.');
          invalidate();
        } catch {
          message.error('Failed to delete the course file.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'File',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: CourseFile) => (
        <Space>
          <FileTextOutlined aria-hidden style={{ color: '#198665' }} />
          <Button type="text" size="small" onClick={() => openEdit(record)} style={{ padding: 0, height: 'auto' }}>
            {name}
          </Button>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'extension',
      key: 'extension',
      width: 90,
      render: (extension: string) => <Tag>{extension || '—'}</Tag>,
    },
    {
      title: 'Size',
      key: 'size',
      width: 90,
      render: (_: unknown, record: CourseFile) => <Text type="secondary">{formatBytes(dataBytes(record.data))}</Text>,
    },
    {
      title: 'Students',
      key: 'studentVisible',
      width: 90,
      render: (_: unknown, record: CourseFile) => (
        <Switch
          size="small"
          checked={!!record.studentVisible}
          onChange={(next) => toggleStudentVisible(record, next)}
          aria-label={`Show ${record.name} to students`}
        />
      ),
    },
    {
      title: 'Public',
      key: 'public',
      width: 170,
      render: (_: unknown, record: CourseFile) => (
        <Space>
          <Switch
            size="small"
            checked={!!record.isPublic}
            onChange={(next) => togglePublic(record, next)}
            aria-label={`Make ${record.name} publicly downloadable`}
          />
          {record.isPublic && record.publicUrl ? (
            <Button size="small" icon={<LinkOutlined />} onClick={() => copyLink(record)}>
              Copy link
            </Button>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'modified',
      key: 'modified',
      width: 160,
      render: (modified: string) =>
        modified
          ? new Date(modified).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: CourseFile) => (
        <Space.Compact size="small">
          <Button
            size="small"
            icon={<DownloadOutlined />}
            aria-label={`Download file: ${record.name}`}
            title="Download file"
            onClick={() => downloadCourseFile(record)}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            aria-label={`Edit file: ${record.name}`}
            title="Edit file"
            onClick={() => openEdit(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete file: ${record.name}`}
            title="Delete file"
            onClick={() => handleDelete(record)}
          />
        </Space.Compact>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={1} style={{ fontSize: 22, marginBottom: 4 }}>
        Course Files
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Upload course materials of any type (syllabi, slides, PDFs, images, datasets, or notes). Flip a file to{' '}
        <Text strong>Students</Text> to show it in the course file directory on the student course page, or to{' '}
        <Text strong>Public</Text> to share it with a link that needs no login. Text files can also be referenced in an
        AI-generated question section's prompt as <Text code>{'{course_file:name}'}</Text>.
      </Typography.Paragraph>

      <Card
        title={
          <Flex align="center" gap={8}>
            <Typography.Title level={2} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Files
            </Typography.Title>
            <Tag color="blue">{files.length}</Tag>
          </Flex>
        }
        extra={
          <CPButton cpType="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add file
          </CPButton>
        }
        styles={{ body: { padding: 0 } }}
      >
        {isLoading ? (
          <Flex justify="center" style={{ padding: 40 }}>
            <Spin />
          </Flex>
        ) : files.length === 0 ? (
          <Empty description="No course files yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 32 }} />
        ) : (
          <Table dataSource={files} columns={columns} rowKey="id" size="small" pagination={false} />
        )}
      </Card>

      <Modal
        title={editing ? 'Edit Course File' : 'Add Course File'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Save' : 'Add'}
        confirmLoading={saving}
        destroyOnHidden
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isPublic: false, studentVisible: false }}
          style={{ marginTop: 16 }}
        >
          <Form.Item label="Upload a file (optional)">
            <Upload
              showUploadList={false}
              onChange={onUploadChange}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              customRequest={readFile as any}
            >
              <Button icon={<UploadOutlined />}>Choose file</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              Any file type, up to 25 MB. Text files can also be edited below.
            </Text>
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please name the file.' }]}>
            <Input placeholder="e.g., syllabus.pdf" maxLength={250} />
          </Form.Item>
          {binarySummary ? (
            <Form.Item label="Contents">
              {binarySummary.mime.startsWith('image/') ? (
                <Image
                  src={dataValue}
                  alt={`Preview of ${nameValue || 'the uploaded image'}`}
                  style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }}
                />
              ) : null}
              {binarySummary.mime === 'application/pdf' ? (
                <div style={{ maxHeight: 400, overflow: 'auto', marginBottom: 8 }}>
                  <React.Suspense fallback={lazyFallback}>
                    <CourseFilePdfPreviewLazy dataUri={dataValue} />
                  </React.Suspense>
                </div>
              ) : null}
              <Text type="secondary" style={{ display: 'block' }}>
                {binaryKindLabel(binarySummary.mime)} — {formatBytes(binarySummary.size)} ({binarySummary.mime}). Stored
                as uploaded; upload a new file above to replace it.
              </Text>
            </Form.Item>
          ) : isMarkdownFile ? (
            <Tabs
              size="small"
              items={[
                {
                  key: 'edit',
                  label: 'Edit contents',
                  children: (
                    <Form.Item
                      name="data"
                      rules={[{ required: true, message: 'Add the file contents (upload or paste).' }]}
                    >
                      <LazyContentsEditor name={nameValue} />
                    </Form.Item>
                  ),
                },
                {
                  key: 'preview',
                  label: 'Preview',
                  children: (
                    <div
                      style={{
                        maxHeight: 384,
                        overflow: 'auto',
                        border: '1px solid #d9d9d9',
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 24,
                      }}
                    >
                      <React.Suspense fallback={lazyFallback}>
                        <MarkdownLazy>{dataValue}</MarkdownLazy>
                      </React.Suspense>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <Form.Item
              name="data"
              label="Contents"
              rules={[{ required: true, message: 'Add the file contents (upload or paste).' }]}
            >
              <LazyContentsEditor name={nameValue} />
            </Form.Item>
          )}
          <Form.Item name="description" label="Description">
            <Input.TextArea
              autoSize={{ minRows: 2, maxRows: 4 }}
              maxLength={2000}
              placeholder="Optional description shown to students in the course file directory."
            />
          </Form.Item>
          <Form.Item
            name="studentVisible"
            label="Visible to students"
            valuePropName="checked"
            extra="Students in this course can see and download the file from their course page."
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="isPublic"
            label="Public link"
            valuePropName="checked"
            extra="Anyone with the link can download this file — no login required."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseFilesManager;
