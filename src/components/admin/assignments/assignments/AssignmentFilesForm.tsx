// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* AssignmentFilesForm - starter files students download, complete and submit back
/**********************************************************************************************************************/

import {
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FileOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import Editor from '../../../../lib/monaco';
import {
  contentSizeBytes,
  DATASET_HINT,
  formatFileSize,
  formatLimit,
  getUploadLimits,
} from '../../../../lib/uploadLimits';
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
  Radio,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import JSZip from 'jszip';
import * as React from 'react';
import { colors } from '../../../../theme/colors';
import { AssignmentFileType, File as CodePostFile } from '../../../../utils/file';
import NotebookEditor from './NotebookEditor';

// Lazy so the pdf-vendor chunk is only pulled when a PDF is opened.
const PdfPreviewLazy = React.lazy(() => import('../../courseFiles/CourseFilePdfPreview'));

const { Text } = Typography;

interface AssignmentFilesFormProps {
  value?: AssignmentFileType[];
  onChange?: (files: AssignmentFileType[]) => void;
  assignmentId?: number;
}

interface EditableFile extends AssignmentFileType {
  isEditing?: boolean;
}

function getCodingLanguage(extension: string): string {
  // Map our detected extensions to Monaco editor languages if they differ
  const lang = CodePostFile.language({ name: `test.${extension}`, extension });
  if (lang === 'c++') return 'cpp';
  if (lang === 'c') return 'cpp'; // Monaco uses 'cpp' for C/C++ usually or 'c'
  return lang;
}

// Images and PDFs get a rendered Preview mode instead of opening their data URI in Monaco.
function getPreviewType(file: AssignmentFileType | undefined): 'image' | 'pdf' | null {
  if (!file) return null;
  const type = CodePostFile.codeType(file);
  return type === 'image' || type === 'pdf' ? type : null;
}

// Zip entries carry no MIME type, so binary ones are labelled from their extension.
const BINARY_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
};

function mimeForFileName(name: string): string {
  return BINARY_MIME_TYPES[CodePostFile.extension(name).toLowerCase()] || 'application/octet-stream';
}

// Known binary extensions always count as binary: readAsText silently mangles non-UTF-8
// bytes, so a PDF/image without NUL bytes would otherwise be corrupted.
function isBinaryContent(name: string, text: string): boolean {
  return CodePostFile.extension(name).toLowerCase() in BINARY_MIME_TYPES || text.indexOf('\0') !== -1;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// Text files are stored as-is; binary files (images, PDFs, ...) as data URIs, decoded on
// download/execution.
async function readFileContent(file: File): Promise<string> {
  const text = await readAsText(file);
  return isBinaryContent(file.name, text) ? readAsDataUrl(file) : text;
}

// Binary files are stored as data URIs; an SVG may instead be stored as its raw markup.
function toPreviewSrc(data: string, extension: string): string | null {
  if (data.startsWith('data:')) return data;
  if (extension.toLowerCase() === 'svg' && data.trim()) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`;
  }
  return null;
}

const fullPathOf = (f: { path?: string | null; name: string }) => (f.path ? `${f.path}/${f.name}` : f.name);

const AssignmentFilesForm: React.FC<AssignmentFilesFormProps> = ({ value = [], onChange, assignmentId }) => {
  const [files, setFiles] = React.useState<EditableFile[]>(value);
  // Latest files for async readers: several dropped files resolve out of order, and each
  // append must build on what the previous one produced, not on a stale render.
  const filesRef = React.useRef<EditableFile[]>(value);
  const [viewingCode, setViewingCode] = React.useState<{ file: EditableFile; visible: boolean } | null>(null);
  const [editingCode, setEditingCode] = React.useState<string>('');
  const [viewMode, setViewMode] = React.useState<'json' | 'notebook' | 'preview'>('json');
  const [nameModal, setNameModal] = React.useState<{ editing: EditableFile | null } | null>(null);
  const [nameForm] = Form.useForm<{ path?: string; name: string }>();
  const previewType = getPreviewType(viewingCode?.file);

  // Update internal state when external value changes
  React.useEffect(() => {
    setFiles(value);
    filesRef.current = value;
  }, [value]);

  // Initialize editing code when modal opens
  React.useEffect(() => {
    if (viewingCode?.file) {
      setEditingCode(viewingCode.file.data || '');
      if (CodePostFile.isNotebookFile(viewingCode.file)) {
        setViewMode('notebook');
      } else if (getPreviewType(viewingCode.file)) {
        setViewMode('preview');
      } else {
        setViewMode('json');
      }
    }
  }, [viewingCode]);

  // Notify parent of changes
  const updateFiles = (updatedFiles: EditableFile[]) => {
    filesRef.current = updatedFiles;
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  const isStudentVisibleFile = (file: EditableFile): boolean => {
    const normalized = file as EditableFile & { is_test_resource?: boolean };
    return !(file.hidden || file.isTestResource || normalized.is_test_resource);
  };

  const isDuplicateName = (name: string, excludeId?: number): boolean =>
    filesRef.current.some((file) => file.name.toLowerCase() === name.toLowerCase() && file.id !== excludeId);

  let nextTempId = 0;
  const makeFile = (name: string, path: string, data: string): EditableFile => ({
    // Temporary negative id until saved.
    id: -1 * (Date.now() + filesRef.current.length + nextTempId++),
    name,
    extension: CodePostFile.extension(name) || 'txt',
    path,
    required: false,
    assignment: assignmentId || filesRef.current[0]?.assignment || 0,
    data,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    description: '',
  });

  // ---- add / edit by name -----------------------------------------------------------------

  const openNameModal = (editing: EditableFile | null) => {
    nameForm.resetFields();
    if (editing) nameForm.setFieldsValue({ path: editing.path || '', name: editing.name });
    setNameModal({ editing });
  };

  const handleNameSubmit = (values: { path?: string; name: string }) => {
    const name = values.name.trim();
    const path = (values.path || '').trim();
    const editing = nameModal?.editing ?? null;
    if (editing) {
      updateFiles(
        filesRef.current.map((f) =>
          f.id === editing.id ? { ...f, name, path, extension: CodePostFile.extension(name) || 'txt' } : f,
        ),
      );
    } else {
      updateFiles([...filesRef.current, makeFile(name, path, '')]);
    }
    setNameModal(null);
  };

  // ---- row actions ------------------------------------------------------------------------

  const handleDelete = (id: number) => updateFiles(filesRef.current.filter((file) => file.id !== id));

  const handleToggleRequired = (id: number) =>
    updateFiles(filesRef.current.map((file) => (file.id === id ? { ...file, required: !file.required } : file)));

  // Per-file cap the API enforces on /assignmentFiles/ (MAX_ASSIGNMENT_FILE_SIZE); anything
  // bigger belongs in a dataset, which streams as multipart and allows up to 1 GB.
  const tooLarge = (name: string, bytes: number): boolean => {
    const limit = getUploadLimits().maxAssignmentFileBytes;
    if (bytes <= limit) return false;
    message.warning(
      `${name} is ${formatFileSize(bytes)}, over the ${formatLimit(limit)} per-file limit. ${DATASET_HINT}`,
      8,
    );
    return true;
  };

  // Replace the content of an existing row with an uploaded file.
  const handleUploadCode = async (id: number, file: File) => {
    if (tooLarge(file.name, file.size)) return;
    try {
      const content = await readFileContent(file);
      updateFiles(filesRef.current.map((f) => (f.id === id ? { ...f, data: content } : f)));
      message.success(`Uploaded ${file.name}`);
    } catch {
      message.error('Failed to read file');
    }
  };

  // ---- drop zone: plain files are added one row each, a .zip is expanded into its tree ----

  const filesFromZip = async (zipFile: File): Promise<EditableFile[]> => {
    const zip = await JSZip.loadAsync(zipFile);
    const out: EditableFile[] = [];
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      // Skip directories and hidden files
      if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.includes('/.')) continue;
      const pathParts = relativePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const directory = pathParts.slice(0, -1).join('/');
      let content = await zipEntry.async('text');
      if (isBinaryContent(fileName, content)) {
        content = `data:${mimeForFileName(fileName)};base64,${await zipEntry.async('base64')}`;
      }
      if (tooLarge(relativePath, contentSizeBytes(content))) continue;
      out.push(makeFile(fileName, directory, content));
    }
    return out;
  };

  const handleIncomingFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const extracted = await filesFromZip(file);
        if (extracted.length === 0) {
          message.warning(`No files found in ${file.name}`);
          return;
        }
        updateFiles([...filesRef.current, ...extracted]);
        message.success(`Added ${extracted.length} file${extracted.length === 1 ? '' : 's'} from ${file.name}`);
      } catch (error) {
        console.error('Error processing zip:', error);
        message.error(`${file.name} is not a valid zip archive`);
      }
      return;
    }
    if (isDuplicateName(file.name)) {
      message.warning(`A file named ${file.name} already exists`);
      return;
    }
    if (tooLarge(file.name, file.size)) return;
    try {
      const content = await readFileContent(file);
      updateFiles([...filesRef.current, makeFile(file.name, '', content)]);
      message.success(`Added ${file.name}`);
    } catch {
      message.error(`Failed to read ${file.name}`);
    }
  };

  // Dropped files arrive as separate beforeUpload calls; chain them so each append sees the
  // previous one's result.
  const incomingQueue = React.useRef<Promise<void>>(Promise.resolve());
  const enqueueIncoming = (file: File) => {
    incomingQueue.current = incomingQueue.current.then(() => handleIncomingFile(file));
    return false; // never let antd upload anywhere
  };

  // ---- table ------------------------------------------------------------------------------

  const visibleFiles = files.filter(isStudentVisibleFile);
  const requiredCount = visibleFiles.filter((f) => f.required).length;

  const columns: ColumnsType<EditableFile> = [
    {
      title: 'File',
      key: 'file',
      render: (_: unknown, record: EditableFile) => (
        <Space size={8}>
          <FileOutlined style={{ color: colors.actionBlue }} />
          <span style={{ fontWeight: 500 }}>{fullPathOf(record)}</span>
          {!record.data && (
            <Tooltip title="This file has no content yet. Students get an empty file unless you upload or write one.">
              <Tag color="default" style={{ marginInlineStart: 4 }}>
                Empty
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'extension',
      key: 'extension',
      width: 90,
      render: (ext: string) => <Tag color="blue">{ext.replace('.', '')}</Tag>,
    },
    {
      title: (
        <Space size={4}>
          Required
          <Tooltip title="Students must include this file when they submit.">
            <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'required',
      key: 'required',
      width: 110,
      render: (_: unknown, record: EditableFile) => (
        <Checkbox
          checked={record.required}
          aria-label={`Required: ${fullPathOf(record)}`}
          onChange={() => handleToggleRequired(record.id)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: EditableFile) => (
        <Space size={0}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewingCode({ file: record, visible: true })}
          >
            View
          </Button>
          <Upload
            accept="*/*"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleUploadCode(record.id, file);
              return false;
            }}
          >
            <Button type="link" size="small" icon={<UploadOutlined />}>
              {record.data ? 'Replace' : 'Upload'}
            </Button>
          </Upload>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openNameModal(record)}>
            Rename
          </Button>
          <Popconfirm
            title="Delete this file?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            placement="topRight"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dropZone = (
    <Upload.Dragger multiple showUploadList={false} accept="*" beforeUpload={enqueueIncoming}>
      <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">
        {visibleFiles.length === 0 ? 'No files yet. ' : ''}Click or drag files here. A <code>.zip</code> is expanded
        into its folder structure.
      </p>
      <p className="ant-upload-hint">
        Up to {formatLimit(getUploadLimits().maxAssignmentFileBytes)} per file. {DATASET_HINT}
      </p>
    </Upload.Dragger>
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Assignment Files</h3>
          <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
            {visibleFiles.length} file{visibleFiles.length === 1 ? '' : 's'} · {requiredCount} required ·{' '}
            {visibleFiles.length - requiredCount} optional. Required files must be part of every submission.
          </div>
        </div>
        <Button icon={<FileAddOutlined />} onClick={() => openNameModal(null)}>
          Add empty file
        </Button>
      </div>

      {visibleFiles.length > 0 && (
        <Table
          columns={columns}
          dataSource={visibleFiles}
          rowKey="id"
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No files" /> }}
        />
      )}

      {dropZone}

      <Modal
        title={nameModal?.editing ? `Rename ${fullPathOf(nameModal.editing)}` : 'Add empty file'}
        open={nameModal !== null}
        onCancel={() => setNameModal(null)}
        onOk={() => nameForm.submit()}
        okText={nameModal?.editing ? 'Save' : 'Add'}
        width={480}
        destroyOnHidden
      >
        {!nameModal?.editing && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            Creates a file with no content that you can fill in from <em>View</em>, for example a stub students must
            complete. To add an existing file, drop it on the panel instead.
          </Text>
        )}
        <Form form={nameForm} layout="vertical" onFinish={handleNameSubmit}>
          <Form.Item name="path" label="Directory" extra="Leave empty for the root of the assignment.">
            <Input placeholder="e.g. src" />
          </Form.Item>
          <Form.Item
            name="name"
            label="File name"
            rules={[
              { required: true, whitespace: true, message: 'Enter a file name' },
              {
                validator: (_, v: string) =>
                  v && isDuplicateName(v.trim(), nameModal?.editing?.id)
                    ? Promise.reject(new Error('A file with this name already exists'))
                    : Promise.resolve(),
              },
            ]}
          >
            <Input placeholder="e.g. main.py" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Code Viewing/Editing Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 30 }}>
            <Space size={8}>
              <CodeOutlined style={{ fontSize: 18, color: colors.actionBlue }} />
              <Text strong style={{ fontSize: 15 }}>
                {viewingCode?.file.path ? `${viewingCode.file.path}/` : ''}
                {viewingCode?.file.name}
              </Text>
              <Tag color="blue">{viewingCode?.file.extension}</Tag>
            </Space>

            {CodePostFile.isNotebookFile(viewingCode?.file) && (
              <Radio.Group
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'json' | 'notebook')}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="notebook">Notebook View</Radio.Button>
                <Radio.Button value="json">Raw JSON</Radio.Button>
              </Radio.Group>
            )}

            {previewType && (
              <Radio.Group
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'json' | 'preview')}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="preview">Preview</Radio.Button>
                <Radio.Button value="json">Raw</Radio.Button>
              </Radio.Group>
            )}
          </div>
        }
        open={viewingCode?.visible || false}
        onCancel={() => setViewingCode(null)}
        width={900}
        centered
        styles={{
          body: { padding: '24px' },
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <InfoCircleOutlined /> Changes are saved to this form only. Click "Save" on the main dialog to persist
              changes.
            </Text>
            <Space>
              <Button key="close" onClick={() => setViewingCode(null)} size="large">
                Cancel
              </Button>
              <Button
                key="save"
                type="primary"
                size="large"
                onClick={() => {
                  if (viewingCode?.file) {
                    updateFiles(files.map((f) => (f.id === viewingCode.file.id ? { ...f, data: editingCode } : f)));
                    message.success('Code updated successfully');
                    setViewingCode(null);
                  }
                }}
              >
                Save Changes
              </Button>
            </Space>
          </div>
        }
      >
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            title={
              <Text style={{ fontSize: 12 }}>
                <strong>Editor:</strong> This code will be included when students download the assignment files. Add
                TODOs, function stubs, or template code to guide students.
              </Text>
            }
            type="info"
            showIcon
            style={{ marginBottom: 8 }}
          />

          {CodePostFile.isNotebookFile(viewingCode?.file) && viewMode === 'notebook' ? (
            <NotebookEditor content={editingCode} onChange={setEditingCode} />
          ) : previewType && viewMode === 'preview' ? (
            <>
              <div
                style={{
                  height: 500,
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: previewType === 'image' ? 'center' : 'flex-start',
                  border: `1px solid ${colors.neutralBorder}`,
                  borderRadius: 6,
                  padding: 12,
                }}
              >
                {(() => {
                  const src = toPreviewSrc(editingCode, viewingCode?.file.extension || '');
                  if (!src) {
                    return (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No previewable content. Use Replace File to upload one."
                      />
                    );
                  }
                  if (previewType === 'image') {
                    return (
                      <Image
                        src={src}
                        alt={`Preview of ${viewingCode?.file.name}`}
                        style={{ maxHeight: 470, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    );
                  }
                  return (
                    <React.Suspense fallback={<Text type="secondary">Loading PDF…</Text>}>
                      <PdfPreviewLazy dataUri={src} width={780} />
                    </React.Suspense>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Upload
                  accept={previewType === 'pdf' ? '.pdf,application/pdf' : 'image/*'}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setEditingCode(e.target?.result as string);
                      message.success(`Loaded ${file.name}`);
                    };
                    reader.onerror = () => {
                      message.error('Failed to read file');
                    };
                    reader.readAsDataURL(file);
                    return false;
                  }}
                >
                  <Button size="small" icon={<UploadOutlined />}>
                    Replace File
                  </Button>
                </Upload>
              </div>
            </>
          ) : (
            <>
              <Editor
                height="500px"
                defaultLanguage={(() => {
                  const lang = getCodingLanguage(viewingCode?.file.extension || 'txt');
                  return lang;
                })()}
                value={editingCode}
                onChange={(value) => setEditingCode(value || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Lines: {(editingCode || '').split('\n').length} | Characters: {(editingCode || '').length}
                </Text>
                <Space size={8}>
                  <Button
                    size="small"
                    onClick={() => setEditingCode('')}
                    disabled={!editingCode && !viewingCode?.file.data}
                  >
                    Clear
                  </Button>
                  <Upload
                    accept="*/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const reader = new FileReader();
                      reader.onload = async (e) => {
                        let content = e.target?.result as string;
                        if (isBinaryContent(file.name, content)) {
                          content = await readAsDataUrl(file);
                        }
                        setEditingCode(content);
                        message.success(`Loaded ${file.name}`);
                      };
                      reader.readAsText(file);
                      return false;
                    }}
                  >
                    <Button size="small" icon={<UploadOutlined />}>
                      Load from File
                    </Button>
                  </Upload>
                </Space>
              </div>
            </>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default AssignmentFilesForm;
