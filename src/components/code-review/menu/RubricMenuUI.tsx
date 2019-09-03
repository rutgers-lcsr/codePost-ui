/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
// @ts-ignore
import { Icon, Input, Menu, Popconfirm } from 'antd';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

import { RubricCategory, RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../infrastructure/rubricComment';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import useHotkeys, { O_KEY } from '../useHotkeys';

import CPButton from '../../core/CPButton';

import Loading from '../../core/Loading';

import RubricCategoryManager from '../../core/rubric/RubricCategoryManager';

import RubricMenuCategoryUI from './RubricMenuCategoryUI';

/**********************************************************************************************************************/

// interface IRubricMenuProps {
//   rubricCategories: RubricCategoryType[];
//   rubricComments: IRubricCategoryToRubricCommentsMap;
//   handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
//   hasActiveComment: boolean;
// }

// interface IRubricMenuState {
//   searchTerm: string;
// }

enum EDITING_STATUS {
  NOT_EDITING,
  EDITING,
}

const RubricMenuUI = ({ props, state, helpers }: any) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingStatuses, setEditingStatuses] = React.useState({});
  const [editRubricClass, setEditRubricClass] = React.useState('');
  const [newCategoryName, setNewCategoryName] = React.useState('');

  const startEditing = (rubricCommentID: number) => {
    const newEditingStatuses = { ...editingStatuses, [rubricCommentID]: EDITING_STATUS.EDITING };
    setEditingStatuses(newEditingStatuses);
  };

  const focusSearch = () => {
    const el = document.getElementById('rubric-search');
    if (el !== null) {
      el.focus();
    }
  };

  useHotkeys(O_KEY, focusSearch);

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const linkToComment = (rubricComment: RubricCommentType) => {
    if (props.hasActiveComment) {
      // const rubricComment = this.props.rubricComments[categoryID].find((comment: RubricCommentType) => {
      //   return comment.id === commentID;
      // });

      if (rubricComment !== undefined) {
        props.handleRubricCommentClick(rubricComment);
      }
    }
  };

  const buildRubricMenu = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    return rubricCategories.sort(RubricCategory.compare).map((cat: RubricCategoryType, catIndex: number) => {
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
        >
          {({ propz, statez, helperz }: any) => {
            const propsz = {
              ...propz,
              hasActiveComment: props.hasActiveComment,
              handleRubricCommentClick: props.handleRubricCommentClick,
              editingStatuses,
              startEditing,
              linkToComment,
              searchTerm,
              assignment: props.assignment,
              editRubricMode: props.editRubricMode,
            };
            return <RubricMenuCategoryUI props={propsz} state={statez} helpers={helperz} />;
          }}
        </RubricCategoryManager>
      );
    });
  };

  const toggleEditRubricMode = () => {
    setEditingStatuses({});
    if (!props.editRubricMode) {
      setEditRubricClass('slide-in');
      props.toggleEditRubricMode();
    } else {
      setEditRubricClass('slide-out');
      props.toggleEditRubricMode();
    }
  };

  let controls = null;
  if (state.loadComplete && props.assignment.collaborativeRubricMode) {
    const changesMade = helpers.changesMade();

    const onSave = (e: any) => {
      helpers.onSave(undefined, e);
      setEditingStatuses({});
    };

    const addRubricCategory = (e: any) => {
      helpers.addRubricCategory(newCategoryName, e);
      setNewCategoryName('');
    };

    const onCancel = () => {
      setNewCategoryName('');
    };

    const onUndo = (e: any) => {
      helpers.resetRubric();
      setEditingStatuses({});
    };

    const onChangeCategoryName = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCategoryName(e.target.value);
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
      <CPButton
        key="save"
        disabled={!changesMade}
        onClick={onSave}
        cpType="primary"
        icon="save"
        loading={state.isSaving}
        style={{ minWidth: '80px' }}
      >
        Save
      </CPButton>,
    ];

    controls = controlButtons;
  }

  let searchBar;

  if (props.assignment.collaborativeRubricMode) {
    searchBar = (
      <Input
        placeholder="Search rubric... (⌘ O)"
        id="rubric-search"
        onChange={onSearch}
        value={searchTerm}
        addonBefore={
          <Icon
            type="edit"
            theme="filled"
            onClick={toggleEditRubricMode}
            style={{ color: '#24be85', cursor: 'pointer' }}
          />
        }
        style={{
          backgroundColor: consoleTheme.siderBg,

          color: consoleTheme.buttonSecondaryColor,
          width: '100%',
        }}
      />
    );
  } else {
    searchBar = (
      <Input
        placeholder="Search rubric... (⌘ O)"
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

    const rubricKeys = state.rubricCategories.map((rubricCategory: RubricCategoryType) => {
      return `category-${rubricCategory.id}`;
    });

    content = (
      <Menu
        defaultOpenKeys={rubricKeys}
        selectedKeys={[]}
        mode="inline"
        className="rubric-menu"
        id="rubric-menu"
        style={{ backgroundColor: consoleTheme.siderBg }}
      >
        {rubricMenu}
      </Menu>
    );
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <div
        id="rubric-menu-title"
        style={{ marginBottom: '5px', width: '100%', textAlign: 'center', padding: '0px 10px' }}
      >
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
