/**********************************************************************************************************************/
/* AssignmentFilesForm - Improved form component for managing assignment files
/**********************************************************************************************************************/

import {
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import {
  Alert,
  Button,
  Checkbox,
  Empty,
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
  Radio, // Added Radio
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import JSZip from 'jszip';
import * as React from 'react';
import { colors } from '../../../../theme/colors';
import { AssignmentFileType } from '../../../../infrastructure/file';
import NotebookEditor from './NotebookEditor'; // Added import

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
  const ext = extension.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'rb':
      return 'ruby';
    case 'go':
      return 'go';
    case 'php':
      return 'php';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'ipynb':
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'sh':
      return 'shell';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'rs':
      return 'rust';
    case 'dart':
      return 'dart';
    case 'r':
      return 'r';
    case 'm':
    case 'mm':
      return 'objective-c';
    case 'sql':
      return 'sql';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'md':
      return 'markdown';
    case 'txt':
      return 'plaintext';
    default:
      return 'plaintext'; // Default to plain text for unknown extensions
  }
}

const AssignmentFilesForm: React.FC<AssignmentFilesFormProps> = ({ value = [], onChange, assignmentId }) => {
  const [files, setFiles] = React.useState<EditableFile[]>(value);
  const [newFileName, setNewFileName] = React.useState('');
  const [newFilePath, setNewFilePath] = React.useState('');
  const [viewingCode, setViewingCode] = React.useState<{ file: EditableFile; visible: boolean } | null>(null);
  const [editingCode, setEditingCode] = React.useState<string>('');
  const [viewMode, setViewMode] = React.useState<'json' | 'notebook'>('json');

  // Update internal state when external value changes
  React.useEffect(() => {
    setFiles(value);
  }, [value]);

  // Initialize editing code when modal opens
  React.useEffect(() => {
    if (viewingCode?.file) {
      setEditingCode(viewingCode.file.data || '');
      if (viewingCode.file.extension === 'ipynb') {
        setViewMode('notebook');
      } else {
        setViewMode('json');
      }
    }
  }, [viewingCode]);

  // Notify parent of changes
  const updateFiles = (updatedFiles: EditableFile[]) => {
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
  };

  // Add a new file
  const handleAddFile = () => {
    if (!newFileName.trim()) {
      return;
    }

    // Extract extension from filename
    const parts = newFileName.split('.');
    const extension = parts.length > 1 ? parts[parts.length - 1] : 'txt';

    // Generate a temporary negative ID for new files
    const newId = -1 * (files.length + Date.now());

    const newFile: EditableFile = {
      id: newId,
      name: newFileName.trim(),
      extension,
      path: newFilePath.trim(),
      required: false,
      assignment: assignmentId || files[0]?.assignment || 0,
      data: '',
      created: new Date().toISOString(),
      description: '',
    };

    updateFiles([...files, newFile]);
    setNewFileName('');
    setNewFilePath('');
  };

  // Delete a file
  const handleDelete = (id: number) => {
    updateFiles(files.filter((file) => file.id !== id));
  };

  // Toggle required status
  const handleToggleRequired = (id: number) => {
    updateFiles(files.map((file) => (file.id === id ? { ...file, required: !file.required } : file)));
  };

  // Upload code for a file
  const handleUploadCode = (id: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      updateFiles(files.map((f) => (f.id === id ? { ...f, data: content } : f)));
      message.success(`Uploaded code for ${file.name}`);
    };
    reader.onerror = () => {
      message.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  // Start editing a file name/path
  const handleEdit = (id: number) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      Modal.confirm({
        title: 'Edit File Path',
        content: (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text>Directory (leave empty for root):</Text>
              <Input id="edit-path-input" placeholder="e.g., src or tests/unit" defaultValue={file.path || ''} />
            </div>
            <div>
              <Text>File name:</Text>
              <Input id="edit-name-input" placeholder="e.g., main.py" defaultValue={file.name} />
            </div>
          </Space>
        ),
        onOk: () => {
          const pathInput = document.getElementById('edit-path-input') as HTMLInputElement;
          const nameInput = document.getElementById('edit-name-input') as HTMLInputElement;
          const newPath = pathInput?.value.trim() || '';
          const newName = nameInput?.value.trim();

          if (newName) {
            const parts = newName.split('.');
            const extension = parts.length > 1 ? parts[parts.length - 1] : 'txt';
            updateFiles(files.map((f) => (f.id === id ? { ...f, name: newName, path: newPath, extension } : f)));
          }
        },
      });
    }
  };

  // Handle bulk upload (single file or zip)
  const handleBulkUpload = async (file: File) => {
    const isZip = file.name.endsWith('.zip');

    if (isZip) {
      // Handle zip file
      try {
        const zip = await JSZip.loadAsync(file);
        const newFiles: EditableFile[] = [];
        let processedCount = 0;

        // Process each file in the zip
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          // Skip directories and hidden files
          if (zipEntry.dir || relativePath.startsWith('__MACOSX') || relativePath.includes('/.')) {
            continue;
          }

          const pathParts = relativePath.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const directory = pathParts.slice(0, -1).join('/');

          // Get extension
          const nameParts = fileName.split('.');
          const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'txt';

          // Read file content
          const content = await zipEntry.async('text');

          // Generate ID
          // eslint-disable-next-line react-hooks/purity
          const newId = -1 * (files.length + newFiles.length + Date.now() + processedCount);

          newFiles.push({
            id: newId,
            name: fileName,
            extension,
            path: directory,
            required: false,
            assignment: assignmentId || files[0]?.assignment || 0,
            data: content,
            created: new Date().toISOString(),
            description: '',
          });

          processedCount++;
        }

        if (newFiles.length > 0) {
          updateFiles([...files, ...newFiles]);
          message.success(`Extracted ${newFiles.length} files from ${file.name}`);
        } else {
          message.warning('No valid files found in zip');
        }
      } catch (error) {
        console.error('Error processing zip:', error);
        message.error('Failed to process zip file');
      }
    } else {
      // check if file name already exists
      if (isDuplicateName(file.name)) {
        message.warning(`File with name ${file.name} already exists`);
        return;
      }

      // Handle single file upload
      const nameParts = file.name.split('.');
      const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'txt';

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newId = -1 * (files.length + Date.now());

        const newFile: EditableFile = {
          id: newId,
          name: file.name,
          extension,
          path: '',
          required: false,
          assignment: assignmentId || files[0]?.assignment || 0,
          data: content,
          created: new Date().toISOString(),
          description: '',
        };

        updateFiles([...files, newFile]);
        message.success(`Added ${file.name} with code`);
      };
      reader.onerror = () => {
        message.error('Failed to read file');
      };
      reader.readAsText(file);
    }

    return false; // Prevent default upload behavior
  };

  // Check if a file name already exists
  const isDuplicateName = (name: string, excludeId?: number): boolean => {
    return files.some((file) => file.name.toLowerCase() === name.toLowerCase() && file.id !== excludeId);
  };

  const columns: ColumnsType<EditableFile> = [
    {
      title: <Text strong>File Path</Text>,
      dataIndex: 'path',
      key: 'path',
      width: '35%',
      render: (path: string, record: EditableFile) => {
        const fullPath = path ? `${path}/${record.name}` : record.name;
        return (
          <Space size={8}>
            {path && (
              <Tooltip title={`Directory: ${path}`}>
                <FolderOutlined style={{ color: '#faad14', fontSize: 16 }} />
              </Tooltip>
            )}
            <FileOutlined style={{ color: colors.actionBlue, fontSize: 16 }} />
            <Text strong style={{ fontSize: 13 }}>
              {fullPath}
            </Text>
            <Tooltip title="Edit path/name">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record.id)}
                style={{ marginLeft: 4 }}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: <Text strong>Type</Text>,
      dataIndex: 'extension',
      key: 'extension',
      width: '10%',
      align: 'center',
      render: (ext: string) => (
        <Tag color="blue" style={{ fontSize: 12 }}>
          .{ext}
        </Tag>
      ),
    },
    {
      title: <Text strong>File</Text>,
      key: 'data',
      width: '20%',
      align: 'center',
      render: (_: unknown, record: EditableFile) => (
        <Space size={6}>
          <Upload
            accept="*/*"
            showUploadList={false}
            beforeUpload={(file) => {
              handleUploadCode(record.id, file);
              return false;
            }}
          >
            <Tooltip title={record.data ? 'Replace file' : 'Upload file'}>
              <Button size="small" icon={<UploadOutlined />} type={record.data ? 'default' : 'primary'}>
                {record.data ? 'Replace' : 'Upload'}
              </Button>
            </Tooltip>
          </Upload>
          {record.data && (
            <Tooltip title="View and edit">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setViewingCode({ file: record, visible: true })}
              >
                View
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: (
        <Space size={4}>
          <Text strong>Required</Text>
          <Tooltip title="Students must include these files when submitting their completed work">
            <InfoCircleOutlined style={{ color: '#8c8c8c', cursor: 'help' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'required',
      key: 'required',
      width: '15%',
      align: 'center',
      render: (_: unknown, record: EditableFile) => (
        <Checkbox checked={record.required} onChange={() => handleToggleRequired(record.id)}></Checkbox>
      ),
    },
    {
      title: <Text strong>Actions</Text>,
      key: 'actions',
      width: '10%',
      align: 'center',
      render: (_: unknown, record: EditableFile) => (
        <Popconfirm
          title="Delete this file?"
          description="This action cannot be undone."
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          placement="topRight"
        >
          <Tooltip title="Delete file">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
      {/* Header Section */}
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(to right, #f0f5ff, #ffffff)',
          borderBottom: '1px solid #d9d9d9',
        }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space size={12}>
            <FileOutlined style={{ fontSize: 18, color: colors.actionBlue }} />
            <Text strong style={{ fontSize: 16 }}>
              Assignment Files
            </Text>
            <Tag color="blue" style={{ fontSize: 13 }}>
              {files.length} {files.length === 1 ? 'file' : 'files'}
            </Tag>
            <Space size={24} style={{ marginLeft: 30 }}>
              <div>
                <Tag color="success" style={{ marginRight: 6 }}>
                  {files.filter((f) => f.required).length} Required
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Must be submitted
                </Text>
              </div>
              <div>
                <Tag color="default" style={{ marginRight: 6 }}>
                  {files.filter((f) => !f.required).length} Optional
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Can be submitted
                </Text>
              </div>
            </Space>
          </Space>
        </Space>
      </div>

      {/* Table Section */}
      <div>
        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          pagination={false}
          size="middle"
          style={{ marginBottom: 0, minHeight: 200 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div style={{ padding: '32px 0' }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      No Assignment files yet. Add files that students will download to begin the assignment.
                    </Text>
                  </div>
                }
              />
            ),
          }}
        />
      </div>

      {/* Footer Section */}
      <div
        style={{
          padding: '20px 24px',
          background: '#fafafa',
          borderTop: '1px solid #e8e8e8',
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {/* Bulk Upload Section */}
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Bulk Upload
            </Text>
            <div
              style={{
                padding: '16px',
                background: 'white',
                border: '1px dashed #d9d9d9',
                borderRadius: 6,
                textAlign: 'center',
              }}
            >
              <Space direction="vertical" size={8}>
                <Upload accept="*" showUploadList={false} beforeUpload={handleBulkUpload} multiple={false}>
                  <Button icon={<UploadOutlined />} size="large" type="dashed">
                    Upload File or Zip Archive
                  </Button>
                </Upload>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Upload a single file, or a .zip archive containing your entire project structure. Maximum file size is
                  3MB.
                </Text>
              </Space>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#d9d9d9' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              OR
            </Text>
            <div style={{ flex: 1, height: 1, background: '#d9d9d9' }} />
          </div>
          {/* Manual Add Section */}
          <div>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Add Individual File
            </Text>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="Directory (e.g., src or tests/unit)"
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                style={{ width: '30%' }}
                prefix={<FolderOutlined style={{ color: '#8c8c8c' }} />}
                size="large"
              />
              <Input
                placeholder="File name (e.g., main.py)"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onPressEnter={handleAddFile}
                style={{ width: '50%' }}
                size="large"
                status={newFileName.trim() && isDuplicateName(newFileName.trim()) ? 'error' : undefined}
                suffix={
                  newFileName.trim() && isDuplicateName(newFileName.trim()) ? (
                    <Tooltip title="A file with this name already exists">
                      <Text type="danger" style={{ fontSize: 12 }}>
                        Duplicate
                      </Text>
                    </Tooltip>
                  ) : null
                }
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddFile}
                disabled={!newFileName.trim() || isDuplicateName(newFileName.trim())}
                size="large"
                style={{ minWidth: 120 }}
              >
                Add File
              </Button>
            </Space.Compact>
          </div>
        </Space>
      </div>

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

            {viewingCode?.file.extension === 'ipynb' && (
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
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            message={
              <Text style={{ fontSize: 12 }}>
                <strong>Editor:</strong> This code will be included when students download the assignment files. Add
                TODOs, function stubs, or template code to guide students.
              </Text>
            }
            type="info"
            showIcon
            style={{ marginBottom: 8 }}
          />

          {viewingCode?.file.extension === 'ipynb' && viewMode === 'notebook' ? (
            <NotebookEditor content={editingCode} onChange={setEditingCode} />
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
                      reader.onload = (e) => {
                        const content = e.target?.result as string;
                        setEditingCode(content);
                        message.success(`Loaded code from ${file.name}`);
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
