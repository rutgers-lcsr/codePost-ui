/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useCallback, useMemo, useState } from 'react';

import {
  CaretDownOutlined,
  CaretUpOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';

import { Badge, Button, Input, Popconfirm, Spin, Switch, Table, Tag } from 'antd';

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

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const TOOLTIP_ICON_PADDING_LEFT = 5;
const TEXTAREA_WIDTH = '80%';
const TEXT_FLEX_STYLE = { display: 'flex' } as const;

// Design Constants
const CATEGORY_HEADER_BG = '#fafafa';
const CATEGORY_HEADER_BORDER = '#e8e8e8';
const SETTINGS_CARD_BG = '#ffffff';
const SETTINGS_CARD_BORDER = '#f0f0f0';
const EXPLANATION_BG = '#f0fff7';
const INSTRUCTION_BG = '#fff7e6';

// Spacing Constants
const HEADER_PADDING = '16px 24px';
const CONTENT_PADDING = '24px';
const CARD_MARGIN_BOTTOM = '16px';
const SECTION_SPACING = '24px';
const BUTTON_SPACING = '8px';

/**********************************************************************************************************************/
/* Column Definitions
/**********************************************************************************************************************/

const COLUMN_ALIGNMENT: 'left' | 'center' | 'right' = 'center';

// Need to rename deductions to just points.

const commentTableColumns = [
  {
    title: 'Comment Text',
    dataIndex: 'text',
    key: 'text',
  },
  {
    title: (
      <div>
        Points
        <CPTooltip
          title={tooltips.admin.rubric.deduction}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: TOOLTIP_ICON_PADDING_LEFT }}
        />
      </div>
    ),
    dataIndex: 'deduction',
    key: 'deduction',
    align: COLUMN_ALIGNMENT,
  },
  {
    title: (
      <div>
        Instances
        <CPTooltip
          title={tooltips.admin.rubric.instances}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: TOOLTIP_ICON_PADDING_LEFT }}
        />
      </div>
    ),
    key: 'linked',
    dataIndex: 'linked',
    align: COLUMN_ALIGNMENT,
  },
  {
    title: 'Explanations',
    key: 'explanation',
    dataIndex: 'explanation',
    align: COLUMN_ALIGNMENT,
  },
  {
    title: 'Instructions',
    key: 'instruction',
    dataIndex: 'instruction',
    align: COLUMN_ALIGNMENT,
  },
  {
    title: (
      <div>
        Feedback
        <CPTooltip
          title={'Comprehension scores from students.'}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: TOOLTIP_ICON_PADDING_LEFT }}
        />
      </div>
    ),
    key: 'feedback',
    dataIndex: 'feedback',
    align: COLUMN_ALIGNMENT,
  },
  {
    title: '',
    dataIndex: 'delete',
    key: 'delete',
    align: COLUMN_ALIGNMENT,
  },
];

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

interface IProps {
  baseURL: string;
}

/**********************************************************************************************************************/
/* Component
/**********************************************************************************************************************/

const RubricCategoryUI: React.FC<{
  props: IRubricCategoryManagerProps & IProps;
  state: IRubricCategoryManagerState;
  helpers: IRubricCategoryManagerHelpers;
}> = ({ props, state, helpers }) => {
  // Destructure props for better hook dependencies
  const {
    feedbackScores,
    instanceLists,
    activateCommentExplorer,
    rubricComments,
    moveCategory,
    rubricCategory,
    deleteCategory,
    index: categoryIndex,
    showExplanations,
    commentFeedbackOn,
    numCategories,
  } = props;
  const { rubricComments: stateRubricComments, atMostOnce } = state;

  const [activeComment, setActiveComment] = useState<RubricCommentType | undefined>(undefined);
  const [activeField, setActiveField] = useState<'explanation' | 'instructionText'>('explanation');

  const buildCommentTableData = useCallback(
    (rubricComments: RubricCommentType[], commentMap: { [id: number]: RubricCommentType }) => {
      return rubricComments.sort(RubricComment.compare).map((rubricComment) => {
        const thisComment = commentMap[rubricComment.id];

        let thisFeedback;
        if (thisComment && feedbackScores && thisComment.id in feedbackScores) {
          thisFeedback = feedbackScores[thisComment.id];
        }

        if (thisComment) {
          const onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            helpers.updateRubricComment(thisComment.id, 'text', e);
          };

          const onChangePointDelta = (value: number) => {
            helpers.updateRubricComment(thisComment.id, 'pointDelta', value);
          };

          const onDeleteField = (field: string) => {
            helpers.updateRubricComment(thisComment.id, field, '');
          };

          const saveComment = () => {
            helpers.saveComment(thisComment.id);
          };

          const deleteComment = () => {
            helpers.deleteComment(rubricComment);
          };

          const handleActivateCommentExplorer = () => {
            activateCommentExplorer(thisComment);
          };
          return {
            key: thisComment.id,
            text: (
              <span style={TEXT_FLEX_STYLE}>
                <TextArea
                  autoSize
                  value={thisComment.text}
                  onChange={onChangeText}
                  onBlur={saveComment}
                  style={{ width: TEXTAREA_WIDTH }}
                />
                &nbsp;
              </span>
            ),
            deduction: (
              <CPPointInput
                value={-thisComment.pointDelta}
                size="small"
                onChange={onChangePointDelta}
                disabled={false}
              />
            ),
            linked: (
              <span onClick={handleActivateCommentExplorer}>
                {instanceLists[thisComment.id] ? (
                  <Badge
                    count={instanceLists[thisComment.id].length}
                    className="badge badge--standard"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
                  />
                ) : (
                  <Spin />
                )}
              </span>
            ),
            explanation: showExplanations ? (
              <span style={{ verticalAlign: 'middle', display: 'flex', gap: '4px' }}>
                <CPTooltip title={thisComment.explanation ? 'Edit explanation' : 'Add explanation'}>
                  <CPButton
                    icon={<EditOutlined />}
                    style={{ background: thisComment.explanation ? EXPLANATION_BG : undefined }}
                    onClick={() => {
                      setActiveComment(thisComment);
                      setActiveField('explanation');
                    }}
                  />
                </CPTooltip>
                {thisComment.explanation && (
                  <CPTooltip title="Delete explanation">
                    <CPButton
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        onDeleteField('explanation');
                      }}
                    />
                  </CPTooltip>
                )}
              </span>
            ) : undefined,
            instruction: (
              <span style={{ verticalAlign: 'middle', display: 'flex', gap: '4px' }}>
                <CPTooltip title={thisComment.instructionText ? 'Edit instructions' : 'Add instructions'}>
                  <CPButton
                    icon={<EditOutlined />}
                    style={{ background: thisComment.instructionText ? INSTRUCTION_BG : undefined }}
                    onClick={() => {
                      setActiveComment(thisComment);
                      setActiveField('instructionText');
                    }}
                  />
                </CPTooltip>
                {thisComment.instructionText && (
                  <CPTooltip title="Delete instructions">
                    <CPButton
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        onDeleteField('instructionText');
                      }}
                    />
                  </CPTooltip>
                )}
              </span>
            ),
            feedback: !commentFeedbackOn ? (
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
          const updateRubricCommentText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            helpers.updateRubricComment(rubricComment.id, 'text', e);
          };

          const updateRubricCommentPointDelta = (value: number) => {
            helpers.updateRubricComment(rubricComment.id, 'pointDelta', value);
          };

          const saveComment = () => {
            helpers.saveComment(rubricComment.id);
          };

          const deleteComment = () => {
            helpers.deleteComment(rubricComment);
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
    },
    [feedbackScores, instanceLists, activateCommentExplorer, helpers, showExplanations, commentFeedbackOn],
  );
  const moveUp = useCallback(() => {
    moveCategory(rubricCategory, DIRECTION.Up);
  }, [moveCategory, rubricCategory]);

  const moveDown = useCallback(() => {
    moveCategory(rubricCategory, DIRECTION.Down);
  }, [moveCategory, rubricCategory]);

  const deleteCat = useCallback(() => {
    deleteCategory(rubricCategory);
  }, [deleteCategory, rubricCategory]);

  const setVal = useCallback(
    (value: number) => {
      helpers.setValue('pointLimit', value);
    },
    [helpers],
  );

  const clearPointLimit = useCallback(() => {
    helpers.setValue('pointLimit', null);
  }, [helpers]);

  const toggleAtMostOnce = useCallback(() => {
    helpers.setValue('atMostOnce', !atMostOnce);
  }, [helpers, atMostOnce]);

  const data = useMemo(
    () => buildCommentTableData(rubricComments, stateRubricComments),
    [buildCommentTableData, rubricComments, stateRubricComments],
  );

  // Enhanced Header with better visual hierarchy
  const headerStyle = useMemo(
    () => ({
      background: CATEGORY_HEADER_BG,
      borderBottom: `2px solid ${CATEGORY_HEADER_BORDER}`,
      padding: HEADER_PADDING,
      borderRadius: '8px 8px 0 0',
    }),
    [],
  );

  const categoryTitleStyle = useMemo(
    () => ({
      fontSize: '18px',
      fontWeight: 600,
      color: '#262626',
      marginRight: '16px',
    }),
    [],
  );

  const titleLeft = [
    <div key="title-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={categoryTitleStyle}>{rubricCategory.name}</span>
      <div style={{ display: 'flex', gap: BUTTON_SPACING }}>
        <CPTooltip title={categoryIndex === 0 ? 'First category' : 'Move category up'} hideThisOnHideTips={true}>
          <Button
            icon={<CaretUpOutlined />}
            size="middle"
            onClick={moveUp}
            disabled={categoryIndex === 0}
            type={categoryIndex === 0 ? 'default' : 'primary'}
          />
        </CPTooltip>
        <CPTooltip
          title={categoryIndex === numCategories - 1 ? 'Last category' : 'Move category down'}
          hideThisOnHideTips={true}
        >
          <Button
            icon={<CaretDownOutlined />}
            size="middle"
            disabled={categoryIndex === numCategories - 1}
            onClick={moveDown}
            type={categoryIndex === numCategories - 1 ? 'default' : 'primary'}
          />
        </CPTooltip>
      </div>
    </div>,
    state.hasError ? (
      <Tag color="error" key="warning" icon={<CloseCircleOutlined />}>
        {state.errorMessage}
      </Tag>
    ) : state.hasCommentError ? (
      <Tag color="error" key="warning" icon={<CloseCircleOutlined />}>
        {state.commentErrorMessage}
      </Tag>
    ) : null,
  ];

  const titleRight = [
    <Popconfirm
      key="delete"
      title="Delete this category?"
      description="This action cannot be undone. All rubric comments in this category will be deleted."
      onConfirm={deleteCat}
      okText="Yes, Delete"
      cancelText="Cancel"
      okButtonProps={{ danger: true }}
    >
      <Button danger icon={<DeleteOutlined />}>
        Delete Category
      </Button>
    </Popconfirm>,
  ];

  // Enhanced Settings Cards
  const settingCardStyle = useMemo(
    () => ({
      background: SETTINGS_CARD_BG,
      border: `1px solid ${SETTINGS_CARD_BORDER}`,
      borderRadius: '6px',
      padding: '16px',
      marginBottom: CARD_MARGIN_BOTTOM,
    }),
    [],
  );

  const labelStyle = useMemo(
    () => ({
      fontSize: '14px',
      fontWeight: 600,
      color: '#595959',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    }),
    [],
  );

  const categoryName = (
    <div key="name" style={settingCardStyle}>
      <div style={labelStyle}>
        <span>Category Name</span>
      </div>
      <Input
        value={state.name}
        onChange={helpers.changeName}
        onBlur={helpers.saveCategory}
        ref={helpers.nameInput}
        placeholder="Enter category name..."
        size="large"
      />
    </div>
  );

  const categoryPoints = props.showPointLimits ? (
    <div key="points" style={settingCardStyle}>
      <div style={labelStyle}>
        <span>Point Limit</span>
        <CPTooltip
          title={tooltips.admin.rubric.categoryPointLimit}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ marginLeft: 4 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CPPointInput
          value={state.pointLimit !== null ? -state.pointLimit : undefined}
          size="small"
          onChange={setVal}
          disabled={false}
          step={1}
        />
        <CPTooltip title="Clear point limit (allow unlimited points)">
          <Button
            icon={<CloseCircleOutlined />}
            onClick={clearPointLimit}
            onBlur={helpers.saveCategory}
            disabled={state.pointLimit === null}
          >
            Clear
          </Button>
        </CPTooltip>
      </div>
    </div>
  ) : null;

  const helpText = props.showHelpText ? (
    <div key="help-text" style={settingCardStyle}>
      <div style={labelStyle}>
        <span>Help Text</span>
        <CPTooltip
          title={tooltips.admin.rubric.categoryHelpText}
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ marginLeft: 4 }}
        />
      </div>
      <Input.TextArea
        value={state.helpText}
        onChange={helpers.changeHelpText}
        onBlur={helpers.saveCategory}
        autoSize={{ minRows: 2, maxRows: 6 }}
        placeholder="Add helpful guidance for graders..."
      />
    </div>
  ) : null;

  const atMostOnceToggle = props.showAtMostOnce ? (
    <div key="atMostOnce" style={settingCardStyle}>
      <div style={labelStyle}>
        <span>"At Most Once" Mode</span>
        <CPTooltip
          infoIcon={true}
          title="If enabled, this category can be applied at most once to any submission"
          iconStyle={{ marginLeft: 4 }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Switch checked={state.atMostOnce} onChange={toggleAtMostOnce} />
        <span style={{ color: '#8c8c8c', fontSize: '13px' }}>
          {state.atMostOnce ? 'Limited to one application' : 'Can be applied multiple times'}
        </span>
      </div>
    </div>
  ) : null;

  // Better responsive layout
  const contentStyle = useMemo(
    () => ({
      padding: CONTENT_PADDING,
      background: '#fff',
    }),
    [],
  );

  const settingsGridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: props.windowwidth < 1200 ? '1fr' : 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: SECTION_SPACING,
    }),
    [props.windowwidth],
  );

  const contentLeft = (
    <div style={settingsGridStyle}>
      {categoryName}
      {categoryPoints}
      {helpText}
      {atMostOnceToggle}
    </div>
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

  // Enhanced table section header
  const tableSectionStyle = useMemo(
    () => ({
      marginBottom: SECTION_SPACING,
    }),
    [],
  );

  const tableTitleStyle = useMemo(
    () => ({
      fontSize: '16px',
      fontWeight: 600,
      color: '#262626',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }),
    [],
  );

  return (
    <div className="cp-rubric-category" style={{ marginBottom: '32px' }}>
      <div style={headerStyle}>
        <CPFlex left={titleLeft} right={titleRight} gutterSize={10} />
      </div>
      <div style={contentStyle}>
        {contentLeft}
        <div style={tableSectionStyle}>
          <div style={tableTitleStyle}>
            <span>Rubric Comments ({data.length})</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={helpers.addComment} size="large">
              Add Comment
            </Button>
          </div>
          <Table
            columns={commentTableColumns.filter((el) => toRemove.indexOf(el.key) === -1)}
            dataSource={data}
            pagination={false}
            locale={{ emptyText: 'No comments yet. Click "Add Comment" to create your first rubric comment.' }}
            bordered
            size="middle"
          />
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
