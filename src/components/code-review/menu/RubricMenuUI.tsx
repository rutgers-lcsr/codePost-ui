/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Divider, Icon, Input, InputNumber, Menu, Popover, Tag } from 'antd';

const SubMenu = Menu.SubMenu;
const InputGroup = Input.Group;
const { TextArea } = Input;

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

// import { getOperatingSystem, O_KEY, OS } from '../useHotkeys';

import InlineMarkdown from '../../core/InlineMarkdown';

import CPButton from '../../core/CPButton';
import CPFlex from '../../core/CPFlex';

import Loading from '../../core/Loading';

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
    rubricCommentMap: IRubricCategoryToRubricCommentsMap,
  ) => {
    const showDetailTag =
      rubricCategories.filter((rubricCategory: RubricCategoryType) => {
        // UI handles 35 characters at the moment for rubric category Name
        return rubricCategory.pointLimit !== null || rubricCategory.helpText !== '' || rubricCategory.name.length > 35;
      }).length > 0;

    return rubricCategories.map((rubricCategory: RubricCategoryType) => {
      const rubricComments = rubricCommentMap[rubricCategory.id].filter((rubricComment: RubricCommentType) => {
        return rubricComment.text.toUpperCase().includes(searchTerm.toUpperCase());
      });
      const rows = rubricComments.map((rubricComment: RubricCommentType) => {
        const key = `comment-${rubricCategory.id}-${rubricComment.id}`;
        return (
          <Menu.Item
            key={key}
            style={{
              backgroundColor: consoleTheme.siderBg,
              color: consoleTheme.siderMenuItemColor,
            }}
          >
            <RubricMenuCommentElement
              rubricComment={rubricComment}
              linkToComment={linkToComment}
              hasActiveComment={props.hasActiveComment}
            />
          </Menu.Item>
        );
      });

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
              backgroundColor: consoleTheme.siderSubmenuTitleBg,
              color: consoleTheme.siderSubmenuTitleColor,
              borderColor: consoleTheme.siderSubmenuBorder,
              fontSize: '10.5px',
            }}
          >
            Details
          </Tag>
        </Popover>
      ) : null;

      const onClick = () => {
        console.log('add rubric comment');
        // this.addRubricComment(rubricCategory.id);
      };
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
                backgroundColor: consoleTheme.siderSubmenuTitleBg,
                color: consoleTheme.siderSubmenuTitleColor,
                borderBottom: consoleTheme.siderSubmenuBorder,
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
          <Menu.Item
            key={`comment-${rubricCategory.id}-add`}
            style={{
              backgroundColor: consoleTheme.siderBg,
              color: consoleTheme.siderMenuItemColor,
              textAlign: 'center',
            }}
          >
            <Button type="dashed" icon="plus" size="small" style={{ width: '100%' }} onClick={onClick}>
              Add
            </Button>
          </Menu.Item>
        </SubMenu>
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

interface IRubricMenuCommentElementProps {
  rubricComment: RubricCommentType;
  hasActiveComment: boolean;
  linkToComment: any;
  // editing: boolean;
  // addEditing: any;
  // removeEditing: any;
}

const RubricMenuCommentElement = (props: IRubricMenuCommentElementProps) => {
  const [pointDelta, setPointDelta] = React.useState(props.rubricComment.pointDelta);

  let points = '';
  if (pointDelta > 0) {
    points = `-${pointDelta}`;
  } else if (pointDelta < 0) {
    points = `+${pointDelta * -1}`;
  } else {
    points = '0';
  }

  const [text, setText] = React.useState(props.rubricComment.text);

  const onClick = () => {
    props.linkToComment(props.rubricComment);
  };

  // const addEditing = () => {
  //   props.addEditing(props.rubricComment.id);
  // };

  const onChangeText = (e: any) => {
    setText(e.target.value);
  };

  const onChangePoints = (e: any) => {
    setPointDelta(e);
  };

  // if (props.editing) {
  if (false) {
    return (
      <InputGroup>
        <TextArea style={{ width: '76%' }} value={text} onChange={onChangeText} autosize={true} />
        <InputNumber style={{ width: '20%' }} value={pointDelta} onChange={onChangePoints} />
      </InputGroup>
    );
  } else {
    return (
      <div
        style={{
          padding: '0px 40px 0px 0px',
          fontSize: '12px',
        }}
        className={`rubric-row--${props.hasActiveComment ? 'active' : 'inactive'}`}
        onClick={onClick}
        // onClick={props.hasActiveComment ? onClick : addEditing}
      >
        <InlineMarkdown source={text} />
        <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>{points}</span>
        {!props.hasActiveComment ? (
          <div className="overlay">
            <Icon type="edit" />
          </div>
        ) : null}
      </div>
    );
  }
};

export default RubricMenuUI;
