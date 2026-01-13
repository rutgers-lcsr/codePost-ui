import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { SystemIO, EventLogType } from '../../infrastructure/system';
import dayjs from 'dayjs';

const ActivityFeed: React.FC = () => {
  const [logs, setLogs] = useState<EventLogType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (pageNum: number, pSize: number) => {
    setLoading(true);
    try {
      const data = await SystemIO.getActivity(pageNum, pSize);
      setLogs(data.results);
      setTotal(data.total);
      setPage(data.page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, pageSize);
  }, []);

  const columns = [
    {
      title: 'Time',
      dataIndex: 'created',
      key: 'created',
      render: (text: string) => dayjs(text).format('MM/DD HH:mm:ss'),
      width: 150,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag>{cat}</Tag>,
      width: 150,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Typography.Paragraph ellipsis={{ rows: 2, expandable: false, symbol: 'more' }} style={{ margin: 0 }}>
          {text}
        </Typography.Paragraph>
      ),
    },
  ];

  const expandedRowRender = (record: EventLogType) => {
    let prettyMeta = record.meta;
    try {
      prettyMeta = JSON.stringify(JSON.parse(record.meta), null, 2);
    } catch (e) {
      // content is not JSON
    }

    return (
      <div
        style={{
          padding: '10px',
          background: '#fafafa',
          borderRadius: '4px',
          wordWrap: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        <p>
          <strong>Full Description:</strong>
        </p>
        <div style={{ whiteSpace: 'pre-wrap', marginBottom: '10px', wordWrap: 'break-word', overflowWrap: 'anywhere' }}>
          {record.description}
        </div>

        {record.user && (
          <p>
            <strong>User:</strong> {record.user}
          </p>
        )}
        {record.courseID && (
          <p>
            <strong>Course ID:</strong> {record.courseID}
          </p>
        )}

        {prettyMeta && prettyMeta !== '{}' && prettyMeta !== '' && (
          <>
            <p>
              <strong>Meta Data:</strong>
            </p>
            <pre
              style={{
                fontSize: '12px',
                background: '#eee',
                padding: '8px',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              {prettyMeta}
            </pre>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Card
        title="System Activity Feed"
        bodyStyle={{ padding: 0 }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => fetchLogs(1, pageSize)}>
            Refresh
          </Button>
        }
      >
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total: total,
            pageSize: pageSize,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps || 20);
              fetchLogs(p, ps || 20);
            },
            showSizeChanger: true,
          }}
          size="middle"
          expandable={{
            expandedRowRender: expandedRowRender,
            rowExpandable: (_) => true,
          }}
          tableLayout="fixed"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default ActivityFeed;
