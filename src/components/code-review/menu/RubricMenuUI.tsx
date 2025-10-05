/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
// @ts-ignore
import { BackwardFilled, EditFilled, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons';
import { Empty, Input, Popconfirm, Tag } from 'antd';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

import { CourseType, RubricCategoryType, RubricCommentType } from '../../../infrastructure/types';

import { RubricCategory } from '../../../infrastructure/rubricCategory';
import { RubricComment } from '../../../infrastructure/rubricComment';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import useHotkeys, { O_KEY, S_KEY } from '../useHotkeys';

import { osControlKey } from '../../core/operatingSystem';

import CPButton from '../../core/CPButton';

import Loading from '../../core/Loading';

import { RESOLUTION } from '../../core/rubric/RubricManager';

import { IRubricManagerHelpers, IRubricManagerProps, IRubricManagerState } from '../../core/rubric/RubricManager';

import RubricCategoryManager, { IRubricCategoryManagerParams } from '../../core/rubric/RubricCategoryManager';

import RubricMenuCategoryUI from './RubricMenuCategoryUI';

import { LinkedCommentsAlert, LinkedCommentsConfirm } from '../../admin/assignments/rubric/LinkedCommentsAlert';

import CPTooltip from '../../core/CPTooltip';
import { tooltips } from '../../core/tooltips';

import { CURSOR_DOMAIN } from '../CodeConsole';

import { getRubricURL } from '../../core/URLutils';

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

  showCursor: CURSOR_DOMAIN;
  updateCursorDomain: (domain: CURSOR_DOMAIN) => void;
  course: CourseType;
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

  const [cursorIndex, setCursorIndex] = React.useState(0);

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

  React.useEffect(() => {
    const tryScroll = () => {
      const rubricMenu = document.getElementById('rubric-menu');

      if (rubricMenu !== null) {
        const cursoredRows = document.getElementsByClassName('rubric-row-cursored');
        if (cursoredRows.length > 0) {
          const cursoredRow = cursoredRows[0];

          const distance = cursoredRow.getBoundingClientRect().top - rubricMenu.getBoundingClientRect().top;

          const rubricMenuVisibleHeight = rubricMenu.offsetHeight;

          if (distance < 35) {
            rubricMenu.scrollTop = rubricMenu.scrollTop - (35 - distance);
          } else if (distance > rubricMenuVisibleHeight) {
            const updatedScroll = distance - rubricMenuVisibleHeight;
            const maxScrollTop = rubricMenu.scrollHeight - rubricMenu.offsetHeight;
            rubricMenu.scrollTop = Math.min(rubricMenu.scrollTop + updatedScroll + 70, maxScrollTop);
          }
        }
      }
    };

    const handleKeydown = async (e: any) => {
      const el = document.getElementById('rubric-search');
      let searchIsFocused = false;
      if (el !== null) {
        searchIsFocused = document.activeElement === el;
      }

      if (searchIsFocused && e.key === 'ArrowDown' && props.hasActiveComment) {
        props.updateCursorDomain(CURSOR_DOMAIN.RUBRIC);
      }

      if (props.showCursor === CURSOR_DOMAIN.RUBRIC && props.hasActiveComment) {
        if (e.key === 'ArrowDown') {
          const rubricCommentCount = document.getElementsByClassName('rubric-row').length;
          setCursorIndex(Math.min(cursorIndex + 1, rubricCommentCount - 1));
          setTimeout(() => tryScroll(), 100);
        } else if (e.key === 'ArrowUp') {
          setCursorIndex(Math.max(cursorIndex - 1, 0));
          setTimeout(() => tryScroll(), 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

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
    const adjustedRubricComments = { ...rubricComments };

    // Create a category of frequently used comments
    let freq: RubricCategoryType;
    const noSort: number[] = [];

    let filteredCatgories;
    if (!props.editRubricMode && props.showFrequent) {
      // Let's be type-safe
      const rubricCommentList: RubricCommentType[] = Object.values(rubricComments).flat();

      noSort.push(-1000);
      freq = {
        id: -1000,
        name: 'Frequently used',
        rubricComments: [],
        assignment: -1,
        pointLimit: null,
        sortKey: 0,
        helpText: 'List of the 10 most frequently applied comments from this rubric.',
        atMostOnce: false,
      };

      adjustedRubricComments[-1000] = rubricCommentList
        .filter((el) => state.instanceLists[el.id] && state.instanceLists[el.id].length > 0)
        .sort((a, b) => state.instanceLists[b.id].length - state.instanceLists[a.id].length)
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

    let commentIndex = 0;

    return filteredCatgories.map((cat: RubricCategoryType, catIndex: number) => {
      const savedCategory = state.savedRubricCategories.find((el: any) => {
        return el.id === cat.id;
      });

      let filteredComments: RubricComment[] = [];
      if (cat.id in adjustedRubricComments) {
        filteredComments = adjustedRubricComments[cat.id]
          .filter((rubricComment: RubricCommentType) => {
            return rubricComment.text.toUpperCase().includes(commentSearchTerm.toUpperCase());
          })
          .sort(RubricComment.compare);
      }

      const thisIndex = commentIndex;

      const rubricCategoryManager = (
        <RubricCategoryManager
          key={cat.id}
          rubricCategory={cat}
          savedRubricCategory={savedCategory}
          rubricComments={filteredComments}
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
              showCursor: props.showCursor,
              cursorIndex: cursorIndex,
              commentIndex: thisIndex,
              showExplanations: props.showExplanations,
            };
            return <RubricMenuCategoryUI props={propsz} state={statez} helpers={helperz} />;
          }}
        </RubricCategoryManager>
      );

      commentIndex = commentIndex + filteredComments.length;

      return rubricCategoryManager;
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

  // useHotkeys(E_KEY, toggleEditRubricMode);
  useHotkeys(S_KEY, blurAndSave);

  let controls = null;
  if (state.loadComplete && props.canUserEdit && props.editRubricMode) {
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
        <CPButton cpType="primary" icon={<PlusOutlined />} style={{ minWidth: '80px' }}>
          Category
        </CPButton>
      </Popconfirm>,
      <CPButton
        key="undo"
        cpType="secondary"
        disabled={!changesMade && Object.keys(editingStatuses).length === 0}
        icon={<UndoOutlined />}
        onClick={onUndo}
        style={{ minWidth: '80px' }}
      >
        Undo
      </CPButton>,
      <Popconfirm
        title="You have unsaved changes. Would you like to save?"
        open={confirmChanges}
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
            icon={<SaveOutlined />}
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
          numComments={state.linkedComments[0] ? state.instanceLists[state.linkedComments[0].id].length : 0}
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
      focusSearch();
    }
  };

  let searchBar;

  if (props.canUserEdit) {
    const Icon = props.editRubricMode ? BackwardFilled : EditFilled;
    searchBar = (
      <Input
        allowClear
        placeholder={`Search rubric... (${osControlKey()} O)`}
        id="rubric-search"
        onChange={onSearch}
        value={searchTerm}
        addonBefore={
          <CPTooltip title={tooltips.grade.rubric.edit} placement="right">
            <Icon onClick={toggleEditRubricMode} style={{ color: '#24be85', cursor: 'pointer' }} />
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
    if (state.rubricCategories.length === 0) {
      const emptySyle: React.CSSProperties = {
        padding: '12px',
      };

      let emptyContent;
      if (props.canUserEdit) {
        emptyContent = (
          <span style={{ color: consoleTheme.siderMenuItemColor }}>
            Create your rubric either by clicking the green pen above, or visiting the{' '}
            <a href={`/${getRubricURL(props.course, props.assignment)}`} target="_blank" rel="noopener noreferrer">
              Rubric Editor
            </a>{' '}
            in the Admin Console.
          </span>
        );
      } else {
        emptyContent = <span>No rubric yet</span>;
      }

      content = (
        <div style={emptySyle}>
          <Empty
            styles={{
              image: {
                height: 60,
              },
            }}
            description={emptyContent}
          />
        </div>
      );
    } else {
      const rubricMenu = buildRubricMenu(state.rubricCategories, state.rubricComments);
      content = (
        <div id="rubric-menu-wrapper" className="rubric-menu-wrapper">
          {rubricMenu}
        </div>
      );
    }
  }

  return (
    <div className="rubric-menu-container" id="rubric-menu-container">
      <div className="rubric-menu-header" id="rubric-menu-title">
        <div className="rubric-menu-category-search">
          <CPTooltip title={tooltips.grade.rubric.categorySearch} hideThisOnHideTips={true}>
            <Tag
              className="rubric-menu-category-tag"
              style={{
                background: consoleTheme.siderBg,
                color: consoleTheme.siderTitle,
              }}
              onClick={insertCategorySearch}
            >
              category:
            </Tag>
          </CPTooltip>
        </div>
        <div className="rubric-menu-search">{searchBar}</div>
      </div>
      <div className="rubric-menu-content" id="rubric-menu">
        {content}
      </div>
      {controls && (
        <div
          className={`rubric-menu-controls ${editRubricClass}`}
          id="rubric-menu-controls"
          style={{ backgroundColor: consoleTheme.siderBg }}
        >
          {controls}
        </div>
      )}
    </div>
  );
};

export default RubricMenuUI;
