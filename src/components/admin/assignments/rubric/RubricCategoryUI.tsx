// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useCallback, useMemo, useState } from 'react';

import {
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  LikeOutlined,
  DislikeOutlined,
} from '@ant-design/icons';

import { Button, Empty, Input, Spin, Tag, Switch, Divider, Space } from 'antd';

import CPPointInput from '../../../core/CPPointInput';
import CPTooltip from '../../../core/CPTooltip';
import { tooltips } from '../../../core/tooltips';

import {
  IRubricCategoryManagerHelpers,
  IRubricCategoryManagerProps,
  IRubricCategoryManagerState,
} from '../../../core/rubric/RubricCategoryManager';

import { RubricComment } from '../../../../api-client';

import ExplanationModal from './ExplanationModal';
import { compareRubricComments } from './RubricUtils';

const { TextArea } = Input;

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

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
    showExplanations,
    commentFeedbackOn,
    showInstructions,
  } = props;
  const { rubricComments: stateRubricComments, atMostOnce } = state;

  const [activeComment, setActiveComment] = useState<RubricComment | undefined>(undefined);
  const [activeField, setActiveField] = useState<'explanation' | 'instructionText'>('explanation');

  /* Card-Based Layout Implementation */
  const renderCommentCards = useCallback(
    (rubricComments: RubricComment[], commentMap: { [id: number]: RubricComment }) => {
      return rubricComments.sort(compareRubricComments).map((rubricComment) => {
        const thisComment = commentMap[rubricComment.id];

        let thisFeedback;
        if (thisComment && feedbackScores && thisComment.id in feedbackScores) {
          thisFeedback = feedbackScores[thisComment.id];
        }

        /* Accessors and Handlers */
        const currentComment = thisComment || rubricComment;
        const currentPointDelta = currentComment.pointDelta;

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
          <div style={{ flex: 1, maxWidth: '100%' }}>
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
      </div>

      <div style={{ padding: '24px' }}>
        {/* Settings Bar - Structured Layout */}
        {(props.showPointLimits || props.showHelpText || props.showAtMostOnce) && (
          <div
            style={{
              marginBottom: '24px',
              padding: '20px 24px',
              background: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
            }}
          >
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              {/* Top Row: Constraints */}
              {(props.showPointLimits || props.showAtMostOnce) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px' }}>
                  {props.showPointLimits && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#262626',
                        }}
                      >
                        Max Points
                        <CPTooltip
                          title={tooltips.admin.rubric.categoryPointLimit}
                          infoIcon={true}
                          hideThisOnHideTips={true}
                          iconStyle={{ marginLeft: 6, color: '#8c8c8c' }}
                        />
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CPPointInput
                          value={state.pointLimit !== null ? -state.pointLimit : undefined}
                          size="default"
                          onChange={setVal}
                          disabled={false}
                          step={1}
                        />
                        <CPTooltip title="Clear point limit">
                          <Button
                            icon={<CloseCircleOutlined />}
                            type="text"
                            onClick={clearPointLimit}
                            // helpers object is stable across renders
                            onBlur={helpers.saveCategory}
                            disabled={state.pointLimit === null}
                            style={{ color: state.pointLimit === null ? 'transparent' : '#bfbfbf' }}
                          />
                        </CPTooltip>
                      </div>
                    </div>
                  )}

                  {props.showAtMostOnce && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#262626',
                        }}
                      >
                        Limits
                        <CPTooltip
                          infoIcon={true}
                          title="If enabled, this category can be applied at most once to any submission"
                          iconStyle={{ marginLeft: 6, color: '#8c8c8c' }}
                        />
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Switch size="small" checked={state.atMostOnce} onChange={toggleAtMostOnce} />
                        <span style={{ fontSize: '13px', color: '#595959' }}>Apply at most once</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Row: Help Text */}
              {props.showHelpText && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#262626',
                    }}
                  >
                    Help Text
                    <CPTooltip
                      title={tooltips.admin.rubric.categoryHelpText}
                      infoIcon={true}
                      hideThisOnHideTips={true}
                      iconStyle={{ marginLeft: 6, color: '#8c8c8c' }}
                    />
                  </span>
                  <Input.TextArea
                    value={state.helpText}
                    // helpers object is stable across renders
                    onChange={helpers.changeHelpText}
                    // helpers object is stable across renders
                    onBlur={helpers.saveCategory}
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    placeholder="Enter instructions or guidance for graders using this category..."
                    style={{
                      resize: 'none',
                      fontSize: '14px',
                      borderRadius: '6px',
                      padding: '8px 12px',
                    }}
                  />
                </div>
              )}
            </Space>
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
            {/* helpers object is stable across renders */}
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
          title={activeComment.text || ''}
          startText={activeComment[activeField] || ''}
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
