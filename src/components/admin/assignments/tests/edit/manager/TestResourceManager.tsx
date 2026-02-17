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
import {
  assignmentDataSetsApi,
  assignmentFilesApi,
  assignmentsApi,
  testCategoryResourcesApi,
} from '../../../../../../api-client/clients';
import { getAuthToken } from '../../../../../../utils/auth';
import { loadIDList } from '../../../../../../utils/generics';
import { AssignmentDataSetType, AssignmentFileType, TestCategoryResourceType } from '../../../../../../types/models';
import { File as CodePostFile } from '../../../../../../utils/file';
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
      const assignmentData = await assignmentsApi.retrieve({ id: assignmentId });
      const files = await loadIDList(assignmentData.files || [], {
        read: (id: number) => assignmentFilesApi.retrieve({ id }),
      });
      setAssignmentFiles(files);

      const datasetRes = await assignmentsApi.datasetsList({ id: assignmentId });
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
      await testCategoryResourcesApi.destroy({ id });

      // If the underlying file/dataset is hidden, delete it too
      if (resource) {
        const fileDetails = (resource as any).fileDetails ?? (resource as any).file_details;
        const datasetDetails = (resource as any).datasetDetails ?? (resource as any).dataset_details;

        if (fileDetails && fileDetails.hidden) {
          // Delete the hidden file
          try {
            await assignmentFilesApi.destroy({ id: fileDetails.id });
          } catch (e) {
            console.warn('Failed to delete underlying file:', e);
          }
        } else if (datasetDetails && datasetDetails.hidden) {
          // Delete the hidden dataset
          try {
            await assignmentDataSetsApi.destroy({ id: datasetDetails.id });
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
        const newFile = await assignmentFilesApi.create({
          assignmentFile: {
            assignment: assignmentId,
            name: uploadFile.name,
            extension: CodePostFile.extension(uploadFile.name) || 'txt',
            path: null,
            data: content,
            hidden: true, // Default to hidden for helper files
          },
        });
        sourceId = newFile.id;
      } else {
        // Upload Dataset - handle potential duplicate names
        const baseName = uploadFile.name;
        let datasetName = baseName;

        // Fetch fresh dataset list to check for duplicates (including hidden ones)
        const freshDatasets = await assignmentsApi.datasetsList({ id: assignmentId });
        const existingDataset = (freshDatasets as any[]).find((d: any) => d.name === baseName);
        if (existingDataset) {
          // Append timestamp to make name unique
          const ext = CodePostFile.extension(baseName) ? '.' + CodePostFile.extension(baseName) : '';
          const nameWithoutExt = CodePostFile.extension(baseName) ? baseName.slice(0, -ext.length) : baseName;
          datasetName = `${nameWithoutExt}_${Date.now()}${ext}`;
        }

        const formData = new FormData();
        formData.append('assignment', assignmentId.toString());
        formData.append('name', datasetName);
        formData.append('file', uploadFile);
        formData.append('hidden', 'true');

        const token = getAuthToken();
        const response = await fetch(`${process.env.REACT_APP_API_URL}/assignmentDataSets/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create dataset: ${response.statusText} - ${errorText}`);
        }

        const newDataset = await response.json();
        sourceId = newDataset.id;
      }

      // Create Resource
      const payload: any = {
        category: categoryId,
        targetPath: targetPath || uploadFile.name, // Use uploaded name as default target
        file: activeTab === 'files' ? sourceId : null,
        dataset: activeTab === 'datasets' ? sourceId : null,
      };
      await testCategoryResourcesApi.create({
        testCategoryResource: payload,
      });

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
      dataIndex: 'targetPath',
      key: 'targetPath',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Source',
      key: 'source',
      render: (_: any, record: TestCategoryResourceType) => {
        const fileDetails = (record as any).fileDetails ?? (record as any).file_details;
        const datasetDetails = (record as any).datasetDetails ?? (record as any).dataset_details;
        const name = fileDetails?.name || datasetDetails?.name || 'Unknown';
        return (
          <Space>
            <Text type="secondary">{name}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: TestCategoryResourceType) => {
        const fileDetails = (record as any).fileDetails ?? (record as any).file_details;
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
        footer={() => (
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Resources are files that are used by the tests. Can be used to override files in the submission or provide
              additional files for the tests.
            </Typography.Text>
          </div>
        )}
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
            <Tag color="blue">{viewingResource?.targetPath}</Tag>
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
                    await assignmentFilesApi.partialUpdate({
                      id: fileDetails.id,
                      patchedAssignmentFile: { data: editingCode },
                    });
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
            const fileDetails = (viewingResource as any)?.fileDetails ?? (viewingResource as any)?.file_details;
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
              const fileDetails = (viewingResource as any)?.fileDetails ?? (viewingResource as any)?.file_details;
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
