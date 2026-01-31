import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Upload,
  Input,
  message,
  Tag,
  Typography,
  Tabs,
  Empty,
  Tooltip,
  Table,
  Space,
  Popconfirm,
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { AssignmentFile, AssignmentFileType, File as CodePostFile } from '../../../../../../infrastructure/file';
import { AssignmentDataSet, AssignmentDataSetType } from '../../../../../../infrastructure/assignmentDataSet';
import { TestCategoryResource, TestCategoryResourceType } from '../../../../../../infrastructure/testCategoryResource';
import Editor from '@monaco-editor/react';
import NotebookEditor from '../../../assignments/NotebookEditor';

const { Text } = Typography;

// Language detection from file extension
// Language detection from file extension
function getCodingLanguage(extension: string): string {
  // Map our detected extensions to Monaco editor languages if they differ
  const lang = CodePostFile.language({ name: `test.${extension}` } as any);
  if (lang === 'c++') return 'cpp';
  if (lang === 'c') return 'cpp'; // Monaco uses 'cpp' for C/C++ often
  return lang;
}

interface IProps {
  assignmentId: number;
  categoryId: number;
  resources: TestCategoryResourceType[];
  onRefresh: () => void;
}

export const TestResourceManager: React.FC<IProps> = ({ assignmentId, categoryId, resources, onRefresh }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('files');

  // Selection State (for showing in override dropdown)
  const [assignmentFiles, setAssignmentFiles] = useState<AssignmentFileType[]>([]);
  const [datasets, setDatasets] = useState<AssignmentDataSetType[]>([]);

  // New Resource State
  const [targetPath, setTargetPath] = useState('');
  const [selectedOverride, setSelectedOverride] = useState(''); // Track dropdown selection

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // View/Edit State
  const [viewingResource, setViewingResource] = useState<TestCategoryResourceType | null>(null);
  const [editingCode, setEditingCode] = useState('');
  const [viewMode, setViewMode] = useState<'json' | 'notebook'>('json');
  useEffect(() => {
    if (isAddModalOpen) {
      loadSourceOptions();
    }
  }, [isAddModalOpen, assignmentId]);

  const loadSourceOptions = async () => {
    try {
      // Fetch assignment to get embedded files
      const token = localStorage.getItem('token') || '';
      const assignmentRes = await fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignmentId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (assignmentRes.ok) {
        const assignmentData = await assignmentRes.json();
        // Assignment.files can be array of IDs or objects - we need to fetch each if ID
        const files = assignmentData.files || [];
        console.log('Assignment files field:', files);

        // If files are objects (with id and name), use them directly
        // If they're just IDs, we need to fetch each one
        if (files.length > 0 && typeof files[0] === 'object') {
          setAssignmentFiles(files);
        } else if (files.length > 0) {
          // Fetch each file by ID
          const filePromises = files.map((id: number) =>
            fetch(`${process.env.REACT_APP_API_URL}/assignmentFiles/${id}/`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then((r) => (r.ok ? r.json() : null)),
          );
          const fetchedFiles = (await Promise.all(filePromises)).filter(Boolean);
          console.log('Fetched files:', fetchedFiles);
          setAssignmentFiles(fetchedFiles);
        }
      } else {
        console.error('Failed to load assignment, status:', assignmentRes.status);
      }

      const datasetRes = await AssignmentDataSet.listByAssignment(assignmentId);
      console.log('Loaded datasets:', datasetRes);
      setDatasets(datasetRes);
    } catch (e) {
      console.error('Error loading options:', e);
      message.error('Failed to load options');
    }
  };

  const handleDeleteResource = async (id: number) => {
    try {
      // Find the resource to get file/dataset info before deleting
      const resource = resources.find((r) => r.id === id);

      // Delete the resource link first
      await TestCategoryResource.delete({ id });

      // If the underlying file/dataset is hidden, delete it too
      if (resource) {
        const fileDetails = (resource as any).file_details;
        const datasetDetails = (resource as any).dataset_details;

        if (fileDetails && fileDetails.hidden) {
          // Delete the hidden file
          try {
            await AssignmentFile.delete({ id: fileDetails.id });
          } catch (e) {
            console.warn('Failed to delete underlying file:', e);
          }
        } else if (datasetDetails && datasetDetails.hidden) {
          // Delete the hidden dataset
          try {
            await AssignmentDataSet.delete({ id: datasetDetails.id } as any);
          } catch (e) {
            console.warn('Failed to delete underlying dataset:', e);
          }
        }
      }

      message.success('Resource deleted');
      onRefresh();
    } catch (e) {
      console.error(e);
      message.error('Failed to delete resource');
    }
  };

  // Upload Handler (creates source then resource)
  const handleUploadAndCreate = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      let sourceId = 0;

      if (activeTab === 'files') {
        // Upload File
        const content = await readFileContent(uploadFile);
        if (content.indexOf('\0') !== -1) {
          message.error('Binary files must be uploaded as Datasets.');
          setIsUploading(false);
          return;
        }
        const newFile = await AssignmentFile.create({
          assignment: assignmentId,
          name: uploadFile.name,
          extension: CodePostFile.extension(uploadFile.name) || 'txt',
          path: null,
          data: content,
          hidden: true, // Default to hidden for helper files
        } as any);
        sourceId = newFile.id;
      } else {
        // Upload Dataset - handle potential duplicate names
        const baseName = uploadFile.name;
        let datasetName = baseName;

        // Fetch fresh dataset list to check for duplicates (including hidden ones)
        const freshDatasets = await AssignmentDataSet.listByAssignment(assignmentId);
        const existingDataset = freshDatasets.find((d: any) => d.name === baseName);
        if (existingDataset) {
          // Append timestamp to make name unique
          const ext = CodePostFile.extension(baseName) ? '.' + CodePostFile.extension(baseName) : '';
          const nameWithoutExt = CodePostFile.extension(baseName) ? baseName.slice(0, -(ext.length)) : baseName;
          datasetName = `${nameWithoutExt}_${Date.now()}${ext}`;
        }

        const formData = new FormData();
        formData.append('assignment', assignmentId.toString());
        formData.append('name', datasetName);
        formData.append('file', uploadFile);
        formData.append('hidden', 'true');

        const newDataset = await AssignmentDataSet.create(formData);
        sourceId = newDataset.id;
      }

      // Create Resource
      const payload: any = {
        category: categoryId,
        target_path: targetPath || uploadFile.name, // Use uploaded name as default target
        file: activeTab === 'files' ? sourceId : null,
        dataset: activeTab === 'datasets' ? sourceId : null,
      };
      await TestCategoryResource.create(payload);

      message.success('Resource uploaded and added');
      setIsAddModalOpen(false);
      resetForm();
      onRefresh();
    } catch (e: any) {
      console.error(e);
      // Try to get message from error response
      let errorMsg = 'Failed to upload/create resource';
      if (e.message) errorMsg += `: ${e.message}`;
      message.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const resetForm = () => {
    setTargetPath('');
    setUploadFile(null);
    setSelectedOverride('');
  };

  // Columns for main table
  const columns = [
    {
      title: 'Type',
      key: 'type',
      width: 80,
      render: (_: any, record: TestCategoryResourceType) =>
        record.dataset ? (
          <Tag color="purple">
            <DatabaseOutlined /> Dataset
          </Tag>
        ) : (
          <Tag color="blue">
            <FileTextOutlined /> File
          </Tag>
        ),
    },
    {
      title: 'Target Name (Alias)',
      dataIndex: 'target_path',
      key: 'target_path',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Source',
      key: 'source',
      render: (_: any, record: TestCategoryResourceType) => {
        const name = (record as any).file_details?.name || (record as any).dataset_details?.name || 'Unknown';
        const isHidden = (record as any).file_details?.hidden || (record as any).dataset_details?.hidden;
        return (
          <Space>
            <Text type="secondary">{name}</Text>
            {isHidden && (
              <Tag style={{ fontSize: 10 }} color="warning">
                Hidden
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: TestCategoryResourceType) => {
        const fileDetails = (record as any).file_details;
        return (
          <Space>
            {fileDetails && (
              <Tooltip title="View/Edit">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setViewingResource(record);
                    setEditingCode(fileDetails.data || '');
                    // Set notebook mode for .ipynb files
                    const ext = CodePostFile.extension(fileDetails.name || '') || '';
                    setViewMode(ext === 'ipynb' ? 'notebook' : 'json');
                  }}
                />
              </Tooltip>
            )}
            <Popconfirm title="Remove this resource?" onConfirm={() => handleDeleteResource(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text strong>Test Resources</Text>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
          Add Resource
        </Button>
      </div>

      <Table
        dataSource={resources}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: <Empty description="No resources configured" /> }}
        footer={() => <div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Resources are files that are used by the tests. Can be used to override files in the submission or provide additional files for the tests.
          </Typography.Text>
        </div>}
      />

      <Modal
        title="Add Test Resource"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={600}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setUploadFile(null);
            setSelectedOverride('');
          }}
          items={[
            { label: 'Files', key: 'files' },
            { label: 'Datasets', key: 'datasets' },
          ]}
        />

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section 1: Upload Source File */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              1. Upload {activeTab === 'files' ? 'File' : 'Dataset'}
            </Text>
            <Upload
              beforeUpload={(file) => {
                setUploadFile(file);
                if (!targetPath) setTargetPath(file.name); // Default target = uploaded name
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                {uploadFile ? `Selected: ${uploadFile.name}` : `Choose File to Upload`}
              </Button>
            </Upload>
          </div>

          {/* Section 2: Target Path - Override or Custom */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              2. Target Name (in test environment)
              <Tooltip
                title={`Enter the ${activeTab === 'files' ? 'filename' : 'path'} your test will see, or select an existing ${activeTab === 'files' ? 'file' : 'dataset'} to override it.`}
              >
                <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
              </Tooltip>
            </Text>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Input
                style={{ flex: 1 }}
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder={activeTab === 'files' ? 'e.g. input.txt' : 'e.g. data/input.csv'}
              />
              <Text type="secondary">or override:</Text>
              <select
                style={{ padding: 8, borderRadius: 4, border: '1px solid #d9d9d9', minWidth: 150 }}
                value={selectedOverride}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOverride(val);
                  if (val) setTargetPath(val);
                }}
              >
                <option value="">Select {activeTab === 'files' ? 'file' : 'dataset'} to override...</option>
                {(activeTab === 'files' ? assignmentFiles : datasets)
                  .filter((item) => !(item as any).hidden)
                  .map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>
            <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
              💡 To override a student {activeTab === 'files' ? 'file' : 'dataset'}, select it from the dropdown or type
              its name.
            </Text>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleUploadAndCreate}
              loading={isUploading}
              disabled={!uploadFile || !targetPath}
            >
              Upload & Add
            </Button>
          </div>
        </div>
      </Modal>

      {/* View/Edit Resource Modal */}
      <Modal
        open={!!viewingResource}
        title={
          <Space>
            <span>Edit: {(viewingResource as any)?.file_details?.name}</span>
            <Tag color="blue">{viewingResource?.target_path}</Tag>
          </Space>
        }
        width="90%"
        style={{ top: 20, paddingBottom: 0 }}
        styles={{
          body: { height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        }}
        onCancel={() => setViewingResource(null)}
        footer={[
          <Button key="cancel" onClick={() => setViewingResource(null)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={async () => {
              if (viewingResource) {
                const fileDetails = (viewingResource as any).file_details;
                if (fileDetails) {
                  try {
                    await AssignmentFile.update({
                      id: fileDetails.id,
                      data: editingCode,
                    } as any);
                    message.success('File saved');
                    setViewingResource(null);
                    onRefresh();
                  } catch (e) {
                    console.error(e);
                    message.error('Failed to save file');
                  }
                }
              }
            }}
          >
            Save Changes
          </Button>,
        ]}
      >
        <div style={{ flex: 1, minHeight: 0, border: '1px solid #d9d9d9', borderRadius: 4 }}>
          {(() => {
            const fileDetails = (viewingResource as any)?.file_details;
            const ext = CodePostFile.extension(fileDetails?.name || '') || 'txt';
            const isNotebook = ext === 'ipynb';

            if (isNotebook && viewMode === 'notebook') {
              return <NotebookEditor content={editingCode} onChange={setEditingCode} height="100%" />;
            }

            return (
              <Editor
                height="100%"
                defaultLanguage={getCodingLanguage(ext)}
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
            );
          })()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Lines: {(editingCode || '').split('\n').length} | Characters: {(editingCode || '').length}
          </Text>
          <Space size={8}>
            {(() => {
              const fileDetails = (viewingResource as any)?.file_details;
              const ext = CodePostFile.extension(fileDetails?.name || '') || '';
              if (ext === 'ipynb') {
                return (
                  <Button size="small" onClick={() => setViewMode(viewMode === 'notebook' ? 'json' : 'notebook')}>
                    {viewMode === 'notebook' ? 'View JSON' : 'View Notebook'}
                  </Button>
                );
              }
              return null;
            })()}
            <Button size="small" onClick={() => setEditingCode('')} disabled={!editingCode}>
              Clear
            </Button>
            <Upload
              accept="*/*"
              showUploadList={false}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  setEditingCode(e.target?.result as string);
                  message.success(`Loaded from ${file.name}`);
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
      </Modal>
    </div>
  );
};
