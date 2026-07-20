// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Course-level file management: instructors upload/paste reference files (style guides,
// topic notes, syllabus excerpts) that can be referenced in AI quiz-generation prompts as
// {course_file:name}. A dedicated admin page (course admins only — writes are gated
// server-side by CourseFilePermissions). Content is stored inline as UTF-8 text.
import * as React from 'react';
import {
  Card, Empty, Flex, Form, Input, Modal, Space, Spin, Table, Tag, Typography, Upload, Button, message,
} from 'antd';
import type { RcFile, UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import { DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import CPButton from '../../core/CPButton';
import { courseFilesApi } from '../../../api-client/clients';
import { Course, CourseFile } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { courseKeys } from '../../../lib/queryKeys';
import { useCourseFiles } from './queries';

const { Text } = Typography;

interface IProps {
  course: Course;
}

interface IFileForm {
  name: string;
  data: string;
}

// CourseFile.extension is a required, non-blank field on create, so always send one derived
// from the filename (default .txt when the name carries no extension).
const extensionFor = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot) : '.txt';
};

const formatSize = (data?: string): string => {
  const chars = data?.length ?? 0;
  return chars < 1024 ? `${chars} B` : `${(chars / 1024).toFixed(1)} KB`;
};

const CourseFilesManager: React.FC<IProps> = ({ course }) => {
  const courseId = course.id!;
  const queryClient = useQueryClient();
  const { data: files = [], isLoading } = useCourseFiles(courseId);
  const [form] = Form.useForm<IFileForm>();
  const [editing, setEditing] = React.useState<CourseFile | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: courseKeys.files(courseId) });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (file: CourseFile) => {
    setEditing(file);
    form.setFieldsValue({ name: file.name, data: file.data ?? '' });
    setModalOpen(true);
  };

  // Read a dropped/selected file as text and prefill the form (name only if still empty,
  // so an in-progress rename isn't clobbered). Text files only — content is stored as UTF-8.
  const readFile = (options: {
    file: RcFile;
    onSuccess: (body: unknown, file: RcFile) => void;
    onError: (err: Error) => void;
  }) => {
    const { file, onSuccess, onError } = options;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        form.setFieldsValue({
          data: reader.result,
          ...(form.getFieldValue('name') ? {} : { name: file.name }),
        });
        onSuccess(file.name, file);
      } else {
        const err = new Error(`${file.name} could not be read as text.`);
        message.error(err.message);
        onError(err);
      }
    };
    reader.onerror = () => onError(new Error(`Failed to read ${file.name}.`));
    reader.readAsText(file);
  };

  const onUploadChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'error') message.error(`${info.file.name} could not be uploaded.`);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const name = values.name.trim();
      if (editing) {
        await courseFilesApi.partialUpdate({
          id: editing.id,
          patchedCourseFile: { name, data: values.data, extension: extensionFor(name) },
        });
        message.success('Course file updated.');
      } else {
        await courseFilesApi.create({
          courseFile: { course: courseId, name, data: values.data, extension: extensionFor(name) },
        });
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

  const handleDelete = (file: CourseFile) => {
    Modal.confirm({
      title: `Delete "${file.name}"?`,
      content: 'Any AI prompt that references this file with {course_file:…} will show it as unavailable.',
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
          <Button
            type="text"
            size="small"
            onClick={() => openEdit(record)}
            style={{ padding: 0, height: 'auto' }}
          >
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
      render: (_: unknown, record: CourseFile) => <Text type="secondary">{formatSize(record.data)}</Text>,
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
        Reference material for AI quiz prompts. Add a file here, then insert it into an AI-generated
        question section's prompt as <Text code>{'{course_file:name}'}</Text> — usable on any quiz,
        attached to an assignment or not.
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
          <Empty
            description="No course files yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 32 }}
          />
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
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Upload a text file (optional)">
            <Upload
              showUploadList={false}
              accept=".txt,.md,.py,.java,.c,.cpp,.js,.ts,.json,.csv,.html,.css,.rb,.go,.rs,.sh,.yml,.yaml,text/*"
              onChange={onUploadChange}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              customRequest={readFile as any}
            >
              <Button icon={<UploadOutlined />}>Choose file</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
              The file's name and contents fill the fields below — you can still edit them.
            </Text>
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please name the file.' }]}>
            <Input placeholder="e.g., style-guide.md" maxLength={250} />
          </Form.Item>
          <Form.Item
            name="data"
            label="Contents"
            rules={[{ required: true, message: 'Add the file contents (upload or paste).' }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 8, maxRows: 24 }}
              placeholder="Paste or edit the file's text here…"
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseFilesManager;
