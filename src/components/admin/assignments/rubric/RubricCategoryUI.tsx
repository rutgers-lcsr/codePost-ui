/* react imports */
import * as React from 'react';

import {
  CaretDownOutlined,
  CaretUpOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';

/* ant imports */
import { Badge, Button, Input, Popconfirm, Spin, Switch, Table, Tag } from 'antd';

/* codePost imports */
import CPButton from '../../../core/CPButton';
import CPFlex from '../../../core/CPFlex';
import CPPointInput from '../../../core/CPPointInput';
import CPTooltip from '../../../core/CPTooltip';
import { tooltips } from '../../../core/tooltips';

import {
  IRubricCategoryManagerHelpers,
  IRubricCategoryManagerProps,
  IRubricCategoryManagerState,
} from '../../../core/rubric/RubricCategoryManager';

import { RubricComment, RubricCommentType } from '../../../../infrastructure/rubricComment';

import { DIRECTION } from '../../../../types/common';

import ExplanationModal from './ExplanationModal';

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
    title: 'Explanations',
    key: 'explanation',
    dataIndex: 'explanation',
    align: aligner,
  },
  {
    title: 'Instructions',
    key: 'instruction',
    dataIndex: 'instruction',
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

interface IProps {
  baseURL: string;
}

const RubricCategoryUI = ({
  props,
  state,
  helpers,
}: {
  props: IRubricCategoryManagerProps & IProps;
  state: IRubricCategoryManagerState;
  helpers: IRubricCategoryManagerHelpers;
}) => {
  const [activeComment, setActiveComment] = React.useState(undefined as RubricCommentType | undefined);
  const [activeField, setActiveField] = React.useState<'explanation' | 'instructionText'>('explanation');

  const buildCommentTableData = (
    rubricComments: RubricCommentType[],
    commentMap: { [id: number]: RubricCommentType },
  ) => {
    return rubricComments.sort(RubricComment.compare).map((rubricComment) => {
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

        const onDeleteField = (field: string) => {
          helpers.updateRubricComment(thisComment.id, field, '');
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
          text: (
            <span style={{ display: 'flex' }}>
              <TextArea
                autoSize
                value={thisComment.text}
                onChange={onChangeText}
                onBlur={saveComment}
                style={{ width: '80%' }}
              />
              &nbsp;
            </span>
          ),
          deduction: (
            <CPPointInput value={-thisComment.pointDelta} size="small" onChange={onChangePointDelta} disabled={false} />
          ),
          linked: (
            <span onClick={activateCommentExplorer}>
              {props.instanceLists[thisComment.id] ? (
                <Badge
                  count={props.instanceLists[thisComment.id].length}
                  className="badge badge--standard"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
                />
              ) : (
                <Spin />
              )}
            </span>
          ),
          explanation: props.showExplanations ? (
            <span style={{ verticalAlign: 'middle' }}>
              <CPTooltip title="Edit comment's explanation" key={rubricComment.id}>
                <CPButton
                  icon={<EditOutlined />}
                  style={{ background: thisComment.explanation ? '#f0fff7' : undefined }}
                  onClick={() => {
                    setActiveComment(thisComment);
                    setActiveField('explanation');
                  }}
                />
              </CPTooltip>
              <CPTooltip
                title="Delete comment's explanation"
                key={rubricComment.id}
                disabled={!thisComment.explanation}
              >
                <CPButton
                  icon={<DeleteOutlined />}
                  disabled={!thisComment.explanation}
                  onClick={() => {
                    onDeleteField('explanation');
                  }}
                />
              </CPTooltip>
            </span>
          ) : undefined,
          instruction: (
            <span style={{ verticalAlign: 'middle' }}>
              <CPTooltip title="Edit comment's instructions" key={rubricComment.id}>
                <CPButton
                  icon={<EditOutlined />}
                  style={{ background: thisComment.instructionText ? '#f0fff7' : undefined }}
                  onClick={() => {
                    setActiveComment(thisComment);
                    setActiveField('instructionText');
                  }}
                />
              </CPTooltip>
              <CPTooltip
                title="Delete comment's instructions"
                key={rubricComment.id}
                disabled={!thisComment.instructionText}
              >
                <CPButton
                  icon={<DeleteOutlined />}
                  disabled={!thisComment.instructionText}
                  onClick={() => {
                    onDeleteField('instructionText');
                  }}
                />
              </CPTooltip>
            </span>
          ),
          feedback: !props.commentFeedbackOn ? (
            <Tag color="volcano" key="disabled">
              DISABLED
            </Tag>
          ) : thisFeedback === undefined ? (
            <Spin />
          ) : (
            `👎 ${Math.trunc(thisFeedback.negative * 100)}%   👍 ${Math.trunc(thisFeedback.positive * 100)}%`
          ),
          delete: (
            <CPTooltip title={tooltips.admin.rubric.deleteComment} hideThisOnHideTips={true}>
              <DeleteOutlined onClick={deleteComment} />
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
          text: <TextArea autoSize value={''} onChange={updateRubricCommentText} onBlur={saveComment} />,
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
              <DeleteOutlined onClick={deleteComment} />
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

  const clearPointLimit = () => {
    helpers.setValue('pointLimit', null);
  };

  const toggleAtMostOnce = () => {
    helpers.setValue('atMostOnce', !state.atMostOnce);
  };

  const titleLeft = [
    <span key="title" className="cp-label cp-label--plus cp-label--bold">
      Category: {props.rubricCategory.name}
    </span>,
    <span key="buttons">
      <CPTooltip title={props.index === 0 ? '' : tooltips.admin.rubric.categoryUp} hideThisOnHideTips={true}>
        <Button icon={<CaretUpOutlined />} size="small" onClick={moveUp} disabled={props.index === 0} />
      </CPTooltip>
      <CPTooltip
        title={props.index === props.numCategories - 1 ? '' : tooltips.admin.rubric.categoryDown}
        hideThisOnHideTips={true}
      >
        <Button
          icon={<CaretDownOutlined />}
          size="small"
          disabled={props.index === props.numCategories - 1}
          onClick={moveDown}
        />
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

  const categoryPoints = props.showPointLimits ? (
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
            <CloseCircleOutlined style={{ cursor: 'pointer' }} onClick={clearPointLimit} />
          </CPTooltip>
        </span>
      </div>
    </div>
  ) : null;

  const helpText = props.showHelpText ? (
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
        autoSize={true}
      />
    </div>
  ) : null;

  const atMostOnceToggle = props.showAtMostOnce ? (
    <div key="atMostOnce" style={{ maxWidth: 300 }}>
      <div className="cp-label cp-label--bold" style={{ marginBottom: '7px' }}>
        "At Most Once" Mode{' '}
        <CPTooltip infoIcon={true} title={'If applied, this category can be applied at most once to any submission.'} />
      </div>
      <Switch checked={state.atMostOnce} onChange={toggleAtMostOnce} />
    </div>
  ) : null;

  const contentLeft =
    props.windowwidth < 1200 ? (
      <div>
        <CPFlex left={[categoryName, categoryPoints]} right={[]} gutterSize={60} />
        <CPFlex left={[helpText, atMostOnceToggle]} right={[]} gutterSize={60} style={{ paddingTop: 30 }} />
      </div>
    ) : (
      <CPFlex left={[categoryName, categoryPoints, atMostOnceToggle]} right={[helpText]} gutterSize={60} />
    );

  const setField = (field: 'explanation' | 'instructionText', draft?: string) => {
    if (activeComment) {
      helpers.updateRubricComment(activeComment.id, field, draft);
      setActiveComment(undefined);
    }
  };

  const toRemove: string[] = [];
  if (!props.showExplanations) {
    toRemove.push('explanation');
  }
  if (!props.showInstructions) {
    toRemove.push('instruction');
  }

  return (
    <div className="cp-rubric-category">
      <div className="cp-rubric-category__title ">
        <CPFlex left={titleLeft} right={titleRight} gutterSize={10} />
      </div>
      <div className="cp-rubric-category__content">
        {contentLeft}
        <div style={{ height: '40px' }} />
        <Table
          columns={commentTableColumns.filter((el) => toRemove.indexOf(el.key) === -1)}
          dataSource={data}
          pagination={false}
          locale={{ emptyText: 'No comments yet' }}
        />
        <div className="cp-rubric-category__add-new-comment">
          <CPButton cpType="primary" icon={<PlusOutlined />} onClick={helpers.addComment} />
          <span style={{ marginLeft: '20px' }} className="cp-label cp-label--success cp-label--bold">
            ADD NEW COMMENT
          </span>
        </div>
      </div>
      {activeComment ? (
        <ExplanationModal
          title={activeComment.text}
          startText={activeComment[activeField]}
          onCancel={() => {
            setActiveComment(undefined);
          }}
          onSave={setField.bind({}, activeField)}
          extra={
            activeField === 'instructionText' ? (
              <span>
                Use as template:{' '}
                <Switch
                  defaultChecked={activeComment.templateTextOn}
                  onChange={() =>
                    helpers.updateRubricComment(activeComment.id, 'templateTextOn', !activeComment.templateTextOn)
                  }
                />
                <CPTooltip
                  title={
                    'If on, this instruction text will be made available for graders to edit directly in the custom text area of a rubric comment instance.'
                  }
                  infoIcon={true}
                  hideThisOnHideTips={true}
                  iconStyle={{ paddingLeft: 5 }}
                />
              </span>
            ) : undefined
          }
        />
      ) : null}
    </div>
  );
};

export default RubricCategoryUI;
