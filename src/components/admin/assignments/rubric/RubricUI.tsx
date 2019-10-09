/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* antd imports */
import { Checkbox, Breadcrumb, Empty } from 'antd';

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

import { IRubricManagerProps, IRubricManagerState, IRubricManagerHelpers } from '../../../core/rubric/RubricManager';

import CPTooltip from '../../../core/CPTooltip';
import { tooltips } from '../../../core/tooltips';

// interface IRubricUIState extends IRubricManagerState {
//   showPointLimits: boolean;
//   showHelpText: boolean;
// }

const RubricUI = ({
  props,
  state,
  helpers,
}: {
  props: IRubricManagerProps;
  state: IRubricManagerState;
  helpers: IRubricManagerHelpers;
}) => {
  const { rubricCategories, rubricComments, loadComplete } = state;
  const [showPointLimits, setShowPointLimits] = React.useState(false);
  const [showHelpText, setShowHelpText] = React.useState(false);
  const [showPointLimitCheckbox, setShowPointLimitCheckbox] = React.useState(true);
  const [showHelpTextCheckbox, setShowHelpTextCheckbox] = React.useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    for (const cat of rubricCategories) {
      if (!showPointLimits && typeof cat.pointLimit === 'number') {
        setShowPointLimits(true);
        setShowPointLimitCheckbox(false);
      }

      if (!showHelpText && (typeof cat.helpText === 'string' && cat.helpText.length > 0)) {
        setShowHelpText(true);
        setShowHelpTextCheckbox(false);
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
          >
            {({ propz, statez, helperz }: IRubricCategoryManagerParams) => {
              return <RubricCategoryUI props={propz} state={statez} helpers={helperz} />;
            }}
          </RubricCategoryManager>
        );
      });

    const onSave = (e: any) => {
      helpers.onSave(undefined, e);
    };

    const actions = [
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
        icon="undo"
        fallback="undo"
        fallbackWidth={1250}
      >
        Undo
      </CPButton>,
      <CPButton
        key="1"
        onClick={onSave}
        disabled={!changesMade}
        cpType="primary"
        icon="save"
        fallback="save"
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

    const toggleShowPointLimit = () => {
      setShowPointLimits(!showPointLimits);
    };

    const toggleShowHelpText = () => {
      setShowHelpText(!showHelpText);
    };

    const content = (
      <div>
        <div className="display-flex flex-direction-column align-items-flex-end" style={{ marginBottom: '10px' }}>
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
        </div>
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
      <CPAdminRubric
        actions={actions}
        title="Rubric"
        content={content}
        goBack={null}
        isEmpty={state.rubricCategories.length === 0}
        emptyNode={
          <Empty
            imageStyle={{
              height: 60,
            }}
            description={<span>No rubric yet</span>}
          >
            <CPButton cpType="primary" onClick={addRubricCategory}>
              Create a category
            </CPButton>
          </Empty>
        }
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item onClick={props.onCancel}>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a>Assignments</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{props.assignment.name}</Breadcrumb.Item>
            <Breadcrumb.Item>Edit rubric</Breadcrumb.Item>
          </Breadcrumb>
        }
        titleInfo={tooltips.admin.rubric.title}
      />
    );
  } else {
    return <Loading />;
  }
};

export default RubricUI;
