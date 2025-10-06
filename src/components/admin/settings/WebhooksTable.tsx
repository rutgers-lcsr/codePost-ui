import { DownOutlined } from '@ant-design/icons';
import { Button, Checkbox, Dropdown, Form, Input, message, Popconfirm, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { CourseType } from '../../../infrastructure/course';
import { VALID_WEBHOOKS, Webhook, WebhookType } from '../../../infrastructure/webhook';

const EditableContext = React.createContext<any>(null);

const EditableRow: React.FC<any> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: string;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: string;
  record: any;
  handleSave: (record: any) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<any>(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

interface IWebhooksTableProps {
  webhooks: WebhookType[];
  course: CourseType;
}

interface DataSourceType {
  key: string;
  webhook: WebhookType;
  enabled: boolean;
  object: string;
  action: string;
  target: string;
  lastTriggered: React.ReactNode;
  status: React.ReactNode;
}

const WebhooksTable: React.FC<IWebhooksTableProps> = ({ webhooks, course }) => {
  const [dataSource, setDataSource] = useState<DataSourceType[]>(() =>
    webhooks.map((webhook, index) => ({
      key: index.toString(),
      webhook,
      enabled: webhook.is_active,
      object: webhook.event.split('.')[0],
      action: webhook.event.split('.')[1],
      target: webhook.target,
      lastTriggered: webhook.last_triggered_at ? (
        moment(webhook.last_triggered_at).format('lll')
      ) : (
        <Tag>Never Triggered</Tag>
      ),
      status:
        webhook.last_triggered_status && webhook.last_triggered_status.includes('20') ? (
          <Tag color="green">{webhook.last_triggered_status}</Tag>
        ) : webhook.last_triggered_status ? (
          <Tag color="red">{webhook.last_triggered_status}</Tag>
        ) : (
          ''
        ),
    })),
  );
  const [count, setCount] = useState(webhooks.length);

  const handleDelete = async (webhook: WebhookType) => {
    try {
      await Webhook.delete(webhook);
      setDataSource((prev) => prev.filter((item) => item.webhook.id !== webhook.id));
    } catch {
      message.error('Error...');
    }
  };

  const handleAdd = async (e: any) => {
    const event = `${e.keyPath[1]}.${e.keyPath[0]}`;

    const payload = {
      id: 0,
      event,
      is_active: false,
      target: 'https://my.webhook.endpoint.com',
      course: course.id,
    };

    try {
      const newWebhook = await Webhook.create(payload);
      if (newWebhook) {
        const newData: DataSourceType = {
          key: count.toString(),
          target: 'https://my.webhook.endpoint.com',
          enabled: false,
          object: event.split('.')[0],
          action: event.split('.')[1],
          webhook: newWebhook,
          lastTriggered: <Tag>Never Triggered</Tag>,
          status: '',
        };
        setDataSource((prev) => [...prev, newData]);
        setCount((prev) => prev + 1);
      }
    } catch {
      message.error('Error...');
    }
  };

  const handleSave = async (row: DataSourceType) => {
    const payload = {
      id: row.webhook.id,
      is_active: row.enabled,
      target: row.target,
    };

    try {
      await Webhook.update(payload);
      message.success('Saved!');
      setDataSource((prev) => {
        const newData = [...prev];
        const index = newData.findIndex((item) => row.key === item.key);
        if (index > -1) {
          const item = newData[index];
          newData.splice(index, 1, { ...item, ...row });
        }
        return newData;
      });
    } catch {
      message.error('Error saving...');
    }
  };

  const objects = Object.keys(VALID_WEBHOOKS).map((obj: string) => ({
    text: obj,
    value: obj,
  }));

  const columns: ColumnsType<DataSourceType> = [
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      render: (enabled: boolean, record: DataSourceType) => {
        const onChange = (e: any) => {
          const update = { ...record, enabled: e.target.checked };
          handleSave(update);
        };
        return <Checkbox checked={enabled} onChange={onChange} />;
      },
      filters: [
        { text: 'Checked', value: true },
        { text: 'Not checked', value: false },
      ],
      onFilter: (value, record) => record.enabled === value,
    },
    {
      title: 'Object',
      dataIndex: 'object',
      filters: objects,
      onFilter: (value, record) => record.object.indexOf(value as string) === 0,
      sorter: (a, b) => a.object.localeCompare(b.object),
    },
    {
      title: 'Action',
      dataIndex: 'action',
    },
    {
      title: 'Target',
      dataIndex: 'target',
      width: '30%',
    },
    {
      title: 'Last Triggered',
      dataIndex: 'lastTriggered',
    },
    {
      title: 'Latest Status',
      dataIndex: 'status',
    },
    {
      title: '',
      dataIndex: 'delete',
      render: (_, record) =>
        dataSource.length >= 1 ? (
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.webhook)}>
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const mappedColumns = columns.map((col: any) => {
    if (!col.editable) {
      return {
        ...col,
        onCell: (record: DataSourceType) => ({
          record,
          handleSave,
        }),
      };
    }

    return {
      ...col,
      onCell: (record: DataSourceType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  const menuItems = Object.keys(VALID_WEBHOOKS).map((obj: string) => ({
    key: obj,
    label: obj,
    children: VALID_WEBHOOKS[obj].map((hook: string) => ({
      key: hook,
      label: hook,
    })),
  }));

  return (
    <div>
      <Dropdown menu={{ items: menuItems, onClick: handleAdd }}>
        <Button type="primary" style={{ marginBottom: 16 }}>
          Add a new webhook <DownOutlined />
        </Button>
      </Dropdown>
      <Table
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={dataSource}
        columns={mappedColumns}
      />
    </div>
  );
};

export default WebhooksTable;
