// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useState, useEffect } from 'react';
import { Button, Checkbox, List, Modal, Upload, Input, message, Tag, Typography, Tabs, Empty } from 'antd';
import { UploadOutlined, FileTextOutlined, InfoCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { assignmentFilesApi, assignmentsApi } from '../../../../../../api-client/clients';
import { getAuthToken } from '../../../../../../utils/auth';
import { AssignmentDataSetType, AssignmentFileType } from '../../../../../../types/models';

const { Text } = Typography;

interface IProps {
  assignmentId: number;
  assignmentFiles: AssignmentFileType[];
  selectedByIds: number[];
  onChange: (ids: number[]) => void;
  onRefreshFiles: () => void;
}

export const HelperFileSelector: React.FC<IProps> = ({
  assignmentId,
  assignmentFiles,
  selectedByIds,
  onChange,
  onRefreshFiles,
}) => {
  const [activeTab, setActiveTab] = useState('files');
  const [datasets, setDatasets] = useState<AssignmentDataSetType[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);

  // File Upload State
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileHidden, setUploadFileHidden] = useState(true);
  const [isFileUploading, setIsFileUploading] = useState(false);

  // Dataset Upload State
  const [isDatasetUploadOpen, setIsDatasetUploadOpen] = useState(false);
  const [uploadDatasetFile, setUploadDatasetFile] = useState<File | null>(null);
  const [uploadDatasetName, setUploadDatasetName] = useState('');
  const [uploadDatasetHidden, setUploadDatasetHidden] = useState(true);
  const [isDatasetUploading, setIsDatasetUploading] = useState(false);

  // Fetch Datasets
  const fetchDatasets = async () => {
    setIsLoadingDatasets(true);
    try {
      const res = await assignmentsApi.datasetsList({ id: assignmentId });
      setDatasets(res);
    } catch (e) {
      console.error(e);
      // message.error("Failed to load datasets"); // suppressing to avoid noise
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'datasets') {
      fetchDatasets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, activeTab]);

  const handleToggleFile = (id: number) => {
    const newSelected = selectedByIds.includes(id) ? selectedByIds.filter((i) => i !== id) : [...selectedByIds, id];
    onChange(newSelected);
  };

  // --- File Upload Handlers ---
  const handleOpenFileUpload = () => {
    setUploadFile(null);
    setUploadFileName('');
    setUploadFileHidden(true);
    setIsFileUploadOpen(true);
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setIsFileUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (content.indexOf('\0') !== -1) {
          message.error('Binary files are not supported as Helper Files (must be text). Upload as Dataset instead.');
          setIsFileUploading(false);
          return;
        }
        const parts = uploadFileName.split('.');
        const ext = parts.length > 1 ? parts[parts.length - 1] : 'txt';

        const newFile = await assignmentFilesApi.create({
          assignmentFile: {
            assignment: assignmentId,
            name: uploadFileName,
            extension: ext,
            path: null,
            data: content,
            hidden: uploadFileHidden,
          },
        });

        message.success('Helper file uploaded');
        setIsFileUploadOpen(false);
        onRefreshFiles();
        onChange([...selectedByIds, newFile.id]);
      } catch (err) {
        console.error(err);
        message.error('Failed to upload file');
      } finally {
        setIsFileUploading(false);
      }
    };
    reader.readAsText(uploadFile);
  };

  // --- Dataset Upload Handlers ---
  const handleOpenDatasetUpload = () => {
    setUploadDatasetFile(null);
    setUploadDatasetName('');
    setUploadDatasetHidden(true);
    setIsDatasetUploadOpen(true);
  };

  const handleDatasetUpload = async () => {
    if (!uploadDatasetFile) return;
    setIsDatasetUploading(true);
    try {
      const formData = new FormData();
      formData.append('assignment', assignmentId.toString());
      formData.append('name', uploadDatasetName);
      formData.append('file', uploadDatasetFile);
      if (uploadDatasetHidden) formData.append('hidden', 'true');

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

      await response.json();
      message.success('Dataset uploaded');
      setIsDatasetUploadOpen(false);
      fetchDatasets();
    } catch (e) {
      console.error(e);
      message.error('Failed to upload dataset');
    } finally {
      setIsDatasetUploading(false);
    }
  };

  const renderFilesTab = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button size="small" type="primary" icon={<UploadOutlined />} onClick={handleOpenFileUpload}>
          Upload Helper
        </Button>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
        <List
          size="small"
          dataSource={assignmentFiles}
          locale={{ emptyText: 'No files found' }}
          renderItem={(item) => {
            const isSelected = selectedByIds.includes(item.id);
            return (
              <List.Item
                onClick={() => handleToggleFile(item.id)}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? '#e6f7ff' : 'transparent',
                  transition: 'background 0.2s',
                  padding: '8px 12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Checkbox checked={isSelected} style={{ marginRight: 10 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <span style={{ marginRight: 8 }}>{item.name}</span>
                    {((item as unknown as { hidden?: boolean }).hidden ?? false) && (
                      <Tag color="warning" style={{ fontSize: 10, lineHeight: '18px', padding: '0 4px' }}>
                        Hidden
                      </Tag>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
        <InfoCircleOutlined /> Selected files will overwrite student files with the same name.
      </div>
    </>
  );

  const renderDatasetsTab = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button size="small" icon={<UploadOutlined />} onClick={handleOpenDatasetUpload}>
          Upload Dataset
        </Button>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
        <List
          size="small"
          dataSource={datasets}
          loading={isLoadingDatasets}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No datasets" /> }}
          renderItem={(item) => (
            <List.Item style={{ padding: '8px 12px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <DatabaseOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                <span style={{ marginRight: 8, fontWeight: 500 }}>{item.name}</span>
                {((item as unknown as { hidden?: boolean }).hidden ?? false) && (
                  <Tag color="warning" style={{ fontSize: 10, lineHeight: '18px', padding: '0 4px' }}>
                    Hidden
                  </Tag>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#999' }}>
                  {item.mountPath || `shared/${item.name}`}
                </span>
              </div>
            </List.Item>
          )}
        />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
        <InfoCircleOutlined /> Datasets are mounted at the specified path.
      </div>
    </>
  );

  return (
    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fff' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        items={[
          { label: 'Helper Files (Overrides)', key: 'files', children: renderFilesTab() },
          { label: 'Datasets (Reference)', key: 'datasets', children: renderDatasetsTab() },
        ]}
      />

      {/* File Upload Modal */}
      <Modal
        title="Upload Helper File"
        open={isFileUploading || isFileUploadOpen}
        onCancel={() => setIsFileUploadOpen(false)}
        onOk={handleFileUpload}
        confirmLoading={isFileUploading}
        okText="Upload & Select"
        okButtonProps={{ disabled: !uploadFile }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong>File (Text Only)</Text>
            <Upload
              beforeUpload={(file) => {
                setUploadFile(file);
                setUploadFileName(file.name);
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} style={{ width: '100%', marginTop: 8 }}>
                {uploadFile ? uploadFile.name : 'Select File'}
              </Button>
            </Upload>
          </div>
          {uploadFile && (
            <>
              <div>
                <Text strong>Name</Text>
                <Input
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
              <Checkbox checked={uploadFileHidden} onChange={(e) => setUploadFileHidden(e.target.checked)}>
                Mark as Hidden
              </Checkbox>
            </>
          )}
        </div>
      </Modal>

      {/* Dataset Upload Modal */}
      <Modal
        title="Upload Dataset"
        open={isDatasetUploading || isDatasetUploadOpen}
        onCancel={() => setIsDatasetUploadOpen(false)}
        onOk={handleDatasetUpload}
        confirmLoading={isDatasetUploading}
        okText="Upload Dataset"
        okButtonProps={{ disabled: !uploadDatasetFile }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong>File (Binary allowed)</Text>
            <Upload
              beforeUpload={(file) => {
                setUploadDatasetFile(file);
                setUploadDatasetName(file.name.split('.')[0]); // Auto-name from file
                return false;
              }}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} style={{ width: '100%', marginTop: 8 }}>
                {uploadDatasetFile ? uploadDatasetFile.name : 'Select File'}
              </Button>
            </Upload>
          </div>
          {uploadDatasetFile && (
            <>
              <div>
                <Text strong>Dataset Name</Text>
                <Input
                  value={uploadDatasetName}
                  onChange={(e) => setUploadDatasetName(e.target.value)}
                  style={{ marginTop: 8 }}
                />
              </div>
              <Checkbox checked={uploadDatasetHidden} onChange={(e) => setUploadDatasetHidden(e.target.checked)}>
                Mark as Hidden
              </Checkbox>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
