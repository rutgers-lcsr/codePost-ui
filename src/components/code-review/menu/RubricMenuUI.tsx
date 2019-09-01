/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Input, Menu } from 'antd';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

import { RubricCategory, RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from '../../../infrastructure/rubricComment';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

// import { getOperatingSystem, O_KEY, OS } from '../useHotkeys';

import CPButton from '../../core/CPButton';
import CPFlex from '../../core/CPFlex';

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

  const startEditing = (rubricCommentID: number) => {
    const newEditingStatuses = { ...editingStatuses, [rubricCommentID]: EDITING_STATUS.EDITING };
    setEditingStatuses(newEditingStatuses);
  };

  // TODO, FIXME: addEventListener, keydown

  // public componentDidMount() {
  //   document.addEventListener('keydown', this.handleKeyDown);
  // }

  // public componentWillUnmount() {
  //   document.removeEventListener('keydown', this.handleKeyDown);
  // }

  // public handleKeyDown = (e: any) => {
  //   const os = getOperatingSystem();
  //   const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

  //   // Keyboard shortcuts
  //   if (e.which === O_KEY && triggerKey) {
  //     e.preventDefault();
  //     const el = document.getElementById('rubric-search');
  //     if (el !== null) {
  //       el.focus();
  //     }
  //   }
  // };

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
            };
            return <RubricMenuCategoryUI props={propsz} state={statez} helpers={helperz} />;
          }}
        </RubricCategoryManager>
      );
    });
  };

  let controls: React.ReactNode[] = [null];
  if (state.loadComplete) {
    const changesMade = helpers.changesMade();

    const onSave = (e: any) => {
      helpers.onSave(undefined, e);
      setEditingStatuses({});
    };

    const onUndo = (e: any) => {
      helpers.resetRubric();
      setEditingStatuses({});
    };

    controls = [
      <CPButton key="0" size="small" cpType="secondary" disabled={!changesMade} icon="undo" onClick={onUndo} />,
      <CPButton
        key="1"
        size="small"
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
      <div id="rubric-menu-title" style={{ marginBottom: '5px', width: '100%', textAlign: 'center' }}>
        <div style={{ margin: '0px 18px 5px 0px' }}>
          <CPFlex left={[]} right={controls} gutterSize={10} />
        </div>
        <Input
          placeholder="Search rubric... (⌘ O)"
          id="rubric-search"
          onChange={onSearch}
          value={searchTerm}
          style={{
            backgroundColor: consoleTheme.siderBg,
            border: consoleTheme.buttonSecondaryBorder,
            color: consoleTheme.buttonSecondaryColor,
            width: '90%',
          }}
        />
      </div>
      <div id="rubric-menu" style={{ height: '100%', overflow: 'auto' }}>
        {content}
      </div>
    </div>
  );
};

export default RubricMenuUI;
