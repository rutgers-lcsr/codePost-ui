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

import { getOperatingSystem, O_KEY, OS } from '../useHotkeys';

import InlineMarkdown from '../../core/InlineMarkdown';

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

  public focusSearch = () => {
    const el = document.getElementById('rubric-search');
    if (el !== null) {
      el.focus();
    }
  };

  public handleKeyDown = (e: any) => {
    const os = getOperatingSystem();
    const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

    // Keyboard shortcuts
    if (e.which === O_KEY && triggerKey) {
      e.preventDefault();
      this.focusSearch();
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
    const showDetailTag =
      rubricCategories.filter((rubricCategory: RubricCategoryType) => {
        // UI handles 35 characters at the moment for rubric category Name
        return rubricCategory.pointLimit !== null || rubricCategory.helpText !== '' || rubricCategory.name.length > 35;
      }).length > 0;

    // sample search: category:dfdfdfdf some other text
    // sample search: category:"some text" some other text

    // If user has specified a category with category:[some text], respect it
    const categoryMatches = this.state.searchTerm.match(/(category:[a-z0-9]+)|(category:"[a-z0-9\s]+")/i);

    let filteredCatgories = rubricCategories;
    let commentSearchTerm = this.state.searchTerm;
    if (categoryMatches !== null && categoryMatches.length > 0) {
      const categoryName = categoryMatches[0].split(':')[1].slice(1, -1);
      console.log(categoryName);
      filteredCatgories = rubricCategories.filter((el) => {
        return el.name.toUpperCase().includes(categoryName.toUpperCase());
      });
      commentSearchTerm = this.state.searchTerm
        .split(' ')
        .filter((el) => {
          return !el.includes('category:');
        })
        .join(' ');
    }

    // if user is trying to invoke category search, don't try searching for the search term
    if ('category:'.includes(commentSearchTerm)) {
      commentSearchTerm = '';
    }

    return filteredCatgories.map((rubricCategory: RubricCategoryType) => {
      const rubricComments = rubricCommentMap[rubricCategory.id].filter((rubricComment: RubricCommentType) => {
        return rubricComment.text.toUpperCase().includes(commentSearchTerm.toUpperCase());
      });
      const rows = rubricComments.map((rubricComment: RubricCommentType) => {
        return (
          <Menu.Item
            key={`comment-${rubricCategory.id}-${rubricComment.id}`}
            onClick={this.onClick}
            style={{
              backgroundColor: this.context.consoleTheme.siderBg,
              color: this.context.consoleTheme.siderMenuItemColor,
            }}
          >
            <RubricMenuCommentElement key={rubricComment.id} rubricComment={rubricComment} />
          </Menu.Item>
        );
      });

      // hide categories with no matching comments
      if (rows.length === 0) {
        return null;
      }

      const info = (
        <div>
          <div className="rubric-menu__info">
            <div>Name:</div>
            <div>{rubricCategory.name}</div>
          </div>
          <Divider style={{ margin: '10px 0px' }} />
          <div className="rubric-menu__info">
            <div>Point Limit: </div>
            <div>{rubricCategory.pointLimit === null ? 'None set' : rubricCategory.pointLimit}</div>
          </div>
          <Divider style={{ margin: '10px 0px' }} />
          <div className="rubric-menu__info">
            <div>Details:</div>
            <div>{rubricCategory.helpText ? rubricCategory.helpText : 'None set'}</div>
          </div>
        </div>
      );

      const capTag = showDetailTag ? (
        <Popover title="Category Details" content={info}>
          <Tag
            style={{
              backgroundColor: this.context.consoleTheme.siderSubmenuTitleBg,
              color: this.context.consoleTheme.siderSubmenuTitleColor,
              borderColor: this.context.consoleTheme.siderSubmenuBorder,
              fontSize: '10.5px',
            }}
          >
            Details
          </Tag>
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
                paddingLeft: '20px',
                backgroundColor: this.context.consoleTheme.siderSubmenuTitleBg,
                color: this.context.consoleTheme.siderSubmenuTitleColor,
                borderBottom: this.context.consoleTheme.siderSubmenuBorder,
              }}
            >
              <div style={{ paddingRight: '30px' }}>
                <div className="display-flex justify-content-space-between">
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{rubricCategory.name}</span>
                  <span style={{ float: 'right' }}>{capTag}</span>
                </div>
              </div>
            </div>
          }
        >
          {rows}
        </SubMenu>
      );
    });
  };

  public insertCategorySearch = () => {
    if (!this.state.searchTerm.includes('category:')) {
      this.setState((oldState) => {
        return {
          searchTerm: oldState.searchTerm === '' ? 'category:' : `${oldState.searchTerm} category:`,
        };
      });
      this.focusSearch();
    }
  };

  public render() {
    const rubricMenu = this.buildRubricMenu(this.props.rubricCategories, this.props.rubricComments);
    const rubricKeys = this.props.rubricCategories.map((rubricCategory: RubricCategoryType) => {
      return `category-${rubricCategory.id}`;
    });

    return (
      <div>
        <div id="rubric-menu-title" style={{ marginBottom: '5px', padding: '0px 6px' }}>
          <div style={{ textAlign: 'right' }}>
            <Tag
              style={{
                background: '#fff',
                borderStyle: 'dashed',
                marginBottom: '4px',
                marginRight: '0px',
                cursor: 'pointer',
              }}
              onClick={this.insertCategorySearch}
            >
              category:
            </Tag>
          </div>
          <Input
            placeholder="Search rubric... (⌘ O)"
            id="rubric-search"
            onChange={this.onSearch}
            value={this.state.searchTerm}
            style={{
              backgroundColor: this.context.consoleTheme.siderBg,
              border: this.context.consoleTheme.buttonSecondaryBorder,
              color: this.context.consoleTheme.buttonSecondaryColor,
              width: '100%',
              margin: '0 auto',
            }}
          />
        </div>
        <div id="rubric-menu" style={{ height: '100%', overflow: 'auto' }}>
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

interface IRubricMenuCommentElementProps {
  rubricComment: RubricCommentType;
}

const RubricMenuCommentElement = (props: IRubricMenuCommentElementProps) => {
  let points = '';
  if (props.rubricComment.pointDelta > 0) {
    points = `-${props.rubricComment.pointDelta}`;
  } else if (props.rubricComment.pointDelta < 0) {
    points = `+${props.rubricComment.pointDelta * -1}`;
  } else {
    points = '0';
  }

  return (
    <div
      style={{
        padding: '0px 10px 0px 0px',
        fontSize: '12px',
      }}
    >
      <InlineMarkdown source={props.rubricComment.text} />
      <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>{points}</span>
    </div>
  );
};

export default RubricMenu;
