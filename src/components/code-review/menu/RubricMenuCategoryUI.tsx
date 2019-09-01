/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Menu } from 'antd';

const SubMenu = Menu.SubMenu;

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

const RubricMenuCategoryUI = ({ props, state, helpers }: any) => {
  // Capturing ...otherProps allows us to catch the required Ant props from
  // ParentMenu -> Menu.SubMenu
  const {
    rubricCategory,
    savedRubricCategory,
    rubricComments,
    savedRubricComments,
    updateCategory,
    deleteCategory,
    addComment,
    updateComment,
    deleteComment,
    onEdit,
    onUndo,
    onCommentEdit,
    onCommentUndo,
    activateCommentExplorer,
    onCommentDragEnd,
    moveCategory,
    index,
    numCategories,
    otherCategories,
    feedbackScores,
    commentFeedbackOn,
    ...otherProps
  } = props;

  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  return (
    <SubMenu
      key={`category-${props.rubricCategory.id}`}
      title={
        <div
          style={{
            position: 'absolute',
            width: '100%',
            paddingLeft: '20px',
            backgroundColor: consoleTheme.siderSubmenuTitleBg,
            color: consoleTheme.siderSubmenuTitleColor,
            borderBottom: consoleTheme.siderSubmenuBorder,
          }}
        >
          <div style={{ paddingRight: '30px' }}>
            <div className="display-flex justify-content-space-between">
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{props.rubricCategory.name}</span>
              <span style={{ float: 'right' }}>capTag</span>
            </div>
          </div>
        </div>
      }
      {...otherProps}
    >
      rows
      <Menu.Item
        key={`comment-${props.rubricCategory.id}-add`}
        style={{
          backgroundColor: consoleTheme.siderBg,
          color: consoleTheme.siderMenuItemColor,
          textAlign: 'center',
        }}
      >
        <Button type="dashed" icon="plus" size="small" style={{ width: '100%' }}>
          Add
        </Button>
      </Menu.Item>
    </SubMenu>
  );
};

export default RubricMenuCategoryUI;
