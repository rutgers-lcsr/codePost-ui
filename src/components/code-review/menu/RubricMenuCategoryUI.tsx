/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Divider, Icon, Input, Menu, Popover, Tag } from 'antd';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { AssignmentType } from '../../../infrastructure/assignment';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

import InlineMarkdown from '../../core/InlineMarkdown';

import CPFlex from '../../core/CPFlex';
import CPPointInput from '../../core/CPPointInput';

import Badge from '../../core/Badge';

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
    handleRubricCommentClick,
    hasActiveComment,
    editingStatuses,
    startEditing,
    linkToComment,
    searchTerm,
    assignment,
    editRubricMode,
    ...otherProps
  } = props;

  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const buildCommentRows = (rubricCommentz: RubricCommentType[], commentMap: { [id: number]: RubricCommentType }) => {
    return rubricCommentz
      .filter((rubricComment: RubricCommentType) => {
        return rubricComment.text.toUpperCase().includes(props.searchTerm.toUpperCase());
      })
      .map((rubricComment) => {
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

          const linkedComments = (
            <Badge count={thisComment.comments.length} forcedStyle="neutral" faded={false} size="small" />
          );

          const key = `comment-${props.rubricCategory.id}-${rubricComment.id}`;
          return (
            <Menu.Item
              key={key}
              style={{
                backgroundColor: consoleTheme.siderBg,
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
                linkedComments={linkedComments}
                editRubricMode={props.editRubricMode}
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
          return (
            <Menu.Item
              key={key}
              style={{
                backgroundColor: consoleTheme.siderBg,
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
                linkedComments={null}
                editRubricMode={props.editRubricMode}
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

  const errorTag = state.hasError ? (
    <Tag color="volcano" key="warning">
      Error: {state.errorMessage}
    </Tag>
  ) : state.hasCommentError ? (
    <Tag color="volcano" key="warning">
      Error: {state.commentErrorMessage}
    </Tag>
  ) : null;

  const title = props.editRubricMode ? (
    <Input
      value={state.name}
      onChange={helpers.changeName}
      onBlur={helpers.saveCategory}
      ref={helpers.nameInput}
      style={{
        height: '27px',
        width: '60%',
        alignSelf: 'center',
        fontWeight: 500,
        backgroundColor: consoleTheme.commentTextArea,
        color: consoleTheme.text,
      }}
    />
  ) : (
    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{props.rubricCategory.name}</span>
  );

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
        {...otherProps}
      >
        {rows}
        {props.editRubricMode ? (
          <Menu.Item
            key={`comment-${props.rubricCategory.id}-add`}
            style={{
              textAlign: 'center',
            }}
          >
            <Button
              type="dashed"
              icon="plus"
              size="small"
              style={{ width: '100%', backgroundColor: consoleTheme.siderBg, color: consoleTheme.siderMenuItemColor }}
              onClick={helpers.addComment}
            >
              Add
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
  linkedComments: React.ReactNode;
  editRubricMode: boolean;
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

  if (!props.assignment.collaborativeRubricMode || !props.editRubricMode) {
    return (
      <div
        style={{
          padding: '0px 40px 0px 0px',
          fontSize: '12px',
        }}
        className="rubric-row--active"
        onClick={onClick}
      >
        <InlineMarkdown source={props.text} />
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
          {props.linkedComments}
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
        <InlineMarkdown source={props.text} />
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
