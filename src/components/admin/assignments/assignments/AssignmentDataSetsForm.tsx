import { DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Space, Switch, Table, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import * as React from 'react';
import { AssignmentDataSet, AssignmentDataSetType } from '../../../../infrastructure/assignmentDataSet';

interface IProps {
  assignmentId: number;
  datasets: AssignmentDataSetType[];
  onDatasetsChange: () => void;
}

const AssignmentDataSetsForm: React.FC<IProps> = ({ assignmentId, datasets, onDatasetsChange }) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [fileList, setFileList] = React.useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    setFileList([]);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFileList([]);
  };

  const handleUpload = async (values: {
    name: string;
    description?: string;
    mount_path?: string;
    is_active?: boolean;
  }) => {
    if (fileList.length === 0) {
      message.error('Please select a file');
      return;
    }

    const file = fileList[0].originFileObj;
    if (!file) {
      message.error('File object is not available');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('assignment', assignmentId.toString());
      formData.append('name', values.name);
      if (values.description) {
        formData.append('description', values.description);
      }
      if (values.mount_path) {
        formData.append('mount_path', values.mount_path);
      }
      formData.append('is_active', values.is_active !== false ? 'true' : 'false');
      formData.append('file', file);

      await AssignmentDataSet.create(formData);
      message.success('Dataset uploaded successfully');
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      onDatasetsChange();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Failed to upload dataset: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (datasetId: number) => {
    Modal.confirm({
      title: 'Delete Dataset',
      content: 'Are you sure you want to delete this dataset? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await AssignmentDataSet.delete({ id: datasetId });
          message.success('Dataset deleted successfully');
          onDatasetsChange();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          message.error(`Failed to delete dataset: ${errorMessage}`);
        }
      },
    });
  };

  const handleDownload = (dataset: AssignmentDataSetType) => {
    window.open(AssignmentDataSet.downloadUrl(dataset.id), '_blank');
  };

  const handleToggleActive = async (dataset: AssignmentDataSetType, checked: boolean) => {
    try {
      await AssignmentDataSet.update({ id: dataset.id, is_active: checked });
      message.success(`Dataset ${checked ? 'activated' : 'deactivated'}`);
      onDatasetsChange();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Failed to update dataset: ${errorMessage}`);
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: AssignmentDataSetType) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Mount Path',
      dataIndex: 'mount_path',
      key: 'mount_path',
      render: (path: string) => <code style={{ fontSize: '12px' }}>{path || 'shared/<name>'}</code>,
    },
    {
      title: 'File',
      key: 'file',
      render: (_: unknown, record: AssignmentDataSetType) => (
        <div>
          <div style={{ fontSize: '12px' }}>{record.file_name || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>{formatFileSize(record.file_size)}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: AssignmentDataSetType) => (
        <Switch
          checked={isActive}
          size="small"
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: AssignmentDataSetType) => (
        <Space>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
            Download
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0 }}>Assignment Datasets</h4>
          <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
            Large files (e.g., training data) that will be automatically mounted when executing student code.
          </div>
        </div>
        <Button type="primary" icon={<UploadOutlined />} onClick={showModal}>
          Upload Dataset
        </Button>
      </div>

      {datasets.length > 0 ? (
        <Table columns={columns} dataSource={datasets} rowKey="id" pagination={false} size="small" />
      ) : (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: '#fafafa',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
          }}
        >
          <p style={{ color: '#888', margin: 0 }}>
            No datasets uploaded yet. Upload a dataset to make it available during code execution.
          </p>
        </div>
      )}

      <Modal
        title="Upload Dataset"
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={() => form.submit()}
        confirmLoading={uploading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          initialValues={{
            is_active: true,
          }}
        >
          <Form.Item
            name="name"
            label="Dataset Name"
            rules={[
              { required: true, message: 'Please enter a dataset name' },
              { max: 64, message: 'Name must be 64 characters or less' },
            ]}
          >
            <Input placeholder="e.g., MNIST Training Data" />
          </Form.Item>

          <Form.Item name="description" label="Description" extra="Optional description of what this dataset contains">
            <Input.TextArea rows={3} placeholder="e.g., 60,000 training images for digit recognition" />
          </Form.Item>

          <Form.Item
            name="mount_path"
            label="Mount Path"
            extra={
              <div>
                Path where the dataset will be accessible in code execution containers.
                <br />
                Default: <code>shared/&lt;dataset_name&gt;</code>
              </div>
            }
          >
            <Input placeholder="e.g., shared/mnist or shared/data/train" />
          </Form.Item>

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item label="File" extra="Maximum file size: 1 GB">
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                // Check file size (1GB limit)
                const maxSize = 1024 * 1024 * 1024; // 1GB in bytes
                if (file.size > maxSize) {
                  message.error('File size exceeds 1 GB limit');
                  return Upload.LIST_IGNORE;
                }

                // Store the file with originFileObj set
                const uploadFile: UploadFile = {
                  uid: file.uid || `${Date.now()}`,
                  name: file.name,
                  status: 'done',
                  size: file.size,
                  type: file.type,
                  originFileObj: file,
                };
                setFileList([uploadFile]);

                // Auto-populate name field with filename if empty
                if (!form.getFieldValue('name')) {
                  form.setFieldsValue({ name: file.name });
                }

                return false; // Prevent automatic upload
              }}
              onRemove={() => {
                setFileList([]);
              }}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <div
            style={{
              background: '#e6f7ff',
              border: '1px solid #91d5ff',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '16px',
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 8 }}>💡 How datasets work:</div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px' }}>
              <li>Datasets are automatically mounted when students' code is executed</li>
              <li>
                Files are accessible at the specified mount path (e.g., <code>shared/mnist/file.csv</code>)
              </li>
              <li>Same path works in both development and execution environments</li>
              <li>Students can access via relative path in their code</li>
            </ul>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AssignmentDataSetsForm;
