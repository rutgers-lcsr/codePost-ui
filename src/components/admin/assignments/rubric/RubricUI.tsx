// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import {
  SaveOutlined,
  SettingOutlined,
  UndoOutlined,
  PlusOutlined,
  DeleteOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Checkbox, Empty, Modal, Button, Popconfirm, Tooltip } from 'antd';

/* codePost imports */
import RubricCommentExplorer from './RubricCommentExplorer';

import { LinkedCommentsAlert, LinkedCommentsConfirm } from './LinkedCommentsAlert';

import MergeRubricCommentsDialog from './MergeRubricCommentsDialog';
import RubricFileDownload from './RubricFileDownload';
import RubricFileUpload from './RubricFileUpload';

import CPButton from '../../../../components/core/CPButton';
import Loading from '../../../../components/core/Loading';

import CPAdminRubric from './CPAdminRubric';

import RubricCategoryUI from './RubricCategoryUI';

import { RESOLUTION } from '../../../../components/core/rubric/RubricManager';

import RubricCategoryManager, {
  IRubricCategoryManagerParams,
} from '../../../../components/core/rubric/RubricCategoryManager';

import { IRubricManagerHelpers, IRubricManagerProps, IRubricManagerState } from '../../../core/rubric/RubricManager';

import CPTooltip from '../../../core/CPTooltip';
import { tooltips } from '../../../core/tooltips';

import styles from './RubricSideBar.module.css';
import { DIRECTION } from '../../../../types/common';
import { compareRubricCategories, compareRubricComments } from './RubricUtils';

interface IRubricUIProps extends IRubricManagerProps {
  breadcrumbs: Array<{ title: React.ReactNode }>;
  baseURL: string;
  history: {
    push: (path: string) => void;
    replace?: (path: string) => void;
    goBack?: () => void;
  };
}

const RubricUI = ({
  props,
  state,
  helpers,
}: {
  props: IRubricUIProps;
  state: IRubricManagerState;
  helpers: IRubricManagerHelpers;
}) => {
  const { rubricCategories, rubricComments, loadComplete } = state;

  /* settings modal display */
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  /* optional rubric fields */
  const [showPointLimits, setShowPointLimits] = React.useState(false);
  const [showHelpText, setShowHelpText] = React.useState(false);
  const [showExplanations, setShowExplanations] = React.useState(false);
  const [showInstructions, setShowInstructions] = React.useState(false);
  const [showAtMostOnce, setShowAtMostOnce] = React.useState(false);

  const [showPointLimitCheckbox, setShowPointLimitCheckbox] = React.useState(true);
  const [showHelpTextCheckbox, setShowHelpTextCheckbox] = React.useState(true);
  const [showExplanationsCheckbox, setShowExplanationsCheckbox] = React.useState(true);
  const [showInstructionsCheckbox, setShowInstructionsCheckbox] = React.useState(true);
  const [showAtMostOnceCheckbox, setShowAtMostOnceCheckbox] = React.useState(true);

  // Active Category State
  const [activeCategoryId, setActiveCategoryId] = React.useState<number | undefined>(undefined);

  // Set initial active category
  React.useEffect(() => {
    if (rubricCategories.length > 0 && activeCategoryId === undefined) {
      setActiveCategoryId(rubricCategories.sort(compareRubricCategories)[0].id);
    } else if (rubricCategories.length > 0 && activeCategoryId !== undefined) {
      // Check if active category still exists
      const exists = rubricCategories.some((c) => c.id === activeCategoryId);
      if (!exists) {
        setActiveCategoryId(rubricCategories.sort(compareRubricCategories)[0].id);
      }
    } else if (rubricCategories.length === 0) {
      setActiveCategoryId(undefined);
    }
  }, [rubricCategories, activeCategoryId]);

  React.useEffect(() => {
    for (const cat of rubricCategories) {
      if (!showPointLimits && typeof cat.pointLimit === 'number') {
        setShowPointLimits(true);
        setShowPointLimitCheckbox(false);
      }

      if (!showHelpText && typeof cat.helpText === 'string' && cat.helpText.length > 0) {
        setShowHelpText(true);
        setShowHelpTextCheckbox(false);
      }

      if (!showAtMostOnce && cat.atMostOnce) {
        setShowAtMostOnce(true);
        setShowAtMostOnceCheckbox(false);
      }

      for (const rc of rubricComments[cat.id]) {
        if (!showExplanations && rc.explanation) {
          setShowExplanations(true);
          setShowExplanationsCheckbox(false);
        }

        if (!showInstructions && rc.instructionText) {
          setShowInstructions(true);
          setShowInstructionsCheckbox(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubricCategories, rubricComments]);

  if (loadComplete) {
    const changesMade = helpers.changesMade();

    const onSave = (_e?: React.SyntheticEvent) => {
      helpers.onSave(undefined);
    };

    /************************************************************************/
    /* Settings modal
    /************************************************************************/

    const toggleShowPointLimit = () => {
      setShowPointLimits(!showPointLimits);
    };

    const toggleShowHelpText = () => {
      setShowHelpText(!showHelpText);
    };

    const toggleShowExplanations = () => {
      setShowExplanations(!showExplanations);
    };

    const toggleShowInstructions = () => {
      setShowInstructions(!showInstructions);
    };

    const toggleShowAtMostOnce = () => {
      setShowAtMostOnce(!showAtMostOnce);
    };

    const settingsModal = (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ fontSize: 18, color: '#1890ff' }} />
            <span style={{ fontWeight: 600, fontSize: 16 }}>Rubric Settings</span>
          </div>
        }
        open={settingsOpen}
        footer={null}
        onCancel={() => setSettingsOpen(false)}
        width={480}
        styles={{
          body: { padding: '16px 24px 24px' },
        }}
      >
        <p style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 20, marginTop: 0 }}>
          Customize which features are visible in the rubric editor.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {showPointLimitCheckbox && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: showPointLimits ? '#f6ffed' : '#fafafa',
                borderRadius: 8,
                border: showPointLimits ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>Point Limits</span>
                  <CPTooltip
                    title={tooltips.admin.rubric.categoryPointLimit}
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ fontSize: 12, color: '#bfbfbf' }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Set maximum deductions per category</span>
              </div>
              <Checkbox checked={showPointLimits} onChange={toggleShowPointLimit} />
            </div>
          )}
          {showHelpTextCheckbox && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: showHelpText ? '#f6ffed' : '#fafafa',
                borderRadius: 8,
                border: showHelpText ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>Help Text</span>
                  <CPTooltip
                    title={tooltips.admin.rubric.categoryHelpText}
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ fontSize: 12, color: '#bfbfbf' }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Guidance text for graders on each category</span>
              </div>
              <Checkbox checked={showHelpText} onChange={toggleShowHelpText} />
            </div>
          )}
          {showExplanationsCheckbox && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: showExplanations ? '#f6ffed' : '#fafafa',
                borderRadius: 8,
                border: showExplanations ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>Explanations</span>
                  <CPTooltip
                    title={tooltips.admin.rubric.explanations}
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ fontSize: 12, color: '#bfbfbf' }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Detailed explanations shown to students</span>
              </div>
              <Checkbox checked={showExplanations} onChange={toggleShowExplanations} />
            </div>
          )}
          {showInstructionsCheckbox && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: showInstructions ? '#f6ffed' : '#fafafa',
                borderRadius: 8,
                border: showInstructions ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>Instructions</span>
                  <CPTooltip
                    title="An optional textarea that allows you to give graders instructions for personalizing a rubric comment."
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ fontSize: 12, color: '#bfbfbf' }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Grader instructions for each comment</span>
              </div>
              <Checkbox checked={showInstructions} onChange={toggleShowInstructions} />
            </div>
          )}
          {showAtMostOnceCheckbox && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: showAtMostOnce ? '#f6ffed' : '#fafafa',
                borderRadius: 8,
                border: showAtMostOnce ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#262626' }}>At Most Once</span>
                  <CPTooltip
                    title="Show the option to require a rubric category be applied at most once."
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ fontSize: 12, color: '#bfbfbf' }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Limit category to single application</span>
              </div>
              <Checkbox checked={showAtMostOnce} onChange={toggleShowAtMostOnce} />
            </div>
          )}
        </div>
      </Modal>
    );

    /************************************************************************/

    const actions = [
      <CPButton key="0" cpType="secondary" icon={<SettingOutlined />} onClick={() => setSettingsOpen(!settingsOpen)}>
        Settings
      </CPButton>,
      <RubricFileUpload
        key="2"
        assignment={props.assignment}
        rubricComments={state.rubricComments}
        rubricCategories={state.rubricCategories}
        onRubricUpload={helpers.replaceRubric}
        isDisabled={false}
      />,
      <RubricFileDownload
        key="download"
        assignment={props.assignment}
        rubricComments={state.rubricComments}
        rubricCategories={state.rubricCategories}
        isDisabled={false}
      />,
      <MergeRubricCommentsDialog
        key="3"
        isDisabled={false}
        rubricCategories={state.rubricCategories}
        rubricComments={state.rubricComments}
        assignment={props.assignment}
        reloadRubric={helpers.loadAssignmentRubric}
      />,
      <CPButton
        key="0"
        onClick={helpers.resetRubric}
        cpType="secondary"
        disabled={!changesMade}
        icon={<UndoOutlined />}
        fallbackIcon={<UndoOutlined />}
        fallbackWidth={1250}
      >
        Undo
      </CPButton>,
      <CPButton
        key="1"
        onClick={onSave}
        disabled={!changesMade}
        cpType="primary"
        icon={<SaveOutlined />}
        fallbackIcon={<SaveOutlined />}
        fallbackWidth={500}
        loading={state.isSaving}
      >
        Save
      </CPButton>,
    ];

    const addRubricCategory = () => {
      helpers.addRubricCategory(undefined);
    };

    const onDelete = () => {
      helpers.onLinkedCommentsResolve(state.linkedComments[0], RESOLUTION.DELETE);
    };

    const onUnLink = () => {
      helpers.onLinkedCommentsResolve(state.linkedComments[0], RESOLUTION.UNLINK);
    };

    /* Sorting and Preparing Categories */
    const sortedCategories = rubricCategories.slice().sort(compareRubricCategories);
    const activeCategory = sortedCategories.find((c) => c.id === activeCategoryId);
    const activeCategoryIndex = sortedCategories.findIndex((c) => c.id === activeCategoryId);

    /* Render Content */
    const content = (
      <div>
        {settingsModal}
        <div
          style={{
            display: 'flex',
            height: 'calc(100vh - 200px)',
            border: '1px solid #f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {/* Sidebar */}
          <div className={styles.sidebarContainer}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarTitle}>Categories</span>
              <Tooltip title="Add new category">
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addRubricCategory} />
              </Tooltip>
            </div>

            <ul className={styles.sidebarList}>
              {sortedCategories.map((cat, index) => {
                const isActive = cat.id === activeCategoryId;
                return (
                  <li
                    key={cat.id}
                    className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
                    onClick={() => setActiveCategoryId(cat.id)}
                  >
                    <div className={styles.sidebarItemContent}>
                      {cat.name || <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Untitled</span>}
                    </div>
                    <div className={styles.sidebarItemActions}>
                      <Tooltip title="Move Up">
                        <Button
                          type="text"
                          size="small"
                          icon={<CaretUpOutlined style={{ fontSize: 10 }} />}
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            helpers.moveCategory(cat, DIRECTION.Up);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Move Down">
                        <Button
                          type="text"
                          size="small"
                          icon={<CaretDownOutlined style={{ fontSize: 10 }} />}
                          disabled={index === sortedCategories.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            helpers.moveCategory(cat, DIRECTION.Down);
                          }}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Delete category?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          helpers.deleteRubricCategory(cat);
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="Yes"
                        cancelText="No"
                        placement="right"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </li>
                );
              })}
              {sortedCategories.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c', fontSize: '13px' }}>
                  No categories yet
                </div>
              )}
            </ul>
          </div>

          {/* Main Content Area */}
          <div className={styles.contentContainer}>
            {activeCategory ? (
              <RubricCategoryManager
                key={activeCategory.id}
                rubricCategory={activeCategory}
                savedRubricCategory={state.savedRubricCategories.find((el) => el.id === activeCategory.id)}
                rubricComments={
                  activeCategory.id in rubricComments
                    ? rubricComments[activeCategory.id].sort(compareRubricComments)
                    : []
                }
                savedRubricComments={
                  state.savedRubricCategories.find((el) => el.id === activeCategory.id)
                    ? state.savedRubricComments[activeCategory.id]
                    : undefined
                }
                updateCategory={helpers.updateRubricCategory}
                deleteCategory={helpers.deleteRubricCategory}
                addComment={helpers.addRubricComment}
                updateComment={helpers.updateRubricComment}
                deleteComment={helpers.deleteRubricComment}
                onEdit={helpers.onCategoryEdit}
                onUndo={helpers.onCategoryUndo}
                onCommentEdit={helpers.onCommentEdit}
                onCommentUndo={helpers.onCommentUndo}
                activateCommentExplorer={helpers.activateCommentExplorer}
                onCommentDragEnd={(result: unknown) =>
                  helpers.onCommentDragEnd(
                    result as {
                      destination?: { droppableId: string; index: number } | null;
                      source: { index: number };
                    },
                  )
                }
                moveCategory={helpers.moveCategory}
                index={activeCategoryIndex}
                numCategories={sortedCategories.length}
                otherCategories={sortedCategories}
                feedbackScores={state.feedbackScores}
                commentFeedbackOn={props.assignment.commentFeedback ?? false}
                showPointLimits={showPointLimits}
                showHelpText={showHelpText}
                showExplanations={showExplanations}
                showInstructions={showInstructions}
                showAtMostOnce={showAtMostOnce}
                instanceLists={state.instanceLists}
              >
                {({ propz, statez, helperz }: IRubricCategoryManagerParams) => {
                  return (
                    <RubricCategoryUI props={{ ...propz, baseURL: props.baseURL }} state={statez} helpers={helperz} />
                  );
                }}
              </RubricCategoryManager>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select or create a category to get started">
                <Button type="primary" onClick={addRubricCategory}>
                  Create Category
                </Button>
              </Empty>
            )}
          </div>
        </div>

        {state.activeComment ? (
          <RubricCommentExplorer
            rubricComment={state.activeComment}
            isVisible={typeof state.activeComment !== 'undefined'}
            closeCommentExplorer={helpers.clearCommentExplorer}
            submissions={props.submissions}
          />
        ) : null}
        <LinkedCommentsAlert
          rubricComment={state.linkedComments[0]}
          onDelete={onDelete}
          onUnLink={onUnLink}
          onCancel={helpers.onLinkedAlertCancel}
          isVisible={state.linkedComments.length > 0}
          numComments={state.linkedComments[0] ? state.instanceLists[state.linkedComments[0].id].length : 0}
        />
        <LinkedCommentsConfirm
          onAccept={helpers.onLinkedConfirmAccept}
          onCancel={helpers.onLinkedConfirmCancel}
          isVisible={state.showConfirmDialog}
          unsavedComments={state.unsavedComments}
          savedRubricComments={state.rubricComments}
        />
      </div>
    );

    return (
      <span>
        <CPAdminRubric
          actions={actions}
          title="Rubric"
          content={content}
          goBack={() => {}}
          isEmpty={state.rubricCategories.length === 0}
          emptyNode={
            <Empty
              styles={{
                image: {
                  height: 60,
                },
              }}
              description={<span>No rubric created for this assignment yet</span>}
            >
              <CPButton cpType="primary" onClick={addRubricCategory}>
                Create a category
              </CPButton>
            </Empty>
          }
          breadcrumbs={<Breadcrumb items={[...props.breadcrumbs, { title: props.assignment.name }]} />}
          titleInfo={tooltips.admin.rubric.title}
        />
      </span>
    );
  } else {
    return <Loading />;
  }
};

export default RubricUI;
