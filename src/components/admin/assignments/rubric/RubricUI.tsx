/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import { SaveOutlined, SettingOutlined, UndoOutlined } from '@ant-design/icons';
import { Breadcrumb, Checkbox, Empty, Modal, Tabs } from 'antd';

/* codePost imports */
import RubricCommentExplorer from './RubricCommentExplorer';

import { LinkedCommentsAlert, LinkedCommentsConfirm } from './LinkedCommentsAlert';

import MergeRubricCommentsDialog from './MergeRubricCommentsDialog';
import RubricFileDownload from './RubricFileDownload';
import RubricFileUpload from './RubricFileUpload';

import { RubricCategory, RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import { RubricComment } from '../../../../infrastructure/rubricComment';

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

interface IRubricUIProps extends IRubricManagerProps {
  breadcrumbs: Array<{ title: React.ReactNode }>;
  baseURL: string;
  history: any;
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  });

  if (loadComplete) {
    const changesMade = helpers.changesMade();

    const onSave = (_e: any) => {
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
      <CPButton cpType="secondary" icon={<SettingOutlined />} onClick={() => setSettingsOpen(!settingsOpen)}>
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

    const content = (
      <div>
        {settingsModal}
        <Tabs
          type="editable-card"
          defaultActiveKey={rubricCategories.length > 0 ? rubricCategories[0].id.toString() : undefined}
          style={{ marginBottom: 16 }}
          onEdit={(targetKey, action) => {
            if (action === 'add') {
              addRubricCategory();
            } else if (action === 'remove') {
              const catToDelete = rubricCategories.find((c) => c.id.toString() === targetKey);
              if (catToDelete) {
                helpers.deleteRubricCategory(catToDelete);
              }
            }
          }}
          hideAdd={false}
          items={rubricCategories.sort(RubricCategory.compare).map((cat: RubricCategoryType, catIndex: number) => {
            const savedCategory = state.savedRubricCategories.find((el: any) => {
              return el.id === cat.id;
            });

            return {
              label: cat.name || 'Untitled Category',
              key: cat.id.toString(),
              closable: false,
              children: (
                <RubricCategoryManager
                  key={cat.id}
                  rubricCategory={cat}
                  savedRubricCategory={savedCategory}
                  rubricComments={cat.id in rubricComments ? rubricComments[cat.id].sort(RubricComment.compare) : []}
                  savedRubricComments={savedCategory ? state.savedRubricComments[savedCategory.id] : undefined}
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
                  onCommentDragEnd={helpers.onCommentDragEnd}
                  moveCategory={helpers.moveCategory}
                  index={catIndex}
                  numCategories={state.rubricCategories.length}
                  otherCategories={state.rubricCategories}
                  feedbackScores={state.feedbackScores}
                  commentFeedbackOn={props.assignment.commentFeedback}
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
              ),
            };
          })}
        />

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
          goBack={null}
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
