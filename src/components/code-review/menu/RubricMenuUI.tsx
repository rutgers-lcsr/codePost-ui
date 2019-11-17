/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
// @ts-ignore
import { Icon, Input, Popconfirm, Tag } from 'antd';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

import { RubricCategory, RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../infrastructure/rubricComment';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import useHotkeys, { E_KEY, O_KEY, S_KEY } from '../useHotkeys';

import { osControlKey } from '../../core/operatingSystem';

import CPButton from '../../core/CPButton';

import Loading from '../../core/Loading';

import { RESOLUTION } from '../../core/rubric/RubricManager';

import { IRubricManagerProps, IRubricManagerState, IRubricManagerHelpers } from '../../core/rubric/RubricManager';

import RubricCategoryManager, { IRubricCategoryManagerParams } from '../../core/rubric/RubricCategoryManager';

import RubricMenuCategoryUI from './RubricMenuCategoryUI';

import { LinkedCommentsAlert, LinkedCommentsConfirm } from '../../admin/assignments/rubric/LinkedCommentsAlert';

import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

/**********************************************************************************************************************/

enum EDITING_STATUS {
  NOT_EDITING,
  EDITING,
}

interface IRubricMenuUIProps extends IRubricManagerProps {
  /* is the user allowed to edit the rubric? */
  canUserEdit: boolean;

  /* should we show the frequent comments synthetic category? */
  showFrequent: boolean;

  /* if true, simulate rubric save */
  demoMode: boolean;

  /* decides whether to show text or explanations */
  showExplanations: boolean;

  handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
  hasActiveComment: boolean;
  toggleEditRubricMode: () => void;
  editRubricMode: boolean;
  setRubric: (rubric: {
    rubricCategories: RubricCategoryType[];
    rubricComments: IRubricCategoryToRubricCommentsMap;
  }) => void;
  turnOnReload: () => void;
  turnOffReload: () => void;
}

const RubricMenuUI = ({
  props,
  state,
  helpers,
}: {
  props: IRubricMenuUIProps;
  state: IRubricManagerState;
  helpers: IRubricManagerHelpers;
}) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingStatuses, setEditingStatuses] = React.useState({});
  const [editRubricClass, setEditRubricClass] = React.useState('');
  const [newCategoryName, setNewCategoryName] = React.useState('');

  const [changesMade, setChangesMade] = React.useState(false);
  const [confirmChanges, setConfirmChanges] = React.useState(false);

  // console.log(props, state, helpers);

  const startEditing = (rubricCommentID: number) => {
    const newEditingStatuses = { ...editingStatuses, [rubricCommentID]: EDITING_STATUS.EDITING };
    setEditingStatuses(newEditingStatuses);
    props.turnOffReload();
  };

  const focusSearch = () => {
    const el = document.getElementById('rubric-search');
    if (el !== null) {
      el.focus();
    }
  };

  React.useEffect(() => {
    if (props.canUserEdit) {
      props.turnOnReload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useHotkeys(O_KEY, focusSearch);

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const linkToComment = (rubricComment: RubricCommentType) => {
    if (rubricComment !== undefined) {
      props.handleRubricCommentClick(rubricComment);
    }
  };

  const buildRubricMenu = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    // sample search: category:dfdfdfdf some other text
    // sample search: category:"some text" some other text

    // If user has specified a category with category:[some text], respect it
    const categoryMatches = searchTerm.match(/(category:[a-z0-9]+)|(category:"[a-z0-9\s]+")/i);
    let adjustedRubricComments = { ...rubricComments };

    // Create a category of frequently used comments
    let freq: RubricCategoryType;
    const noSort: number[] = [];

    let filteredCatgories;
    if (!props.editRubricMode && props.showFrequent) {
      noSort.push(-1000);
      freq = {
        id: -1000,
        name: 'Frequently used',
        rubricComments: [],
        assignment: -1,
        pointLimit: null,
        sortKey: 0,
        helpText: 'List of the 10 most frequently applied comments from this rubric.',
      };
      adjustedRubricComments[-1000] = Object.values(rubricComments)
        .flat()
        .filter((el) => el.comments.length > 0)
        .sort((a, b) => b.comments.length - a.comments.length)
        .slice(0, 10);
      filteredCatgories = [freq, ...rubricCategories.sort(RubricCategory.compare)];
    } else {
      filteredCatgories = rubricCategories.sort(RubricCategory.compare);
    }

    let commentSearchTerm = searchTerm;
    if (categoryMatches !== null && categoryMatches.length > 0) {
      const categoryName = categoryMatches[0].split(':')[1].slice(1, -1);
      filteredCatgories = rubricCategories.filter((el) => {
        return el.name.toUpperCase().includes(categoryName.toUpperCase());
      });
      commentSearchTerm = searchTerm
        .split(' ')
        .filter((el: any) => {
          return !el.includes('category:');
        })
        .join(' ');
    }

    // if user is trying to invoke category search, don't try searching for the search term
    if ('category:'.includes(commentSearchTerm)) {
      commentSearchTerm = '';
    }

    return filteredCatgories.map((cat: RubricCategoryType, catIndex: number) => {
      const savedCategory = state.savedRubricCategories.find((el: any) => {
        return el.id === cat.id;
      });

      // Don't sort comments which are custom sorted prior to this map
      let comments: RubricCommentType[] = [];
      if (cat.id in adjustedRubricComments) {
        if (noSort.indexOf(cat.id) > -1) {
          comments = adjustedRubricComments[cat.id];
        } else {
          comments = adjustedRubricComments[cat.id].sort(RubricComment.compare);
        }
      }

      return (
        <RubricCategoryManager
          key={cat.id}
          rubricCategory={cat}
          savedRubricCategory={savedCategory}
          rubricComments={comments}
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
        >
          {({ propz, statez, helperz }: IRubricCategoryManagerParams) => {
            const propsz = {
              ...propz,
              hasActiveComment: props.hasActiveComment,
              handleRubricCommentClick: props.handleRubricCommentClick,
              editingStatuses,
              startEditing,
              linkToComment,
              searchTerm: commentSearchTerm,
              assignment: props.assignment,
              editRubricMode: props.editRubricMode,
              turnOnReload: props.turnOnReload,
              turnOffReload: props.turnOffReload,
              showExplanations: props.showExplanations,
            };
            return <RubricMenuCategoryUI props={propsz} state={statez} helpers={helperz} />;
          }}
        </RubricCategoryManager>
      );
    });
  };

  const toggleEditRubricMode = () => {
    if (props.canUserEdit) {
      setEditingStatuses({});
      props.turnOnReload();
      if (!props.editRubricMode) {
        setEditRubricClass('slide-in');
        props.toggleEditRubricMode();
      } else {
        if (changesMade) {
          setConfirmChanges(true);
        } else {
          setEditRubricClass('slide-out');
          props.toggleEditRubricMode();
        }
      }
    } else {
      return;
    }
  };

  const onUndo = () => {
    helpers.resetRubric();
    setEditingStatuses({});
    props.turnOnReload();
  };

  const blurAll = () => {
    const tmp = document.createElement('input');
    document.body.appendChild(tmp);
    tmp.focus();
    document.body.removeChild(tmp);
  };

  const onSave = () => {
    if (changesMade) {
      helpers.onSave(props.setRubric, props.demoMode);

      setEditingStatuses({});
      props.turnOnReload();
    }
  };

  const blurAndSave = () => {
    blurAll();
    onSave();
  };

  const confirm = () => {
    onSave();
    setConfirmChanges(false);
    setEditRubricClass('slide-out');
    props.toggleEditRubricMode();
  };

  const cancel = () => {
    onUndo();
    setConfirmChanges(false);
    setEditRubricClass('slide-out');
    props.toggleEditRubricMode();
  };

  useHotkeys(E_KEY, toggleEditRubricMode);
  useHotkeys(S_KEY, blurAndSave);

  let controls = null;
  if (state.loadComplete && props.canUserEdit) {
    const x = helpers.changesMade();
    if (x !== changesMade) {
      setChangesMade(x);
    }

    const addRubricCategory = (e: any) => {
      helpers.addRubricCategory(newCategoryName, e);
      setNewCategoryName('');
      props.turnOffReload();
    };

    const onCancel = () => {
      setNewCategoryName('');
    };

    const onChangeCategoryName = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCategoryName(e.target.value);
    };

    const onDelete = () => {
      blurAll();
      helpers.onLinkedCommentsResolve(state.linkedComments[0], RESOLUTION.DELETE, props.setRubric);
    };

    const onUnLink = () => {
      blurAll();
      helpers.onLinkedCommentsResolve(state.linkedComments[0], RESOLUTION.UNLINK, props.setRubric);
    };

    const onLinkedConfirmAccept = () => {
      blurAll();
      helpers.onLinkedConfirmAccept(props.setRubric);
    };

    const categoryForm = <Input placeholder="Category name" value={newCategoryName} onChange={onChangeCategoryName} />;

    const controlButtons = [
      <Popconfirm
        key="add-category"
        icon={null}
        title={categoryForm}
        okText="Create"
        cancelText="Cancel"
        onConfirm={addRubricCategory}
        onCancel={onCancel}
      >
        <CPButton cpType="primary" icon="plus" style={{ minWidth: '80px' }}>
          Add Category
        </CPButton>
      </Popconfirm>,
      <div key="gap1" style={{ width: '10px' }} />,
      <CPButton
        key="undo"
        cpType="secondary"
        disabled={!changesMade && Object.keys(editingStatuses).length === 0}
        icon="undo"
        onClick={onUndo}
        style={{ minWidth: '80px' }}
      >
        Undo
      </CPButton>,
      <div key="gap2" style={{ width: '10px' }} />,
      <Popconfirm
        title="You have unsaved changes. Would you like to save?"
        visible={confirmChanges}
        onConfirm={confirm}
        onCancel={cancel}
        okText="Yes"
        cancelText="No, undo"
        key="save-confirm"
      >
        <CPTooltip title={changesMade ? tooltips.grade.rubric.save : null} hideThisOnHideTips={true}>
          <CPButton
            key="save"
            id="rubric-save-button"
            disabled={!changesMade}
            onClick={onSave}
            cpType="primary"
            icon="save"
            loading={state.isSaving}
            style={{ minWidth: '80px' }}
          >
            Save
          </CPButton>
        </CPTooltip>
      </Popconfirm>,
      <div key="modals">
        <LinkedCommentsAlert
          rubricComment={state.linkedComments[0]}
          onDelete={onDelete}
          onUnLink={onUnLink}
          onCancel={helpers.onLinkedAlertCancel}
          isVisible={state.linkedComments.length > 0}
        />
        <LinkedCommentsConfirm
          onAccept={onLinkedConfirmAccept}
          onCancel={helpers.onLinkedConfirmCancel}
          isVisible={state.showConfirmDialog}
          unsavedComments={state.unsavedComments}
          savedRubricComments={state.rubricComments}
        />
      </div>,
    ];

    controls = controlButtons;
  }

  const insertCategorySearch = () => {
    if (!searchTerm.includes('category:')) {
      setSearchTerm(searchTerm === '' ? 'category:' : `${searchTerm} category:`);
      // this.setState((oldState) => {
      //   return {
      //     searchTerm: oldState.searchTerm === '' ? 'category:' : `${oldState.searchTerm} category:`,
      //   };
      // });
      focusSearch();
    }
  };

  let searchBar;

  if (props.canUserEdit) {
    const iconType = props.editRubricMode ? 'backward' : 'edit';
    searchBar = (
      <Input
        placeholder={`Search rubric... (${osControlKey()} O)`}
        id="rubric-search"
        onChange={onSearch}
        value={searchTerm}
        addonBefore={
          <CPTooltip title={tooltips.grade.rubric.edit} placement="right">
            <Icon
              type={iconType}
              theme="filled"
              onClick={toggleEditRubricMode}
              style={{ color: '#24be85', cursor: 'pointer' }}
            />
          </CPTooltip>
        }
        className={consoleThemes.light === consoleTheme ? 'search--light' : 'search--dark'}
        style={{
          width: '100%',
        }}
      />
    );
  } else {
    searchBar = (
      <Input
        placeholder={`Search rubric... (${osControlKey()} O)`}
        id="rubric-search"
        onChange={onSearch}
        value={searchTerm}
        style={{
          backgroundColor: consoleTheme.siderBg,
          border: consoleTheme.buttonSecondaryBorder,
          color: consoleTheme.buttonSecondaryColor,
          width: '100%',
        }}
      />
    );
  }

  let content = <Loading />;
  if (state.loadComplete) {
    const rubricMenu = buildRubricMenu(state.rubricCategories, state.rubricComments);

    content = <div id="rubric-menu">{rubricMenu}</div>;
  }

  return (
    <div style={{ marginTop: '8px' }} id="rubric-menu-container">
      <div
        id="rubric-menu-title"
        style={{ marginBottom: '5px', width: '100%', textAlign: 'center', padding: '0px 10px' }}
      >
        <div style={{ textAlign: 'right' }}>
          <CPTooltip title={tooltips.grade.rubric.categorySearch} hideThisOnHideTips={true}>
            <Tag
              style={{
                background: consoleTheme.siderBg,
                color: consoleTheme.siderTitle,
                borderStyle: 'dashed',
                marginBottom: '4px',
                marginRight: '0px',
                cursor: 'pointer',
              }}
              onClick={insertCategorySearch}
            >
              category:
            </Tag>
          </CPTooltip>
        </div>
        {searchBar}
      </div>
      <div id="rubric-menu" style={{ height: '100%', overflow: 'auto' }}>
        {content}
      </div>
      <div id="rubric-menu-controls" className={editRubricClass} style={{ backgroundColor: consoleTheme.siderBg }}>
        {controls}
      </div>
    </div>
  );
};

export default RubricMenuUI;
