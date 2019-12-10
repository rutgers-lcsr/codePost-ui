/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Divider, Icon, Input, Menu, Popover, Tag, Tooltip } from 'antd';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { AssignmentType } from '../../../infrastructure/assignment';
import { RubricComment, RubricCommentType } from '../../../infrastructure/rubricComment';

// import InlineMarkdown from '../../core/InlineMarkdown';
import BlockMarkdown from '../../core/BlockMarkdown';

import CPFlex from '../../core/CPFlex';
import CPPointInput from '../../core/CPPointInput';

import Badge from '../../core/Badge';

import { CURSOR_DOMAIN } from '../CodeConsole';

import {
  IRubricCategoryManagerProps,
  IRubricCategoryManagerState,
  IRubricCategoryManagerHelpers,
} from '../../core/rubric/RubricCategoryManager';

const SubMenu = Menu.SubMenu;
const { TextArea } = Input;

interface IRubricMenuCategoryUIProps extends IRubricCategoryManagerProps {
  hasActiveComment: boolean;
  handleRubricCommentClick: (rubricComment: RubricCommentType) => void;
  editingStatuses: { [id: number]: number };
  startEditing: (rubricCommentID: number) => void;
  linkToComment: (rubricComment: RubricCommentType) => void;
  searchTerm: string;
  assignment: AssignmentType;
  editRubricMode: boolean;
  turnOnReload: () => void;
  turnOffReload: () => void;
  showCursor: CURSOR_DOMAIN;
  cursorIndex: number;
  commentIndex: number;
  showExplanations: boolean;
}

const RubricMenuCategoryUI = ({
  props,
  state,
  helpers,
}: {
  props: IRubricMenuCategoryUIProps;
  state: IRubricCategoryManagerState;
  helpers: IRubricCategoryManagerHelpers;
}) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const buildCommentRows = (rubricCommentz: RubricCommentType[], commentMap: { [id: number]: RubricCommentType }) => {
    return rubricCommentz
      .filter((rubricComment: RubricCommentType) => {
        if (props.showExplanations && rubricComment.explanation && !props.editRubricMode) {
          return rubricComment.explanation.toUpperCase().includes(props.searchTerm.toUpperCase());
        } else {
          return rubricComment.text.toUpperCase().includes(props.searchTerm.toUpperCase());
        }
      })
      .sort(RubricComment.compare)
      .map((rubricComment, index: number) => {
        const editing = rubricComment.id < 0 || props.editingStatuses[rubricComment.id] ? true : false;

        const thisComment = commentMap[rubricComment.id];

        const startEditingThis = () => {
          props.startEditing(rubricComment.id);
        };

        if (thisComment) {
          const onChangeText = (e: any) => {
            helpers.updateRubricComment(thisComment.id, 'text', e);
          };

          const onChangePointDelta = (e: any) => {
            helpers.updateRubricComment(thisComment.id, 'pointDelta', e);
          };

          const saveComment = () => {
            helpers.saveComment(thisComment.id);
          };

          const deleteThisComment = (e: any) => {
            helpers.deleteComment(rubricComment, e);
          };

          // // @ts-ignore
          // const activateThisCommentExplorer = () => {
          //   props.activateCommentExplorer(thisComment);
          // };

          const textInput = (
            <TextArea
              style={{ backgroundColor: consoleTheme.commentTextArea, color: consoleTheme.text }}
              autosize={{ minRows: 2 }}
              value={thisComment.text}
              onChange={onChangeText}
              onBlur={saveComment}
            />
          );

          const pointInput = (
            <CPPointInput value={-thisComment.pointDelta} size="small" onChange={onChangePointDelta} disabled={false} />
          );

          const key = `comment-${props.rubricCategory.id}-${rubricComment.id}`;
          const cursored =
            props.showCursor === CURSOR_DOMAIN.RUBRIC && props.cursorIndex === props.commentIndex + index;
          return (
            <Menu.Item
              key={key}
              style={{
                backgroundColor: cursored ? 'lightblue' : consoleTheme.siderBg,
                color: consoleTheme.siderMenuItemColor,
              }}
            >
              <RubricMenuCommentElement
                editing={editing}
                startEditing={startEditingThis}
                rubricComment={rubricComment}
                linkToComment={props.linkToComment}
                hasActiveComment={props.hasActiveComment}
                textInput={textInput}
                pointInput={pointInput}
                text={thisComment.text}
                pointDelta={thisComment.pointDelta}
                deleteComment={deleteThisComment}
                assignment={props.assignment}
                editRubricMode={props.editRubricMode}
                showExplanation={props.showExplanations}
                explanation={rubricComment.explanation}
                cursored={cursored}
              />
            </Menu.Item>
          );
        } else {
          const updateRubricCommentText = (e: any) => {
            helpers.updateRubricComment(rubricComment.id, 'text', e);
          };

          const updateRubricCommentPointDelta = (e: any) => {
            helpers.updateRubricComment(rubricComment.id, 'pointDelta', e);
          };

          const saveComment = () => {
            helpers.saveComment(rubricComment.id);
          };

          const deleteThisComment = (e: any) => {
            helpers.deleteComment(rubricComment, e);
          };

          const textInput = (
            <TextArea
              style={{ backgroundColor: consoleTheme.commentTextArea, color: consoleTheme.text }}
              autosize={{ minRows: 2 }}
              value={''}
              onChange={updateRubricCommentText}
              onBlur={saveComment}
            />
          );

          const pointInput = (
            <CPPointInput
              value={-rubricComment.pointDelta}
              size="small"
              onChange={updateRubricCommentPointDelta}
              disabled={false}
            />
          );

          const key = `comment-${props.rubricCategory.id}-${rubricComment.id}`;
          const cursored =
            props.showCursor === CURSOR_DOMAIN.RUBRIC && props.cursorIndex === props.commentIndex + index;
          return (
            <Menu.Item
              key={key}
              style={{
                backgroundColor: cursored ? 'lightblue' : consoleTheme.siderBg,
                color: consoleTheme.siderMenuItemColor,
              }}
            >
              <RubricMenuCommentElement
                editing={true}
                startEditing={startEditingThis}
                rubricComment={rubricComment}
                linkToComment={props.linkToComment}
                hasActiveComment={props.hasActiveComment}
                textInput={textInput}
                pointInput={pointInput}
                text={''}
                pointDelta={0}
                deleteComment={deleteThisComment}
                assignment={props.assignment}
                editRubricMode={props.editRubricMode}
                showExplanation={props.showExplanations}
                explanation={rubricComment.explanation}
                cursored={cursored}
              />
            </Menu.Item>
          );
        }
      });
  };

  const rows = buildCommentRows(props.rubricComments, state.rubricComments);

  // hide categories with no matching comments
  if (rows.length === 0 && props.searchTerm.length > 0) {
    return null;
  }

  const showDetailTag =
    props.rubricCategory.pointLimit !== null ||
    props.rubricCategory.helpText !== '' ||
    props.rubricCategory.name.length > 35;

  const info = (
    <div>
      <div className="rubric-menu__info">
        <div>Name:</div>
        <div>{props.rubricCategory.name}</div>
      </div>
      <Divider style={{ margin: '10px 0px' }} />
      <div className="rubric-menu__info">
        <div>Point Limit: </div>
        <div>{props.rubricCategory.pointLimit === null ? 'None set' : props.rubricCategory.pointLimit}</div>
      </div>
      <Divider style={{ margin: '10px 0px' }} />
      <div className="rubric-menu__info">
        <div>Details:</div>
        <div>{props.rubricCategory.helpText ? props.rubricCategory.helpText : 'None set'}</div>
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

  const errorTag = state.hasError ? (
    <Tag color="volcano" key="warning">
      Error: {state.errorMessage}
    </Tag>
  ) : state.hasCommentError ? (
    <Tag color="volcano" key="warning">
      Error: {state.commentErrorMessage}
    </Tag>
  ) : null;

  const changeName = (e: any) => {
    props.turnOffReload();
    helpers.changeName(e);
  };

  const onBlur = () => {
    props.turnOnReload();
    helpers.saveCategory();
  };

  const onClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const title = props.editRubricMode ? (
    <Input
      value={state.name}
      onChange={changeName}
      onBlur={onBlur}
      onClick={onClick}
      ref={helpers.nameInput}
      style={{
        height: '27px',
        alignSelf: 'center',
        fontWeight: 500,
        backgroundColor: consoleTheme.commentTextArea,
        color: consoleTheme.text,
      }}
    />
  ) : (
    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '150px' }}>
      {props.rubricCategory.name}{' '}
      {props.rubricCategory.atMostOnce ? (
        <Tooltip title="This category can be applied at most once.">
          <Icon type="tag" />
        </Tooltip>
      ) : null}
    </div>
  );

  const addComment = () => {
    props.turnOffReload();
    helpers.addComment();
  };

  return (
    <Menu
      defaultOpenKeys={[`category-${props.rubricCategory.id}`]}
      selectedKeys={[]}
      mode="inline"
      className="rubric-menu"
      style={{ backgroundColor: consoleTheme.siderBg }}
    >
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
              <CPFlex left={[title, errorTag]} right={[capTag]} gutterSize={14} />
            </div>
          </div>
        }
      >
        {rows}
        {props.editRubricMode && props.searchTerm.length === 0 ? (
          <Menu.Item
            key={`comment-${props.rubricCategory.id}-add`}
            style={{
              textAlign: 'center',
            }}
          >
            <Button
              type="default"
              icon="plus"
              size="small"
              style={{ width: '180px', backgroundColor: consoleTheme.siderBg, color: consoleTheme.siderMenuItemColor }}
              onClick={addComment}
            >
              Add Comment
            </Button>
          </Menu.Item>
        ) : null}
      </SubMenu>
    </Menu>
  );
};

interface IRubricMenuCommentElementProps {
  rubricComment: RubricCommentType;
  hasActiveComment: boolean;
  linkToComment: any;
  editing: boolean;
  startEditing: any;
  textInput: React.ReactNode;
  pointInput: React.ReactNode;
  text: string;
  pointDelta: number;
  deleteComment: any;
  assignment: any;
  editRubricMode: boolean;
  cursored: boolean;
  showExplanation: boolean;
  explanation: string;
}

const RubricMenuCommentElement = (props: IRubricMenuCommentElementProps) => {
  let points = '';
  if (props.pointDelta > 0) {
    points = `-${props.pointDelta}`;
  } else if (props.pointDelta < 0) {
    points = `+${props.pointDelta * -1}`;
  } else {
    points = '0';
  }

  const onClick = () => {
    props.linkToComment(props.rubricComment);
  };

  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      if (props.cursored && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        props.linkToComment(props.rubricComment);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  if (!props.editRubricMode) {
    const canShowExplanation = props.showExplanation && props.explanation.length > 0;
    return (
      <div
        style={{
          padding: '0px 40px 0px 0px',
          fontSize: '12px',
        }}
        className="rubric-row--active"
        onClick={onClick}
      >
        <BlockMarkdown
          source={props.text.length === 0 ? '-' : canShowExplanation ? props.explanation : props.text}
          em={canShowExplanation}
        />
        <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>{points}</span>
      </div>
    );
  } else if (props.editing) {
    return (
      <div className="rubric-row--editing">
        {props.textInput}
        {props.pointInput}
        <div style={{ width: '40px' }} />
        <div
          style={{
            position: 'absolute',
            right: '0px',
            width: '35px',
            borderLeft: '1px solid #ececec',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            alignItems: 'center',
          }}
        >
          <Icon type="delete" onClick={props.deleteComment} style={{ fontSize: '11px', margin: '0px' }} />
        </div>
      </div>
    );
  } else {
    return (
      <div
        style={{
          padding: '0px 40px 0px 0px',
          fontSize: '12px',
        }}
        className={`rubric-row--${props.hasActiveComment ? 'active' : 'inactive'} `}
        onClick={props.hasActiveComment ? onClick : props.startEditing}
      >
        <BlockMarkdown source={props.text.length === 0 ? '-' : props.text} />
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

export default RubricMenuCategoryUI;
