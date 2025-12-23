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
  UserOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons';

import { Button, Empty, Input, Spin, Tag, Popconfirm, Switch, Divider } from 'antd';

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

const BUTTON_SPACING = '8px';

// Design Constants

/**********************************************************************************************************************/
/* Column Definitions
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
    showInstructions,
  } = props;
  const { rubricComments: stateRubricComments, atMostOnce } = state;

  const [activeComment, setActiveComment] = useState<RubricCommentType | undefined>(undefined);
  const [activeField, setActiveField] = useState<'explanation' | 'instructionText'>('explanation');

  /* Card-Based Layout Implementation */
  const renderCommentCards = useCallback(
    (rubricComments: RubricCommentType[], commentMap: { [id: number]: RubricCommentType }) => {
      return rubricComments.sort(RubricComment.compare).map((rubricComment) => {
        const thisComment = commentMap[rubricComment.id];

        let thisFeedback;
        if (thisComment && feedbackScores && thisComment.id in feedbackScores) {
          thisFeedback = feedbackScores[thisComment.id];
        }

        /* Accessors and Handlers */
        const currentComment = thisComment || rubricComment;
        const currentPointDelta = -currentComment.pointDelta;

        // Handlers
        const onChangeText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          helpers.updateRubricComment(currentComment.id, 'text', e);
        };
        const onChangePointDelta = (value: number) => {
          helpers.updateRubricComment(currentComment.id, 'pointDelta', value);
        };
        const saveComment = () => {
          helpers.saveComment(currentComment.id);
        };
        const deleteComment = () => {
          helpers.deleteComment(rubricComment);
        };
        const handleActivateCommentExplorer = () => {
          if (thisComment) activateCommentExplorer(thisComment);
        };
        const onDeleteField = (field: string) => {
          helpers.updateRubricComment(currentComment.id, field, '');
        };

        return (
          <div
            key={currentComment.id}
            style={{
              background: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            }}
          >
            {/* Left: Content */}
            <div style={{ flex: 1 }}>
              <TextArea
                autoSize
                value={currentComment.text || ''}
                onChange={onChangeText}
                onBlur={saveComment}
                variant="borderless"
                placeholder="Enter comment text..."
                style={{
                  width: '100%',
                  padding: 0,
                  fontSize: '14px',
                  color: '#262626',
                  resize: 'none',
                }}
              />

              {/* Metadata Row for Explanations/Instructions within the card content flow */}
              {(showExplanations || showInstructions) && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
                  {showExplanations && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Button
                        size="small"
                        type={currentComment.explanation ? 'link' : 'text'}
                        icon={!currentComment.explanation && <EditOutlined style={{ fontSize: '10px' }} />}
                        onClick={() => {
                          setActiveComment(currentComment);
                          setActiveField('explanation');
                        }}
                        style={{
                          padding: 0,
                          height: 'auto',
                          fontSize: '12px',
                          color: currentComment.explanation ? '#1890ff' : '#8c8c8c',
                        }}
                      >
                        {currentComment.explanation ? 'Edit Explanation' : 'Add Explanation'}
                      </Button>
                      {currentComment.explanation && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined style={{ fontSize: '10px' }} />}
                          onClick={() => onDeleteField('explanation')}
                          style={{ width: '16px', height: '16px', minWidth: 0 }}
                        />
                      )}
                    </div>
                  )}
                  {showInstructions && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Button
                        size="small"
                        type={currentComment.instructionText ? 'link' : 'text'}
                        icon={!currentComment.instructionText && <EditOutlined style={{ fontSize: '10px' }} />}
                        onClick={() => {
                          setActiveComment(currentComment);
                          setActiveField('instructionText');
                        }}
                        style={{
                          padding: 0,
                          height: 'auto',
                          fontSize: '12px',
                          color: currentComment.instructionText ? '#faad14' : '#8c8c8c',
                        }}
                      >
                        {currentComment.instructionText ? 'Edit Instructions' : 'Add Instructions'}
                      </Button>
                      {currentComment.instructionText && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined style={{ fontSize: '10px' }} />}
                          onClick={() => onDeleteField('instructionText')}
                          style={{ width: '16px', height: '16px', minWidth: 0 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Metadata & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* 1. Instances */}
              <CPTooltip title="Instances">
                <span
                  onClick={thisComment ? handleActivateCommentExplorer : undefined}
                  style={{
                    cursor: thisComment ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#8c8c8c',
                    fontSize: '12px',
                    gap: '4px',
                    minWidth: '40px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <UserOutlined style={{ fontSize: '12px' }} />
                  {instanceLists[currentComment.id] ? (
                    instanceLists[currentComment.id].length
                  ) : (
                    <Spin size="small" style={{ zoom: 0.5 }} />
                  )}
                </span>
              </CPTooltip>

              {/* 2. Feedback (Sentiment) */}
              {commentFeedbackOn && (
                <CPTooltip title="Student Feedback">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      minWidth: '60px',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {thisFeedback === undefined ? (
                      <span style={{ color: '#d9d9d9' }}>--</span>
                    ) : (
                      <>
                        <span style={{ color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <DislikeOutlined /> {Math.trunc(thisFeedback.negative * 100)}%
                        </span>
                        <span style={{ color: '#52c41a', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <LikeOutlined /> {Math.trunc(thisFeedback.positive * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </CPTooltip>
              )}

              {/* 3. Points Badge */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CPPointInput value={currentPointDelta} size="small" onChange={onChangePointDelta} disabled={false} />
              </div>
              {/* 4. Delete Action */}
              <CPTooltip title={tooltips.admin.rubric.deleteComment}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={deleteComment}
                  style={{ color: '#bfbfbf', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ff4d4f')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#bfbfbf')}
                />
              </CPTooltip>
            </div>
          </div>
        );
      });
    },
    [
      feedbackScores,
      instanceLists,
      activateCommentExplorer,
      helpers,
      showExplanations,
      showInstructions,
      commentFeedbackOn,
    ],
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

  /* Render Cards instead of Table */
  const cards = useMemo(
    () => renderCommentCards(rubricComments, stateRubricComments),
    [renderCommentCards, rubricComments, stateRubricComments],
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
    <div
      className="cp-rubric-category"
      style={{
        marginBottom: '24px',
        // Removed card styling from container, as items are now individual cards
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      }}
    >
      {/* Header (Category Name & Actions) */}
      <div
        style={{
          padding: '0 0 16px 0', // Adjusted padding
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ flex: 1, maxWidth: '400px' }}>
            <Input
              value={state.name}
              onChange={helpers.changeName}
              onBlur={helpers.saveCategory}
              ref={helpers.nameInput}
              placeholder="Category Name"
              size="large"
              variant="borderless"
              style={{ fontSize: '18px', fontWeight: 600, padding: 0 }}
            />
          </div>

          <div style={{ display: 'flex', gap: BUTTON_SPACING }}>
            <CPTooltip title={categoryIndex === 0 ? 'First category' : 'Move category up'} hideThisOnHideTips={true}>
              <Button
                icon={<CaretUpOutlined />}
                size="small"
                onClick={moveUp}
                disabled={categoryIndex === 0}
                type="text"
              />
            </CPTooltip>
            <CPTooltip
              title={categoryIndex === numCategories - 1 ? 'Last category' : 'Move category down'}
              hideThisOnHideTips={true}
            >
              <Button
                icon={<CaretDownOutlined />}
                size="small"
                disabled={categoryIndex === numCategories - 1}
                onClick={moveDown}
                type="text"
              />
            </CPTooltip>
          </div>

          {state.hasError && (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              {state.errorMessage}
            </Tag>
          )}
          {state.hasCommentError && (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              {state.commentErrorMessage}
            </Tag>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Popconfirm
            title="Delete this category?"
            description="This action cannot be undone. All rubric comments in this category will be deleted."
            onConfirm={deleteCat}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Settings Bar - Horizontal Layout */}
        {(props.showPointLimits || props.showHelpText || props.showAtMostOnce) && (
          <div
            style={{
              display: 'flex',
              gap: '24px',
              marginBottom: '24px',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              padding: '12px 16px',
              background: '#fff',
              borderRadius: '6px',
              border: '1px solid #f0f0f0',
            }}
          >
            {props.showPointLimits && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#8c8c8c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Max Points
                  <CPTooltip
                    title={tooltips.admin.rubric.categoryPointLimit}
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ marginLeft: 4 }}
                  />
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CPPointInput
                    value={state.pointLimit !== null ? -state.pointLimit : undefined}
                    size="small"
                    onChange={setVal}
                    disabled={false}
                    step={1}
                  />
                  <CPTooltip title="Clear point limit">
                    <Button
                      icon={<CloseCircleOutlined />}
                      type="text"
                      size="small"
                      onClick={clearPointLimit}
                      onBlur={helpers.saveCategory}
                      disabled={state.pointLimit === null}
                      style={{ color: '#bfbfbf' }}
                    />
                  </CPTooltip>
                </div>
              </div>
            )}

            {props.showHelpText && (
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#8c8c8c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Help Text
                  <CPTooltip
                    title={tooltips.admin.rubric.categoryHelpText}
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ marginLeft: 4 }}
                  />
                </span>
                <Input.TextArea
                  value={state.helpText}
                  onChange={helpers.changeHelpText}
                  onBlur={helpers.saveCategory}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  placeholder="Guidance for graders..."
                  style={{ resize: 'none', fontSize: '13px' }}
                />
              </div>
            )}

            {props.showAtMostOnce && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#8c8c8c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Limits
                  <CPTooltip
                    infoIcon={true}
                    title="If enabled, this category can be applied at most once to any submission"
                    iconStyle={{ marginLeft: 4 }}
                  />
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '32px' }}>
                  <Switch size="small" checked={state.atMostOnce} onChange={toggleAtMostOnce} />
                  <span style={{ fontSize: '13px', color: '#595959' }}>At most once</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comments Section */}
        <div>
          {/* Add Comment Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#262626' }}>Comments</span>
              <Tag style={{ margin: 0, border: 'none', background: '#f5f5f5', color: '#595959' }}>
                {rubricComments.length}
              </Tag>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={helpers.addComment}>
              Add Criteria
            </Button>
          </div>

          <Divider style={{ margin: '24px 0' }} />

          <div style={{ marginTop: '8px' }}>
            {cards}

            {/* Empty State */}
            {rubricComments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#bfbfbf' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No criteria defined" />
              </div>
            )}
          </div>
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
