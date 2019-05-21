import * as React from 'react';

import { Badge, Icon, Input, Table } from 'antd';

import CPButton from './CPButton';

// interface ICPRubricCateogryProps {
//   goBack: any;
//   title: string;
//   actions: React.ReactNode[];
//   content: React.ReactNode;
// }

class CPRubricCategory extends React.Component<{}, {}> {
  public render() {
    const columns = [
      {
        title: 'Comment Text',
        dataIndex: 'text',
        key: 'text',
      },
      {
        title: 'Deduction',
        dataIndex: 'deduction',
        key: 'deduction',
      },
      {
        title: 'Linked Comments',
        key: 'linked',
        dataIndex: 'linked',
        render: (count: number, record: any) => (
          <Badge count={count} className="cp-badge" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
        ),
      },
      {
        title: '',
        dataIndex: 'delete',
        key: 'delete',
        render: (text: string, record: any) => <Icon type="delete" />,
      },
    ];

    const data = [
      {
        key: '1',
        text: 'First comment',
        deduction: 3,
        linked: 1,
      },
      {
        key: '2',
        text: 'Second comment',
        deduction: 2,
        linked: 0,
      },
      {
        key: '3',
        text: 'Third comment',
        deduction: 1,
        linked: 3,
      },
    ];

    return (
      <div style={{ backgroundColor: '#fff', minHeight: '400px', borderRadius: '5px' }}>
        <div
          className="cp-rubric-category__title "
          style={{
            padding: '17px 32px 14px 35px',
            borderBottom: '1px solid #e9e9e9',
          }}
        >
          <div className="cp-flex--normal">
            <div className="left">
              <span className="cp-label cp-label--plus cp-label--bold">Category: Correctness</span>
            </div>
            <div className="gap" />
            <div className="right">
              <CPButton cpType="danger">Delete</CPButton>
            </div>
            <div className="right">
              <CPButton cpType="secondary" icon="plus">
                Add New Category
              </CPButton>
            </div>
          </div>
        </div>
        <div style={{ padding: '25px 32px 72px 35px', position: 'relative' }}>
          <div className="cp-flex--very-wide">
            <div className="left">
              <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
                Category Name
              </div>
              <Input />
            </div>
            <div className="left">
              <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
                Category Point Limit
              </div>
              <Input />
            </div>
            <div className="gap" />
          </div>
          <div style={{ height: '40px' }} />
          <Table columns={columns} dataSource={data} pagination={false} />
          <div style={{ position: 'absolute', bottom: '22px', left: '60px' }}>
            <CPButton cpType="primary" icon="plus" />
            <span style={{ marginLeft: '20px' }} className="cp-label cp-label--success cp-label--bold">
              ADD NEW COMMENT
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default CPRubricCategory;
