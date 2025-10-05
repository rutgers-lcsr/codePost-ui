import { DownOutlined } from '@ant-design/icons';
import { Button, Checkbox, Dropdown, Form, Input, message, Popconfirm, Table, Tag } from 'antd';
import moment from 'moment';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { CourseType } from '../../../infrastructure/course';
import { VALID_WEBHOOKS, Webhook, WebhookType } from '../../../infrastructure/webhook';

const EditableContext = React.createContext<any>(null);

const EditableRow = ({ index, ...props }: any) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({ title, editable, children, dataIndex, record, handleSave, ...restProps }: any) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      // @ts-ignore
      inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async (e: any) => {
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
        style={{
          margin: 0,
        }}
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
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
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

class WebhooksTable extends React.Component<IWebhooksTableProps, any> {
  public columns: any[] = [];

  constructor(props: IWebhooksTableProps) {
    super(props);

    const objects = Object.keys(VALID_WEBHOOKS).map((obj: string) => {
      return {
        text: obj,
        value: obj,
      };
    });

    this.columns = [
      {
        title: 'Enabled',
        dataIndex: 'enabled',
        render: (enabled: any, record: any) => {
          const onChange = (e: any) => {
            const update = { ...record, enabled: e.target.checked };
            this.handleSave(update);
          };
          return <Checkbox checked={enabled} onChange={onChange} />;
        },
        filters: [
          {
            text: 'Checked',
            value: true,
          },
          {
            text: 'Not checked',
            value: false,
          },
        ],
        onFilter: (value: any, record: any) => {
          return record.enabled === value;
        },
      },
      {
        title: 'Object',
        dataIndex: 'object',
        filters: objects,
        onFilter: (value: any, record: any) => record.object.indexOf(value) === 0,
        sorter: (a: any, b: any) => a.object.localeCompare(b.object),
      },
      {
        title: 'Action',
        dataIndex: 'action',
      },
      {
        title: 'Target',
        dataIndex: 'target',
        width: '30%',
        editable: true,
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
        render: (text: string, record: any) =>
          this.state.dataSource.length >= 1 ? (
            <Popconfirm title="Are you sure?" onConfirm={() => this.handleDelete(record.webhook.id)}>
              <a>Delete</a>
            </Popconfirm>
          ) : null,
      },
    ];
    this.state = {
      dataSource: props.webhooks.map((webhook: WebhookType, index: number) => {
        const lastTriggered = webhook.last_triggered_at ? (
          moment(webhook.last_triggered_at).format('lll')
        ) : (
          <Tag>Never Triggered</Tag>
        );
        const status =
          webhook.last_triggered_status && webhook.last_triggered_status.includes('20') ? (
            <Tag color="green">{webhook.last_triggered_status}</Tag>
          ) : webhook.last_triggered_status ? (
            <Tag color="red">{webhook.last_triggered_status}</Tag>
          ) : (
            ''
          );
        return {
          key: index.toString(),
          webhook: webhook,
          enabled: webhook.is_active,
          object: webhook.event.split('.')[0],
          action: webhook.event.split('.')[1],
          target: webhook.target,
          lastTriggered,
          status,
        };
      }),
      count: props.webhooks.length,
    };
  }

  handleDelete = async (id: any) => {
    const dataSource = [...this.state.dataSource];

    try {
      await Webhook.delete(id);
    } catch {
      message.error('Error...');
      return;
    }
    this.setState({
      dataSource: dataSource.filter((item) => item.webhook.id !== id),
    });
  };

  handleAdd = async (e: any) => {
    const { count, dataSource } = this.state;

    const event = `${e.keyPath[1]}.${e.keyPath[0]}`;

    const payload = {
      id: 0,
      event,
      is_active: false,
      target: 'https://my.webhook.endpoint.com',
      course: this.props.course.id,
    };

    let newWebhook;
    try {
      newWebhook = await Webhook.create(payload);
    } catch {
      message.error('Error...');
      return;
    }

    if (newWebhook !== undefined) {
      const newData = {
        key: count,
        target: `https://my.webhook.endpoint.com`,
        enabled: false,
        object: event.split('.')[0],
        action: event.split('.')[1],
        webhook: newWebhook,
      };
      this.setState({
        dataSource: [...dataSource, newData],
        count: count + 1,
      });
    }
  };

  handleSave = async (row: any) => {
    const payload = {
      id: row.webhook.id,
      is_active: row.enabled,
      target: row.target,
    };

    try {
      await Webhook.update(payload);
      // show saving
      message.success('Saved!');
    } catch {
      message.error('Error saving...');
      return;
    }

    const newData = [...this.state.dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    this.setState({
      dataSource: newData,
    });
  };

  render() {
    const { dataSource } = this.state;
    const components = {
      body: {
        row: EditableRow,
        cell: EditableCell,
      },
    };
    const columns = this.columns.map((col) => {
      if (!col.editable) {
        return {
          ...col,
          onCell: (record: any) => ({
            record,
            handleSave: this.handleSave,
          }),
        };
      }

      return {
        ...col,
        onCell: (record: any) => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      };
    });

    const menuItems = Object.keys(VALID_WEBHOOKS).map((obj: string) => {
      return {
        key: obj,
        label: obj,
        children: VALID_WEBHOOKS[obj].map((hook: string) => {
          return {
            key: hook,
            label: hook,
          };
        }),
      };
    });

    return (
      <div>
        <Dropdown menu={{ items: menuItems, onClick: this.handleAdd }}>
          <Button
            type="primary"
            style={{
              marginBottom: 16,
            }}
          >
            Add a new webhook <DownOutlined />
          </Button>
        </Dropdown>
        <Table
          components={components}
          rowClassName={() => 'editable-row'}
          bordered
          dataSource={dataSource}
          columns={columns}
        />
      </div>
    );
  }
}

export default WebhooksTable;
