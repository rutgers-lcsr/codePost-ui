// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  InboxOutlined,
  LoadingOutlined,
  ScissorOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Radio,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { RcFile } from 'antd/es/upload/interface';
import * as React from 'react';
import { assignmentDataSetsApi } from '../../../../api-client/clients';
import { getAuthToken } from '../../../../utils/auth';
import { apiErrorMessageAsync, responseErrorMessage } from '../../../../lib/apiError';
import { formatLimit, getUploadLimits } from '../../../../lib/uploadLimits';
import { AssignmentDataSetType } from '../../../../types/models';
import { useAssignmentCapabilities } from '../../../../stores/usePermissionsStore';

// MAX_DATASET_SIZE on the API, via /system/uploadLimits/ (1 GB by default).
const maxDatasetBytes = () => getUploadLimits().maxDatasetBytes;

/** Default mount path for a file name, mirroring AssignmentDataSet.save() on the API. */
export const defaultMountPath = (name: string): string => {
  const safe = name
    .toLowerCase()
    .replace(/ /g, '_')
    .replace(/[^a-z0-9_\-.]/g, '');
  return `shared/${safe}`;
};

// Every codePost image has the shared folder at /shared, reachable as ~/shared (the codepost
// user's home), ./shared (the /work working dir) and /srv/shared (the JupyterHub convention).
// The relative spellings are one mount; an absolute path is never rewritten and binds exactly
// where typed. Mirrors core/services/mount_paths.py on the API — keep the two in step.
const SHARED_PREFIXES = ['~/shared/', './shared/', 'shared/'];

/** Stored form of a mount path: the relative spellings of the shared folder become `shared/<rest>`. */
export const normalizeMountPath = (mountPath: string | undefined): string => {
  const p = (mountPath ?? '').trim();
  if (p === '.' || p === '~') return `${p}/`;
  for (const prefix of SHARED_PREFIXES) {
    if (p.startsWith(prefix)) return `shared/${p.slice(prefix.length)}`;
    if (p === prefix.slice(0, -1)) return 'shared/';
  }
  return p;
};

/** Absolute path the file binds to inside the container, mirroring the executor's resolution. */
export const containerPath = (mountPath: string | undefined, name: string): string => {
  let path = normalizeMountPath(mountPath) || defaultMountPath(name);
  if (path.endsWith('/')) path = path + name;
  if (path.startsWith('./')) return `/work${path.slice(1)}`;
  if (path.startsWith('~/')) return `/home/codepost${path.slice(1)}`;
  if (path.startsWith('/')) return path;
  if (path.startsWith('shared/')) path = path.slice('shared/'.length);
  return `/shared/${path}`;
};

const isSharedRelative = (mountPath: string | undefined): boolean => {
  const stored = normalizeMountPath(mountPath);
  return stored === '' || stored.startsWith('shared/');
};

/** The path to show instructors. A shared-folder mount shows as `~/shared/...`, which works in
 *  both the autograder and JupyterHub; an absolute path shows exactly as typed. */
export const displayMountPath = (mountPath: string | undefined, name: string): string => {
  const abs = containerPath(mountPath, name);
  return isSharedRelative(mountPath) ? `~${abs}` : abs;
};

/** Other spellings of the same location, for a tooltip; empty outside the shared folder. */
export const mountPathAliases = (mountPath: string | undefined, name: string): string[] => {
  if (!isSharedRelative(mountPath)) return [];
  const rest = containerPath(mountPath, name).slice('/shared/'.length);
  return [`/shared/${rest}`, `./shared/${rest}`];
};

const datasetErrorMessage = (response: Response): Promise<string> =>
  responseErrorMessage(response, {
    tooLarge: `File too large for the server (limit ${formatLimit(maxDatasetBytes())}).`,
  });

const formatFileSize = (bytes: number | undefined | null): string => {
  if (!bytes) return 'N/A';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
};

type QueuedStatus = 'pending' | 'uploading' | 'done' | 'error';

interface QueuedFile {
  uid: string;
  file: File;
  name: string;
  mountPath: string;
  status: QueuedStatus;
  error?: string;
}

interface SettingsValues {
  name?: string; // edit only
  mountPath?: string; // edit, or the shared pool path when uploading variants
  includeInDownload: boolean;
  mountWhenRunning: boolean;
  distribution: 'shared' | 'variant';
  autogradeAllVariants?: boolean;
  description?: string;
}

const DEFAULT_SETTINGS: SettingsValues = {
  includeInDownload: true,
  mountWhenRunning: true,
  distribution: 'shared',
  autogradeAllVariants: false,
};

interface IProps {
  assignmentId: number;
  datasets: AssignmentDataSetType[];
  onDatasetsChange: () => void;
}

const AssignmentDataSetsForm: React.FC<IProps> = ({ assignmentId, datasets, onDatasetsChange }) => {
  const assignCaps = useAssignmentCapabilities(assignmentId);
  const canManageDatasets = assignCaps.manage_datasets !== false;
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<{ finished: number; total: number } | null>(null);
  const [queued, setQueued] = React.useState<QueuedFile[]>([]);
  const [editingDataset, setEditingDataset] = React.useState<AssignmentDataSetType | null>(null);
  const [form] = Form.useForm<SettingsValues>();
  const distribution = Form.useWatch('distribution', form);
  const mountWhenRunning = Form.useWatch('mountWhenRunning', form);
  const includeInDownload = Form.useWatch('includeInDownload', form);
  const [splittingDataset, setSplittingDataset] = React.useState<AssignmentDataSetType | null>(null);
  const [splitForm] = Form.useForm();
  const [splitting, setSplitting] = React.useState(false);

  const isVariantPool = distribution === 'variant';

  const isTestResource = (dataset: AssignmentDataSetType): boolean => {
    const normalized = dataset as AssignmentDataSetType & { is_test_resource?: boolean };
    return Boolean(dataset.isTestResource || normalized.is_test_resource);
  };

  // ---- modal open/close -------------------------------------------------------------------

  // The queue is cleared on close, never here: the empty-state drop zone enqueues a file and
  // then opens the modal, and that file must survive the open.
  const openUploadModal = () => {
    if (!isModalVisible) {
      form.resetFields();
      form.setFieldsValue(DEFAULT_SETTINGS);
    }
    setEditingDataset(null);
    setIsModalVisible(true);
  };

  const openEditModal = (dataset: AssignmentDataSetType) => {
    setEditingDataset(dataset);
    setQueued([]);
    form.resetFields();
    form.setFieldsValue({
      name: dataset.name,
      description: dataset.description,
      mountPath: dataset.mountPath,
      includeInDownload: !dataset.hidden,
      mountWhenRunning: dataset.isActive !== false,
      distribution: dataset.isStudentVariant ? 'variant' : 'shared',
      autogradeAllVariants: Boolean(dataset.autogradeAllVariants),
    });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingDataset(null);
    setQueued([]);
    setProgress(null);
    form.resetFields();
  };

  // ---- queued files -----------------------------------------------------------------------

  const enqueue = React.useCallback((file: RcFile) => {
    if (file.size > maxDatasetBytes()) {
      message.error(`${file.name} exceeds the ${formatLimit(maxDatasetBytes())} limit`);
      return;
    }
    setQueued((prev) =>
      prev.some((q) => q.uid === file.uid)
        ? prev
        : [
            ...prev,
            { uid: file.uid, file, name: file.name, mountPath: defaultMountPath(file.name), status: 'pending' },
          ],
    );
  }, []);

  const updateQueued = (uid: string, patch: Partial<QueuedFile>) =>
    setQueued((prev) => prev.map((q) => (q.uid === uid ? { ...q, ...patch } : q)));

  const existingNames = React.useMemo(() => new Set(datasets.map((d) => d.name.toLowerCase())), [datasets]);

  const nameIssue = (q: QueuedFile): string | undefined => {
    if (q.status === 'done') return undefined;
    const n = q.name.trim();
    if (!n) return 'Name required';
    if (n.length > 64) return 'Name must be 64 characters or less';
    if (existingNames.has(n.toLowerCase())) return 'A dataset with this name already exists';
    if (queued.some((o) => o.uid !== q.uid && o.status !== 'done' && o.name.trim().toLowerCase() === n.toLowerCase())) {
      return 'Two files in this upload have the same name';
    }
    return undefined;
  };

  const pendingFiles = queued.filter((q) => q.status !== 'done');
  const hasNameIssues = pendingFiles.some((q) => nameIssue(q));

  // ---- submit -----------------------------------------------------------------------------

  const handleUpload = async (values: SettingsValues) => {
    if (pendingFiles.length === 0) {
      message.error('Drop at least one file to upload');
      return;
    }
    if (hasNameIssues) {
      message.error('Fix the highlighted dataset names first');
      return;
    }
    setUploading(true);
    setProgress({ finished: 0, total: pendingFiles.length });
    const token = getAuthToken();
    const isVariant = values.distribution === 'variant';
    let failures = 0;

    for (const q of pendingFiles) {
      updateQueued(q.uid, { status: 'uploading', error: undefined });
      const formData = new FormData();
      formData.append('assignment', String(assignmentId));
      formData.append('name', q.name.trim());
      if (values.description) formData.append('description', values.description);
      const mountPath = (isVariant ? values.mountPath : q.mountPath)?.trim();
      if (mountPath) formData.append('mount_path', mountPath);
      formData.append('is_active', values.mountWhenRunning ? 'true' : 'false');
      formData.append('hidden', values.includeInDownload ? 'false' : 'true');
      formData.append('is_student_variant', isVariant ? 'true' : 'false');
      formData.append('autogradeAllVariants', isVariant && values.autogradeAllVariants ? 'true' : 'false');
      formData.append('file', q.file);

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/assignmentDataSets/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!response.ok) throw new Error(await datasetErrorMessage(response));
        updateQueued(q.uid, { status: 'done' });
      } catch (error: unknown) {
        failures += 1;
        updateQueued(q.uid, { status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
      }
      setProgress((p) => (p ? { ...p, finished: p.finished + 1 } : p));
    }

    setUploading(false);
    onDatasetsChange();
    if (failures === 0) {
      message.success(`Uploaded ${pendingFiles.length} dataset${pendingFiles.length === 1 ? '' : 's'}`);
      closeModal();
    } else {
      // Keep the failed rows (with their errors) for a retry; the successes are in the table now.
      setQueued((prev) => prev.filter((q) => q.status !== 'done'));
      setProgress(null);
      message.error(`${failures} of ${pendingFiles.length} upload${pendingFiles.length === 1 ? '' : 's'} failed`);
    }
  };

  const handleEdit = async (values: SettingsValues) => {
    if (!editingDataset) return;
    setUploading(true);
    try {
      const isVariant = values.distribution === 'variant';
      await assignmentDataSetsApi.partialUpdate({
        id: editingDataset.id,
        name: values.name,
        description: values.description,
        mountPath: values.mountPath,
        isActive: values.mountWhenRunning,
        hidden: !values.includeInDownload,
        isStudentVariant: isVariant,
        autogradeAllVariants: isVariant && Boolean(values.autogradeAllVariants),
      });
      message.success('Dataset updated');
      closeModal();
      onDatasetsChange();
    } catch (error: unknown) {
      message.error((await apiErrorMessageAsync(error)) ?? 'Failed to update dataset');
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
          await assignmentDataSetsApi.destroy({ id: datasetId });
          message.success('Dataset deleted successfully');
          onDatasetsChange();
        } catch (error: unknown) {
          message.error((await apiErrorMessageAsync(error)) ?? 'Failed to delete dataset');
        }
      },
    });
  };

  // The download endpoint needs the Bearer token, which a plain link or window.open can't
  // carry (the SPA has no session cookie) — so fetch it and hand the bytes to the browser.
  const handleDownload = async (dataset: AssignmentDataSetType) => {
    const hide = message.loading(`Downloading ${dataset.name}…`, 0);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/assignmentDataSets/${dataset.id}/download/`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error(await datasetErrorMessage(response));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = dataset.fileName || dataset.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: unknown) {
      message.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      hide();
    }
  };

  const handleToggleActive = async (dataset: AssignmentDataSetType, checked: boolean) => {
    try {
      await assignmentDataSetsApi.partialUpdate({ id: dataset.id, isActive: checked });
      message.success(checked ? 'Dataset will be mounted when code runs' : 'Dataset no longer mounted');
      onDatasetsChange();
    } catch (error: unknown) {
      message.error((await apiErrorMessageAsync(error)) ?? 'Failed to update dataset');
    }
  };

  const openSplitModal = (dataset: AssignmentDataSetType) => {
    setSplittingDataset(dataset);
    splitForm.resetFields();
    splitForm.setFieldsValue({ rowsPerChunk: 50, hasHeader: true, replace: false });
  };

  const handleSplit = async (values: { rowsPerChunk: number; hasHeader: boolean; replace?: boolean }) => {
    if (!splittingDataset) return;
    setSplitting(true);
    try {
      const created = await assignmentDataSetsApi.splitIntoVariantsCreate({
        id: splittingDataset.id,
        assignmentDataSetsSplitIntoVariantsCreateRequest: {
          rowsPerChunk: values.rowsPerChunk,
          hasHeader: values.hasHeader,
          replace: values.replace ?? false,
        },
      });
      message.success(`Created ${created.length} per-student variants from "${splittingDataset.name}".`);
      setSplittingDataset(null);
      onDatasetsChange();
    } catch (error: unknown) {
      message.error((await apiErrorMessageAsync(error)) ?? 'Failed to split the dataset.');
    } finally {
      setSplitting(false);
    }
  };

  // ---- existing datasets table ------------------------------------------------------------

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: AssignmentDataSetType) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {text}
            {record.isStudentVariant && (
              <Tag color="purple" style={{ marginLeft: 8 }}>
                Variant{record.autogradeAllVariants ? ' · autograde all' : ''}
              </Tag>
            )}
            {isTestResource(record) ? (
              <Tooltip title="A grading fixture attached to a test category. Never shown to students, never included in their assignment download, and only mounted during that test category's runs.">
                <Tag color="gold" style={{ marginLeft: 8 }}>
                  Hidden · Test resource
                </Tag>
              </Tooltip>
            ) : (
              record.hidden && (
                <Tooltip title="Not listed to students and not included in their assignment download. Still mounted during code execution while mounting is on.">
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    Not in student download
                  </Tag>
                </Tooltip>
              )
            )}
          </div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Mounts at',
      dataIndex: 'mountPath',
      key: 'mountPath',
      render: (path: string | undefined, record: AssignmentDataSetType) => {
        const aliases = mountPathAliases(path, record.name);
        return (
          <Tooltip title={aliases.length ? `Same file as ${aliases.join(', ')}` : undefined}>
            <code style={{ fontSize: '12px' }}>{displayMountPath(path, record.name)}</code>
          </Tooltip>
        );
      },
    },
    {
      title: 'File',
      key: 'file',
      render: (_: unknown, record: AssignmentDataSetType) => (
        <div>
          <div style={{ fontSize: '12px' }}>{record.fileName || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>{formatFileSize(record.fileSize)}</div>
        </div>
      ),
    },
    {
      title: 'Mounted',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean | undefined, record: AssignmentDataSetType) => (
        <Tooltip title="Whether this file is mounted inside the container when code runs. Does not affect the student download.">
          <Switch
            checked={Boolean(isActive)}
            size="small"
            onChange={(checked) => handleToggleActive(record, checked)}
            checkedChildren="Mounted"
            unCheckedChildren="Not mounted"
            disabled={!canManageDatasets}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: AssignmentDataSetType) => (
        <Space>
          <Tooltip
            title={isTestResource(record) ? 'Managed from the Environment & Tests page (test category resources).' : ''}
          >
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
              disabled={!canManageDatasets || isTestResource(record)}
            >
              Edit
            </Button>
          </Tooltip>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
            Download
          </Button>
          {!record.isStudentVariant && !isTestResource(record) && (
            <Button
              type="link"
              size="small"
              icon={<ScissorOutlined />}
              onClick={() => openSplitModal(record)}
              disabled={!canManageDatasets}
            >
              Split into variants
            </Button>
          )}
          <Tooltip
            title={isTestResource(record) ? 'Managed from the Environment & Tests page (test category resources).' : ''}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              disabled={!canManageDatasets || isTestResource(record)}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ---- queued files table (inside the upload modal) ---------------------------------------

  const statusIcon = (q: QueuedFile) => {
    if (q.status === 'uploading') return <LoadingOutlined />;
    if (q.status === 'done') return <CheckCircleFilled style={{ color: '#52c41a' }} />;
    if (q.status === 'error') {
      return (
        <Tooltip title={q.error}>
          <CloseCircleFilled style={{ color: '#ff4d4f' }} />
        </Tooltip>
      );
    }
    return null;
  };

  const queuedColumns = [
    {
      title: 'File',
      key: 'file',
      render: (_: unknown, q: QueuedFile) => (
        <div>
          <div style={{ fontSize: 12 }}>{q.file.name}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{formatFileSize(q.file.size)}</div>
          {q.error && <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>{q.error}</div>}
        </div>
      ),
    },
    {
      title: 'Dataset name',
      key: 'name',
      render: (_: unknown, q: QueuedFile) => {
        const issue = nameIssue(q);
        return (
          <Tooltip title={issue}>
            <Input
              size="small"
              aria-label={`Dataset name for ${q.file.name}`}
              value={q.name}
              status={issue ? 'error' : undefined}
              disabled={uploading || q.status === 'done'}
              onChange={(e) => {
                const name = e.target.value;
                // Keep the mount path in step while it is still the default for the old name.
                updateQueued(q.uid, {
                  name,
                  mountPath: q.mountPath === defaultMountPath(q.name) ? defaultMountPath(name) : q.mountPath,
                });
              }}
            />
          </Tooltip>
        );
      },
    },
    ...(mountWhenRunning !== false && !isVariantPool
      ? [
          {
            title: 'Mounts at',
            key: 'mountPath',
            render: (_: unknown, q: QueuedFile) => (
              <div>
                <Input
                  size="small"
                  aria-label={`Mount path for ${q.file.name}`}
                  value={q.mountPath}
                  disabled={uploading || q.status === 'done'}
                  onChange={(e) => updateQueued(q.uid, { mountPath: e.target.value })}
                />
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  → <code>{displayMountPath(q.mountPath, q.name.trim() || q.file.name)}</code>
                </div>
              </div>
            ),
          },
        ]
      : []),
    {
      title: '',
      key: 'status',
      width: 70,
      render: (_: unknown, q: QueuedFile) => (
        <Space size={4}>
          {statusIcon(q)}
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            aria-label={`Remove ${q.file.name}`}
            disabled={uploading}
            onClick={() => setQueued((prev) => prev.filter((p) => p.uid !== q.uid))}
          />
        </Space>
      ),
    },
  ];

  const dropZoneText = 'Click or drag files here. Each file becomes one dataset.';

  const okText = editingDataset
    ? 'Save'
    : pendingFiles.length === 0
      ? 'Upload'
      : `Upload ${pendingFiles.length} file${pendingFiles.length === 1 ? '' : 's'}`;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Assignment Datasets</h3>
          <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
            Data files (CSVs, model weights, binaries) students need. Each one can be included in the student&apos;s
            assignment download, mounted inside the container when code runs, or both.
          </div>
        </div>
        <Button type="primary" icon={<UploadOutlined />} onClick={openUploadModal} disabled={!canManageDatasets}>
          Upload Datasets
        </Button>
      </div>

      {datasets.length > 0 ? (
        <Table columns={columns} dataSource={datasets} rowKey="id" pagination={false} size="small" />
      ) : (
        <Upload.Dragger
          multiple
          showUploadList={false}
          disabled={!canManageDatasets}
          beforeUpload={(file) => {
            enqueue(file);
            openUploadModal();
            return false;
          }}
        >
          <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">No datasets yet. {dropZoneText}</p>
          <p className="ant-upload-hint">
            Files mount at <code>~/shared/&lt;file name&gt;</code> by default and are bundled into the student download.
            Up to {formatLimit(maxDatasetBytes())} each.
          </p>
        </Upload.Dragger>
      )}

      <Modal
        title={editingDataset ? `Edit dataset: ${editingDataset.name}` : 'Upload datasets'}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={okText}
        okButtonProps={{ disabled: !editingDataset && (pendingFiles.length === 0 || hasNameIssues) }}
        confirmLoading={uploading}
        maskClosable={!uploading}
        width={720}
      >
        <Form<SettingsValues>
          form={form}
          layout="vertical"
          onFinish={editingDataset ? handleEdit : handleUpload}
          initialValues={DEFAULT_SETTINGS}
        >
          {!editingDataset && (
            <>
              <Upload.Dragger
                multiple
                showUploadList={false}
                disabled={uploading}
                beforeUpload={(file) => {
                  enqueue(file);
                  return false;
                }}
                style={{ marginBottom: 12 }}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{dropZoneText}</p>
                <p className="ant-upload-hint">
                  Up to {formatLimit(maxDatasetBytes())} per file. Drop several at once to upload them together.
                </p>
              </Upload.Dragger>

              {queued.length > 0 && (
                <Table
                  columns={queuedColumns}
                  dataSource={queued}
                  rowKey="uid"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 16 }}
                />
              )}

              {progress && (
                <Progress
                  percent={Math.round((progress.finished / progress.total) * 100)}
                  size="small"
                  style={{ marginBottom: 16 }}
                />
              )}
            </>
          )}

          {editingDataset && (
            <Form.Item
              name="name"
              label="Dataset name"
              rules={[
                { required: true, message: 'Please enter a dataset name' },
                { max: 64, message: 'Name must be 64 characters or less' },
              ]}
            >
              <Input />
            </Form.Item>
          )}

          <Typography.Text strong>How students get this data</Typography.Text>
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <Form.Item name="includeInDownload" valuePropName="checked" style={{ marginBottom: 4 }}>
              <Checkbox>Include in students&apos; assignment download</Checkbox>
            </Form.Item>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, display: 'block', marginLeft: 24, marginBottom: 8 }}
            >
              Added to the <code>data/</code> folder of the zip students download from the assignment page.
            </Typography.Text>

            <Form.Item name="mountWhenRunning" valuePropName="checked" style={{ marginBottom: 4 }}>
              <Checkbox>Mount when code runs</Checkbox>
            </Form.Item>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginLeft: 24 }}>
              Available read-only at the path shown{editingDataset || isVariantPool ? ' below' : ' on each file'}.{' '}
              <code>~/shared/…</code> is the same folder as <code>/shared/…</code> and <code>./shared/…</code>, in both
              the autograder and JupyterHub. An absolute path (e.g. <code>/srv/shared/…</code>) mounts exactly where
              typed. End a path with <code>/</code> to mount into a folder; start it with <code>./</code> to put the
              file next to the student&apos;s code.
            </Typography.Text>

            {(editingDataset || isVariantPool) && mountWhenRunning !== false && (
              <Form.Item
                name="mountPath"
                label={isVariantPool ? 'Mount path (shared by every variant)' : 'Mount path'}
                style={{ marginLeft: 24, marginTop: 12, marginBottom: 0 }}
                extra={
                  isVariantPool
                    ? 'Every variant mounts at the same path, so student code reads one fixed location whichever variant it gets.'
                    : undefined
                }
              >
                <Input placeholder="shared/data.csv" />
              </Form.Item>
            )}
          </div>

          {includeInDownload === false && mountWhenRunning === false && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              title="Students will never see this file and code cannot read it. Only useful as a master file to split into variants."
            />
          )}

          <Typography.Text strong>Distribution</Typography.Text>
          <Form.Item name="distribution" style={{ marginTop: 8, marginBottom: 8 }}>
            <Radio.Group
              aria-label="Distribution"
              onChange={(e) => {
                if (e.target.value === 'variant' && !editingDataset && !form.getFieldValue('mountPath')) {
                  form.setFieldValue('mountPath', queued[0]?.mountPath);
                }
              }}
            >
              <Space orientation="vertical">
                <Radio value="shared">Everyone gets the same file{editingDataset ? '' : 's'}</Radio>
                <Radio value="variant">
                  Per-student variant pool{editingDataset ? '' : ' — each file is one variant'}
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Each student is assigned exactly one variant (balanced automatically, overridable on the Student
                    assignments tab). Have one big CSV instead? Upload it as shared, then use{' '}
                    <em>Split into variants</em> on it.
                  </Typography.Text>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {isVariantPool && (
            <Form.Item
              name="autogradeAllVariants"
              label="Autograder also checks other variants"
              valuePropName="checked"
              style={{ marginLeft: 24, marginBottom: 12 }}
              extra="When a submission is finalized, the autograder also reruns it against a sample of other variants to catch code hardcoded to one dataset's numbers. One extra autograder run per sampled variant."
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          )}

          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
            Need a different file at the same path only while a test category runs? Add it as a Test Resource on the
            Environment &amp; Tests page.
          </Typography.Text>

          <Collapse
            size="small"
            ghost
            items={[
              {
                key: 'advanced',
                label: 'Advanced',
                children: (
                  <Form.Item name="description" label="Description" style={{ marginBottom: 0 }}>
                    <Input.TextArea rows={2} placeholder="What this data contains, for you and your staff" />
                  </Form.Item>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      <Modal
        title="Split into per-student variants"
        open={!!splittingDataset}
        onCancel={() => setSplittingDataset(null)}
        onOk={() => splitForm.submit()}
        confirmLoading={splitting}
        width={480}
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
          Splits <code>{splittingDataset?.name}</code> into disjoint row-chunks — one variant per chunk, each student
          assigned exactly one (auto-balanced, overridable in the &quot;Student assignments&quot; tab once created). The
          chunk count is driven by rows per chunk, not current enrollment, so it stays stable as students add/drop the
          course. The original file is kept but no longer mounted or included in the student download.
        </Typography.Paragraph>
        <Form form={splitForm} layout="vertical" onFinish={handleSplit}>
          <Form.Item
            name="rowsPerChunk"
            label="Rows per chunk"
            rules={[{ required: true, type: 'number', min: 1, message: 'Enter at least 1 row per chunk.' }]}
            extra="Pick enough rows that each student's slice is still a meaningful sample for their analysis."
          >
            <InputNumber min={1} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="hasHeader"
            label="First row is a header"
            valuePropName="checked"
            extra="The header row is repeated at the top of every generated variant."
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
          <Form.Item
            name="replace"
            label="Replace existing variants"
            valuePropName="checked"
            extra="Deletes this file's previous variants first so you can regenerate. This resets every student's variant assignment — anyone already assigned will be given a new one on next access."
          >
            <Switch checkedChildren="Replace" unCheckedChildren="Keep" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssignmentDataSetsForm;
