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
//   tmpRubricCategories: RubricCategoryType[];
//   tmpRubricComments: IRubricCategoryToRubricCommentsMap;
//   tmpEditing: number[];
//   counter: number;
// }

const RubricMenuUI = ({ props, state, helpers }: any) => {
  // class RubricMenu extends React.Component<IRubricMenuProps, IRubricMenuState> {
  // public state: Readonly<IRubricMenuState> = {
  //   searchTerm: '',
  //   tmpRubricCategories: this.props.rubricCategories,
  //   tmpRubricComments: this.props.rubricComments,
  //   tmpEditing: [],
  //   counter: -1,
  // };

  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const [searchTerm, setSearchTerm] = React.useState('');

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
    // this.setState({ searchTerm: e.target.value });
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

  // const addRubricComment = (rubricCategoryID: number) => {
  //   const emptyRubricComment: RubricCommentType = {
  //     id: this.state.counter,
  //     text: '',
  //     pointDelta: 0,
  //     category: rubricCategoryID,
  //     comments: [],
  //     sortKey: 0,
  //   };

  //   const appended = this.state.tmpRubricComments[rubricCategoryID].concat([emptyRubricComment]);

  //   const updated = { ...this.state.tmpRubricComments, [rubricCategoryID]: appended };
  //   this.addEditing(this.state.counter);
  //   this.setState({ tmpRubricComments: updated, counter: this.state.counter - 1 });
  // };

  const buildRubricMenu = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    const changesMade = helpers.changesMade();
    console.log('changes', changesMade);

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
              linkToComment,
            };
            return <RubricMenuCategoryUI props={propsz} state={statez} helpers={helperz} />;
          }}
        </RubricCategoryManager>
      );
    });
  };

  // public addEditing = (id: number) => {
  //   if (!this.state.tmpEditing.includes(id)) {
  //     this.setState({ tmpEditing: this.state.tmpEditing.concat([id]) });
  //   }
  // };

  // public removeEditing = (id: number) => {
  //   if (this.state.tmpEditing.includes(id)) {
  //     const rem = this.state.tmpEditing.filter((i: number) => {
  //       return i !== id;
  //     });
  //     this.setState({ tmpEditing: rem });
  //   }
  // };

  // public onSave = () => {
  //   this.setState({ tmpEditing: [] });
  // };

  let controls: React.ReactNode[] = [null];
  if (state.loadComplete) {
    controls = [
      <CPButton key="0" size="small" cpType="secondary" disabled={false} icon="undo" />,
      <CPButton
        key="1"
        size="small"
        disabled={false}
        cpType="primary"
        icon="save"
        loading={false}
        style={{ minWidth: '80px' }}
        // onClick={this.onSave}
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
