// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { BackwardFilled, EditFilled, PlusOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Popconfirm, Space, Tag, theme, Typography } from 'antd';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';
import { RubricCategory, RubricComment } from '../../../api-client';
import {
  compareRubricCategories,
  compareRubricComments,
} from '../../../components/admin/assignments/rubric/RubricUtils';

import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

import useHotkeys, { O_KEY, S_KEY } from '../useHotkeys';

import { osControlKey } from '../../../components/core/operatingSystem';

import Loading from '../../../components/core/Loading';

import { RESOLUTION } from '../../../components/core/rubric/RubricManager';

import {
  IRubricManagerHelpers,
  IRubricManagerProps,
  IRubricManagerState,
} from '../../../components/core/rubric/RubricManager';

import RubricCategoryManager, {
  IRubricCategoryManagerParams,
} from '../../../components/core/rubric/RubricCategoryManager';

import RubricMenuCategoryUI from './RubricMenuCategoryUI';

import {
  LinkedCommentsAlert,
  LinkedCommentsConfirm,
} from '../../../components/admin/assignments/rubric/LinkedCommentsAlert';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import { CURSOR_DOMAIN } from '../CodeConsoleEnums';

import { getRubricURL } from '../../../components/core/URLutils';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { useConsoleActions } from '../ConsoleActionsContext';

/**********************************************************************************************************************/

enum EDITING_STATUS {
  NOT_EDITING,
  EDITING,
}

type DragResultLike = {
  destination?: { droppableId: string; index: number } | null;
  source: { index: number };
};

interface IRubricMenuUIProps extends IRubricManagerProps {
  /* is the console in demo mode? */
  isDemoMode: boolean;

  /* is the current user a course admin? */
  isAdmin: boolean;
}

const RubricMenuUI = ({
  props: rubricManagerProps,
  state,
  helpers,
}: {
  props: IRubricMenuUIProps;
  state: IRubricManagerState;
  helpers: IRubricManagerHelpers;
}) => {
  // Read from store + context to avoid prop drilling
  const assignment = useCodeConsoleStore((s) => s.assignment);
  const course = useCodeConsoleStore((s) => s.course)!;
  const activeCommentID = useCodeConsoleStore((s) => s.activeCommentID);
  const editRubricMode = useCodeConsoleStore((s) => s.editRubricMode);
  const showCursor = useCodeConsoleStore((s) => s.showCursor);
  const noSave = useCodeConsoleStore((s) => s.noSave);
  const { comment, submission, ui } = useConsoleActions();

  // Merge RubricManager render-prop data with store/context data
  const props = {
    ...rubricManagerProps,
    handleRubricCommentClick: comment.onRubricCommentClick,
    hasActiveComment: activeCommentID !== undefined,
    toggleEditRubricMode: ui.toggleEditRubricMode,
    editRubricMode,
    setRubric: submission.setRubric,
    turnOnReload: submission.turnOnReload,
    turnOffReload: submission.turnOffReload,
    canUserEdit: rubricManagerProps.isDemoMode
      ? true
      : !!(rubricManagerProps.isAdmin || assignment?.collaborativeRubricMode || course?.isRubricEditor),
    showCursor,
    updateCursorDomain: ui.updateCursorDomain,
    demoMode: rubricManagerProps.isDemoMode || noSave === true,
    showFrequent: !!assignment?.showFrequentlyUsedRubricComments,
    course,
  };
  type RubricMenuCategoryProps = React.ComponentProps<typeof RubricMenuCategoryUI>['props'];
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const { token } = theme.useToken();
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

    const handleKeydown = async (e: KeyboardEvent) => {
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

  const linkToComment = (rubricComment: RubricComment) => {
    if (rubricComment !== undefined) {
      props.handleRubricCommentClick(rubricComment);
    }
  };

  const buildRubricMenu = (rubricCategories: RubricCategory[], rubricComments: IRubricCategoryToRubricCommentsMap) => {
    // sample search: category:dfdfdfdf some other text
    // sample search: category:"some text" some other text

    // If user has specified a category with category:[some text], respect it
    const categoryMatches = searchTerm.match(/(category:[a-z0-9]+)|(category:"[a-z0-9\s]+")/i);
    const adjustedRubricComments = { ...rubricComments };

    // Create a category of frequently used comments
    let freq: RubricCategory;
    const noSort: number[] = [];

    let filteredCatgories;
    if (!props.editRubricMode && props.showFrequent) {
      // Let's be type-safe
      const rubricCommentList: RubricComment[] = Object.values(rubricComments).flat();

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
      filteredCatgories = [freq, ...rubricCategories.sort(compareRubricCategories)];
    } else {
      filteredCatgories = rubricCategories.sort(compareRubricCategories);
    }

    let commentSearchTerm = searchTerm;
    if (categoryMatches !== null && categoryMatches.length > 0) {
      const categoryName = categoryMatches[0].split(':')[1].slice(1, -1);
      filteredCatgories = rubricCategories.filter((el) => {
        return el.name.toUpperCase().includes(categoryName.toUpperCase());
      });
      commentSearchTerm = searchTerm
        .split(' ')
        .filter((el: string) => {
          return !el.includes('category:');
        })
        .join(' ');
    }

    // if user is trying to invoke category search, don't try searching for the search term
    if ('category:'.includes(commentSearchTerm)) {
      commentSearchTerm = '';
    }

    let commentIndex = 0;

    return filteredCatgories.map((cat: RubricCategory, catIndex: number) => {
      const savedCategory = state.savedRubricCategories.find((el: RubricCategory) => {
        return el.id === cat.id;
      });

      let filteredComments: RubricComment[] = [];
      if (cat.id in adjustedRubricComments) {
        filteredComments = adjustedRubricComments[cat.id]
          .filter((rubricComment: RubricComment) => {
            const term = commentSearchTerm.toUpperCase();
            const matchesText = (rubricComment.text || '').toUpperCase().includes(term);
            const matchesExplanation =
              !props.editRubricMode &&
              rubricComment.explanation &&
              rubricComment.explanation.toUpperCase().includes(term);
            const matchesInstruction =
              !props.editRubricMode &&
              rubricComment.instructionText &&
              rubricComment.instructionText.toUpperCase().includes(term);

            return matchesText || matchesExplanation || matchesInstruction;
          })
          .sort(compareRubricComments);
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
          onCommentDragEnd={(...args: unknown[]) => helpers.onCommentDragEnd(args[0] as DragResultLike)}
          moveCategory={helpers.moveCategory}
          index={catIndex}
          numCategories={state.rubricCategories.length}
          otherCategories={state.rubricCategories}
          feedbackScores={state.feedbackScores}
          commentFeedbackOn={props.assignment.commentFeedback ?? false}
          showPointLimits={true}
          showHelpText={true}
          showExplanations={true}
          showInstructions={true}
          showAtMostOnce={true}
          instanceLists={state.instanceLists}
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
            };
            return (
              <RubricMenuCategoryUI
                props={propsz as unknown as RubricMenuCategoryProps}
                state={statez}
                helpers={helperz}
              />
            );
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

    const addRubricCategory = () => {
      helpers.addRubricCategory(newCategoryName);
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

    const categoryForm = (
      <Input placeholder="Category name" value={newCategoryName} onChange={onChangeCategoryName} allowClear autoFocus />
    );

    controls = (
      <>
        <Space size={[8, 8]} wrap>
          <Popconfirm
            icon={null}
            title={categoryForm}
            okText="Create"
            cancelText="Cancel"
            onConfirm={addRubricCategory}
            onCancel={onCancel}
          >
            <Button type="primary" icon={<PlusOutlined />} style={{ minWidth: 112 }}>
              New Category
            </Button>
          </Popconfirm>
          <Button
            icon={<UndoOutlined />}
            onClick={onUndo}
            disabled={!changesMade && Object.keys(editingStatuses).length === 0}
            style={{ minWidth: 112 }}
          >
            Undo
          </Button>
          <Popconfirm
            title="You have unsaved changes. Would you like to save?"
            open={confirmChanges}
            onConfirm={confirm}
            onCancel={cancel}
            okText="Yes"
            cancelText="No, undo"
          >
            <CPTooltip title={changesMade ? tooltips.grade.rubric.save : null} hideThisOnHideTips={true}>
              <Button
                type="primary"
                id="rubric-save-button"
                icon={<SaveOutlined />}
                onClick={onSave}
                disabled={!changesMade}
                loading={state.isSaving}
                style={{ minWidth: 112 }}
              >
                Save Changes
              </Button>
            </CPTooltip>
          </Popconfirm>
        </Space>
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
      </>
    );
  }

  const insertCategorySearch = () => {
    if (!searchTerm.includes('category:')) {
      setSearchTerm(searchTerm === '' ? 'category:' : `${searchTerm} category:`);
      focusSearch();
    }
  };

  let content = <Loading />;
  if (state.loadComplete) {
    if (state.rubricCategories.length === 0) {
      const emptySyle: React.CSSProperties = {
        padding: '12px',
      };

      let emptyContent;
      // const descriptionColor = props.canUserEdit ? token.colorTextSecondary : token.colorText;
      if (props.canUserEdit) {
        emptyContent = (
          <Typography.Text>
            Create your rubric either by clicking the edit icon above, or visiting the{' '}
            <Typography.Link
              href={`/${getRubricURL(props.course, props.assignment)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Rubric Editor
            </Typography.Link>{' '}
            in the Admin Console.
          </Typography.Text>
        );
      } else {
        emptyContent = <Typography.Text>No rubric yet</Typography.Text>;
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
      <Flex
        className="rubric-menu-header"
        id="rubric-menu-title"
        align="center"
        gap={token.sizeSM}
        style={{
          padding: `${token.paddingXS}px ${token.paddingSM}px`,
          backgroundColor: consoleTheme.siderBg,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <CPTooltip title={tooltips.grade.rubric.categorySearch} hideThisOnHideTips={true}>
          <Tag
            className="rubric-menu-category-tag"
            bordered
            onClick={insertCategorySearch}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                insertCategorySearch();
              }
            }}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              margin: 0,
            }}
          >
            category:
          </Tag>
        </CPTooltip>

        <div className="rubric-menu-search" style={{ flex: 1, minWidth: 0 }}>
          {/* We reconstruct the input here to separate the edit button if needed, but for now just rendering the updated searchBar */}
          <Input
            allowClear
            aria-label="Search Rubric"
            placeholder={`Search... (${osControlKey()} O)`}
            id="rubric-search"
            onChange={onSearch}
            value={searchTerm}
            className={consoleThemes.light === consoleTheme ? 'search--light' : 'search--dark'}
          />
        </div>

        {props.canUserEdit && (
          <CPTooltip title={tooltips.grade.rubric.edit} placement="bottomRight">
            <Button
              size="small"
              type={props.editRubricMode ? 'primary' : 'text'}
              icon={props.editRubricMode ? <BackwardFilled /> : <EditFilled />}
              onClick={toggleEditRubricMode}
              aria-label={props.editRubricMode ? 'Exit rubric edit mode' : 'Enter rubric edit mode'}
              style={{
                color: props.editRubricMode ? token.colorWhite : consoleTheme.siderMenuItemColor,
              }}
            />
          </CPTooltip>
        )}
      </Flex>
      <div className="rubric-menu-content" id="rubric-menu">
        {content}
      </div>
      {controls && (
        <div
          className={`rubric-menu-controls ${editRubricClass}`}
          id="rubric-menu-controls"
          style={{
            backgroundColor: consoleTheme.siderBg,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            padding: `${token.paddingSM}px`,
          }}
        >
          {controls}
        </div>
      )}
    </div>
  );
};

export default RubricMenuUI;
