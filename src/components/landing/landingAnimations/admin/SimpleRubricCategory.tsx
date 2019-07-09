import * as React from 'react';

import { Badge, Icon, Input, Table } from 'antd';

import CPButton from '../../../../components/core/CPButton';
import CPFlex from '../../../../components/core/CPFlex';

import { RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../../infrastructure/rubricComment';

type alignType = 'left' | 'right' | 'center';

interface ICPRubricCategoryProps {
  rubricCategory: RubricCategoryType;
  rubricComments: RubricCommentType[];

  // deleteCategory: () =>;

  // addComment: () => ;
  // deleteComment: () => ;
}
const centerAlign: alignType = 'center';
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
    align: centerAlign,
  },
  {
    title: 'Usage Frequency',
    key: 'linked',
    dataIndex: 'linked',
    align: centerAlign,
    render: (count: number, record: any) => (
      <Badge count={count} className="badge badge--standard" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
    ),
  },
  {
    title: '',
    dataIndex: 'delete',
    key: 'delete',
    align: centerAlign,
    render: (record: any) => <Icon type="delete" />,
  },
];

class SimpleRubricCategory extends React.Component<ICPRubricCategoryProps, {}> {
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

    const content = [
      <div key="name">
        <div className="cp-label cp-label--bold" style={{}}>
          Category Name
        </div>
        <Input value={this.props.rubricCategory.name} />
      </div>,
      <div key="points">
        <div className="cp-label cp-label--bold" style={{}}>
          Category Point Limit
        </div>
        <Input value={'3.0'} />
      </div>,
    ];

    // Should we have Add New Category within this table?
    return (
      <div style={{ marginBottom: 10 }}>
        <div className="cp-rubric-category__content" style={{ paddingBottom: 60, paddingLeft: 15, paddingRight: 15 }}>
          <CPFlex left={content} right={[]} gutterSize={60} />
          <div style={{ height: '40px' }} />
          <Table columns={commentTableColumns} dataSource={data} pagination={false} />
          <div className="cp-rubric-category__add-new-comment" style={{ bottom: 10 }}>
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

export default SimpleRubricCategory;
