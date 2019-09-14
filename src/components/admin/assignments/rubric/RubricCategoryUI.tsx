/* react imports */
import * as React from 'react';

/* ant imports */
import { Badge, Button, Icon, Input, InputNumber, Popconfirm, Spin, Table, Tag } from 'antd';

/* other library imports */
import _ from 'lodash';

/* codePost imports */
import CPButton from '../../../core/CPButton';
import CPFlex from '../../../core/CPFlex';
import CPPointInput from '../../../core/CPPointInput';
import CPTooltip from '../../../core/CPTooltip';
import { tooltips } from '../../../core/tooltips';

import { RubricCommentType } from '../../../../infrastructure/rubricComment';

import { DIRECTION } from '../../../../types/common';

const { TextArea } = Input;

const aligner: 'left' | 'center' | 'right' = 'center';
const commentTableColumns = [
  {
    title: 'Comment Text',
    dataIndex: 'text',
    key: 'text',
  },
  {
    title: (
      <div>
        Deduction
        <CPTooltip
          title={tooltips.admin.rubric.deduction}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
    ),
    dataIndex: 'deduction',
    key: 'deduction',
    align: aligner,
  },
  {
    title: (
      <div>
        Instances
        <CPTooltip
          title={tooltips.admin.rubric.instances}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
    ),
    key: 'linked',
    dataIndex: 'linked',
    align: aligner,
  },
  {
    title: (
      <div>
        Feedback
        <CPTooltip
          title={'Comprehension scores from students.'}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
    ),
    key: 'feedback',
    dataIndex: 'feedback',
    align: aligner,
  },
  {
    title: '',
    dataIndex: 'delete',
    key: 'delete',
    align: aligner,
  },
];

const RubricCategoryUI = ({ props, state, helpers }: any) => {
  console.log('zzzz', state.rubricCommentStatus);
  const buildCommentTableData = (
    rubricComments: RubricCommentType[],
    commentMap: { [id: number]: RubricCommentType },
  ) => {
    return rubricComments.map((rubricComment) => {
      const thisComment = commentMap[rubricComment.id];

      let thisFeedback;
      if (thisComment && props.feedbackScores && thisComment.id in props.feedbackScores) {
        thisFeedback = props.feedbackScores[thisComment.id];
      }

      if (thisComment) {
        const onChangeText = (e: any) => {
          helpers.updateRubricComment(thisComment.id, 'text', e);
        };

        const onChangePointDelta = (e: any) => {
          helpers.updateRubricComment(thisComment.id, 'pointDelta', e);
        };

        const saveComment = () => {
          helpers.saveComment(thisComment.id);
        };

        const deleteComment = (e: any) => {
          helpers.deleteComment(rubricComment, e);
        };

        const activateCommentExplorer = () => {
          props.activateCommentExplorer(thisComment);
        };

        return {
          key: thisComment.id,
          text: <TextArea autosize value={thisComment.text} onChange={onChangeText} onBlur={saveComment} />,
          deduction: (
            <CPPointInput value={-thisComment.pointDelta} size="small" onChange={onChangePointDelta} disabled={false} />
          ),
          linked: (
            <span onClick={activateCommentExplorer}>
              <Badge
                count={thisComment.comments.length}
                className="badge badge--standard"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
              />
            </span>
          ),
          feedback: !props.commentFeedbackOn ? (
            <Tag color="volcano" key="disabled">
              DISABLED
            </Tag>
          ) : thisFeedback === undefined ? (
            <Spin />
          ) : (
            `👎 ${thisFeedback.negative * 100}%   👍 ${thisFeedback.positive * 100}%`
          ),
          delete: (
            <CPTooltip title={tooltips.admin.rubric.deleteComment} hideThisOnHideTips={true}>
              <Icon type="delete" onClick={deleteComment} />
            </CPTooltip>
          ),
        };
      } else {
        const updateRubricCommentText = (e: any) => {
          helpers.updateRubricComment(rubricComment.id, 'text', e);
        };

        const updateRubricCommentPointDelta = (e: any) => {
          helpers.updateRubricComment(rubricComment.id, 'pointDelta', e);
        };

        const saveComment = () => {
          helpers.saveComment(rubricComment.id);
        };

        const deleteComment = (e: any) => {
          helpers.deleteComment(rubricComment, e);
        };

        return {
          key: rubricComment.id,
          text: <TextArea autosize value={''} onChange={updateRubricCommentText} onBlur={saveComment} />,
          deduction: (
            <CPPointInput
              value={-rubricComment.pointDelta}
              size="small"
              onChange={updateRubricCommentPointDelta}
              disabled={false}
            />
          ),
          linked: null,
          delete: (
            <CPTooltip title={tooltips.admin.rubric.deleteComment} hideThisOnHideTips={true}>
              <Icon type="delete" onClick={deleteComment} />
            </CPTooltip>
          ),
        };
      }
    });
  };

  const data = buildCommentTableData(props.rubricComments, state.rubricComments);

  const moveUp = () => {
    props.moveCategory(props.rubricCategory, DIRECTION.Up);
  };

  const moveDown = () => {
    props.moveCategory(props.rubricCategory, DIRECTION.Down);
  };

  const deleteCat = () => {
    props.deleteCategory(props.rubricCategory);
  };

  const setVal = (e: any) => {
    helpers.setValue('pointLimit', e);
  };

  const titleLeft = [
    <span key="title" className="cp-label cp-label--plus cp-label--bold">
      Category: {props.rubricCategory.name}
    </span>,
    <span key="buttons">
      <CPTooltip title={props.index === 0 ? '' : tooltips.admin.rubric.categoryUp} hideThisOnHideTips={true}>
        <Button icon="caret-up" size="small" onClick={moveUp} disabled={props.index === 0} />
      </CPTooltip>
      <CPTooltip
        title={props.index === props.numCategories - 1 ? '' : tooltips.admin.rubric.categoryDown}
        hideThisOnHideTips={true}
      >
        <Button icon="caret-down" size="small" disabled={props.index === props.numCategories - 1} onClick={moveDown} />
      </CPTooltip>
    </span>,
    state.hasError ? (
      <Tag color="volcano" key="warning">
        Error: {state.errorMessage}
      </Tag>
    ) : state.hasCommentError ? (
      <Tag color="volcano" key="warning">
        Error: {state.commentErrorMessage}
      </Tag>
    ) : null,
  ];
  const titleRight = [
    <Popconfirm key="delete" title="Are you sure you want to delete this category?" onConfirm={deleteCat}>
      <CPButton cpType="danger" fallback="delete">
        Delete
      </CPButton>
    </Popconfirm>,
  ];

  const categoryName = (
    <div key="name">
      <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
        Category Name
      </div>
      <Input value={state.name} onChange={helpers.changeName} onBlur={helpers.saveCategory} ref={helpers.nameInput} />
    </div>
  );

  const categoryPoints = (
    <div key="points">
      <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
        Category Point Limit
        <CPTooltip
          title={tooltips.admin.rubric.categoryPointLimit}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
      <div className="display-flex align-items-center">
        <CPPointInput
          value={state.pointLimit !== null ? -state.pointLimit : undefined}
          size="small"
          onChange={setVal}
          disabled={false}
          step={1}
        />
        <span onBlur={helpers.saveCategory}>
          <CPTooltip
            title={`Clear this category's point limit (so any number of points can
              be added or deducted using its rubric comments)`}
          >
            <Icon style={{ cursor: 'pointer' }} type="close-circle" onClick={setVal} />
          </CPTooltip>
        </span>
      </div>
    </div>
  );

  const helpText = (
    <div key="help-text" style={{ maxWidth: 300 }}>
      <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
        Category Help Text
        <CPTooltip
          title={tooltips.admin.rubric.categoryHelpText}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 5 }}
        />
      </div>
      <Input.TextArea
        style={{ width: 350 }}
        value={state.helpText}
        onChange={helpers.changeHelpText}
        onBlur={helpers.saveCategory}
        autosize={true}
      />
    </div>
  );

  const contentLeft =
    props.windowwidth < 1200 ? (
      <div>
        <CPFlex left={[categoryName, categoryPoints]} right={[]} gutterSize={60} />
        <CPFlex left={[helpText]} right={[]} gutterSize={60} style={{ paddingTop: 30 }} />
      </div>
    ) : (
      <CPFlex left={[categoryName, categoryPoints]} right={[helpText]} gutterSize={60} />
    );

  return (
    <div className="cp-rubric-category">
      <div className="cp-rubric-category__title ">
        <CPFlex left={titleLeft} right={titleRight} gutterSize={10} />
      </div>
      <div className="cp-rubric-category__content">
        {contentLeft}
        <div style={{ height: '40px' }} />
        <Table
          columns={commentTableColumns}
          dataSource={data}
          pagination={false}
          locale={{ emptyText: 'No comments yet' }}
        />
        <div className="cp-rubric-category__add-new-comment">
          <CPButton cpType="primary" icon="plus" onClick={helpers.addComment} />
          <span style={{ marginLeft: '20px' }} className="cp-label cp-label--success cp-label--bold">
            ADD NEW COMMENT
          </span>
        </div>
      </div>
    </div>
  );
};

export default RubricCategoryUI;
