import * as React from 'react';

import { Badge, Icon, Input, Table } from 'antd';

import CPButton from './CPButton';
import CPPointInput from './CPPointInput';

import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';

interface ICPRubricCategoryProps {
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];

  // deleteCategory: () =>;

  // addComment: () => ;
  // deleteComment: () => ;
}

const commentTableColumns = [
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
    render: (record: any) => <Icon type="delete" />,
  },
];

class CPRubricCategory extends React.Component<ICPRubricCategoryProps, {}> {
  public buildCommentTableData = (rubricComments: RubricCommentType[]) => {
    return rubricComments.map((rubricComment: RubricCommentType, index: number) => {
      return {
        key: index,
        text: rubricComment.text,
        deduction: rubricComment.pointDelta,
        linked: rubricComment.comments.length,
      };
    });
  };

  public render() {
    const data = this.buildCommentTableData(this.props.rubricComments);

    // Should we have Add New Category within this table?
    return (
      <div className="cp-rubric-category">
        <div className="cp-rubric-category__title ">
          <div className="cp-flex--normal">
            <div className="left">
              <span className="cp-label cp-label--plus cp-label--bold">Category: {this.props.rubricCategory.name}</span>
            </div>
            <div className="gap" />
            <div className="right">
              <CPButton cpType="danger" fallback="delete">
                Delete
              </CPButton>
            </div>
            <div className="right">
              <CPButton cpType="secondary" icon="plus" fallback="plus">
                Add New Category
              </CPButton>
            </div>
          </div>
        </div>
        <div className="cp-rubric-category__content">
          <div className="cp-flex--very-wide">
            <div className="left">
              <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
                Category Name
              </div>
              <Input value={this.props.rubricCategory.name} />
            </div>
            <div className="left">
              <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
                Category Point Limit
              </div>
              <CPPointInput value={3} size="default" />
            </div>
            <div className="gap" />
          </div>
          <div style={{ height: '40px' }} />
          <Table columns={commentTableColumns} dataSource={data} pagination={false} />
          <div className="cp-rubric-category__add-new-comment">
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
