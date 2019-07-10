/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Divider, Input, Menu, Popover, Tag } from 'antd';
import { ClickParam } from 'antd/lib/menu';
const SubMenu = Menu.SubMenu;

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { RUBRIC_SEARCH_SHORTCUT } from '../Shortcuts';

import CPTooltip from '../../../components/core/CPTooltip';

/**********************************************************************************************************************/

interface IRubricMenuProps {
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;
  handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
}

interface IRubricMenuState {
  searchTerm: string;
}

class RubricMenu extends React.Component<IRubricMenuProps, IRubricMenuState> {
  public state: Readonly<IRubricMenuState> = {
    searchTerm: '',
  };

  public componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  public componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  public handleKeyDown = (e: any) => {
    // Keyboard shortcuts
    if (e.which === RUBRIC_SEARCH_SHORTCUT && e.metaKey) {
      e.preventDefault();
      const el = document.getElementById('rubric-search');
      if (el !== null) {
        el.focus();
      }
    }
  };

  public onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchTerm: e.target.value });
  };

  public onClick = (param: ClickParam) => {
    const [categoryID, commentID] = param.key.split('-').slice(-2);

    const rubricComment = this.props.rubricComments[+categoryID].find((comment: RubricCommentType) => {
      return comment.id === +commentID;
    });

    if (rubricComment !== undefined) {
      this.props.handleRubricCommentClick(rubricComment);
    }
  };

  public buildRubricMenu = (
    rubricCategories: RubricCategoryType[],
    rubricCommentMap: IRubricCategoryToRubricCommentsMap,
  ) => {
    return rubricCategories.map((rubricCategory: RubricCategoryType) => {
      const rubricComments = rubricCommentMap[rubricCategory.id].filter((rubricComment: RubricCommentType) => {
        return rubricComment.text.toUpperCase().includes(this.state.searchTerm.toUpperCase());
      });
      const rows = rubricComments.map((rubricComment: RubricCommentType) => {
        let points = '';
        if (rubricComment.pointDelta > 0) {
          points = `-${rubricComment.pointDelta}`;
        } else if (rubricComment.pointDelta < 0) {
          points = `+${rubricComment.pointDelta * -1}`;
        } else {
          points = `${rubricComment.pointDelta}`;
        }

        return (
          <Menu.Item
            key={`comment-${rubricCategory.id}-${rubricComment.id}`}
            onClick={this.onClick}
            style={{
              backgroundColor: this.context.consoleTheme.siderBg,
              color: this.context.consoleTheme.siderMenuItemColor,
            }}
          >
            <span>{rubricComment.text}</span>
            <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>
              {points}
            </span>
          </Menu.Item>
        );
      });

      const info = (
        <div>
          <div>
            <b>Point Limit: </b>
            {rubricCategory.pointLimit === null ? 'n/a' : rubricCategory.pointLimit}
          </div>
          <Divider style={{ margin: '10px 0px' }} />
          {rubricCategory.helpText ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>
              <b>Details: </b>
              {rubricCategory.helpText}
            </div>
          ) : null}
        </div>
      );

      const capTag =
        rubricCategory.pointLimit !== null || rubricCategory.helpText !== null ? (
          <Popover title="Category Details" content={info}>
            <Tag>Details</Tag>
          </Popover>
        ) : null;

      // Unfortunately, Ant API doesn't give us direct access to subcomponents (e.g. ant-submenu-title)
      // So we can't update the styles with inline js (only css selectors)
      // In order to handle dark mode, we inject an absolutely positioned div to simulate the title space
      return (
        <SubMenu
          key={`category-${rubricCategory.id}`}
          title={
            <div
              style={{
                position: 'absolute',
                width: '100%',
                paddingLeft: '26px',
                backgroundColor: this.context.consoleTheme.siderSubmenuTitleBg,
                color: this.context.consoleTheme.siderSubmenuTitleColor,
                borderBottom: this.context.consoleTheme.siderSubmenuBorder,
              }}
            >
              <CPTooltip placement="right" title={info}>
                <div style={{ paddingRight: '40px' }}>
                  <span>
                    {rubricCategory.name}
                    <span style={{ float: 'right' }}>{capTag}</span>
                  </span>
                </div>
              </CPTooltip>
            </div>
          }
        >
          {rows}
        </SubMenu>
      );
    });
  };

  public render() {
    const rubricMenu = this.buildRubricMenu(this.props.rubricCategories, this.props.rubricComments);
    const rubricKeys = this.props.rubricCategories.map((rubricCategory: RubricCategoryType) => {
      return `category-${rubricCategory.id}`;
    });

    return (
      <div style={{ marginTop: '8px' }}>
        <div id="rubric-menu-title" style={{ marginBottom: '5px', display: 'flex' }}>
          <Input
            placeholder="Search rubric...(⌘ O)"
            id="rubric-search"
            onChange={this.onSearch}
            value={this.state.searchTerm}
            style={{
              backgroundColor: this.context.consoleTheme.siderBg,
              border: this.context.consoleTheme.buttonSecondaryBorder,
              color: this.context.consoleTheme.buttonSecondaryColor,
              width: '90%',
              margin: '0 auto',
            }}
          />
        </div>
        <div style={{ height: '100%', overflow: 'scroll' }}>
          <Menu
            defaultOpenKeys={rubricKeys}
            selectedKeys={[]}
            mode="inline"
            className="rubric-menu"
            id="rubric-menu"
            style={{ backgroundColor: this.context.consoleTheme.siderBg }}
          >
            {rubricMenu}
          </Menu>
        </div>
      </div>
    );
  }
}
RubricMenu.contextType = ConsoleThemeContext;

export default RubricMenu;
