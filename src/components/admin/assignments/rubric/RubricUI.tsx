/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import { SaveOutlined, SettingOutlined, UndoOutlined } from '@ant-design/icons';
import { Breadcrumb, Checkbox, Empty, Modal } from 'antd';

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

    const categoryTables = rubricCategories
      .sort(RubricCategory.compare)
      .map((cat: RubricCategoryType, catIndex: number) => {
        const savedCategory = state.savedRubricCategories.find((el: any) => {
          return el.id === cat.id;
        });

        return (
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
              return <RubricCategoryUI props={{ ...propz, baseURL: props.baseURL }} state={statez} helpers={helperz} />;
            }}
          </RubricCategoryManager>
        );
      });

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
      <Modal title="Rubric settings" open={settingsOpen} footer={null} onCancel={() => setSettingsOpen(false)}>
        <div>
          {showPointLimitCheckbox ? (
            <div>
              Show point limits <Checkbox checked={showPointLimits} onChange={toggleShowPointLimit} />{' '}
              <CPTooltip
                title={tooltips.admin.rubric.categoryPointLimit}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            </div>
          ) : null}
          {showHelpTextCheckbox ? (
            <div>
              Show help text <Checkbox checked={showHelpText} onChange={toggleShowHelpText} />{' '}
              <CPTooltip
                title={tooltips.admin.rubric.categoryHelpText}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            </div>
          ) : null}
          {showExplanationsCheckbox ? (
            <div>
              Show explanation editors <Checkbox checked={showExplanations} onChange={toggleShowExplanations} />{' '}
              <CPTooltip
                title={tooltips.admin.rubric.explanations}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            </div>
          ) : null}
          {showInstructionsCheckbox ? (
            <div>
              Show instruction editors <Checkbox checked={showInstructions} onChange={toggleShowInstructions} />{' '}
              <CPTooltip
                title={`An optional textarea that allows you to give graders instructions for personalizing a rubric comment.`}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            </div>
          ) : null}
          {showAtMostOnceCheckbox ? (
            <div>
              Show "At Most Once" toggle <Checkbox checked={showAtMostOnce} onChange={toggleShowAtMostOnce} />{' '}
              <CPTooltip
                title={'Show the option to require a rubric category be applied at most once.'}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            </div>
          ) : null}
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

    const addRubricCategory = (e: any) => {
      helpers.addRubricCategory(undefined, e);
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
        {categoryTables}
        <CPButton cpType="primary" onClick={addRubricCategory}>
          Add New Category
        </CPButton>
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
              description={<span>No rubric yet</span>}
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
