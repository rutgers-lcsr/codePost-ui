/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Divider, Icon, Input, InputNumber, Menu, Popover, Tag } from 'antd';

const SubMenu = Menu.SubMenu;
const InputGroup = Input.Group;
const { TextArea } = Input;

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { RubricCommentType } from '../../../infrastructure/rubricComment';

import InlineMarkdown from '../../core/InlineMarkdown';

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
    handleRubricCommentClick,
    hasActiveComment,
    editingStatuses,
    startEditing,
    linkToComment,
    ...otherProps
  } = props;

  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const buildCommentRows = (rubricCommentz: RubricCommentType[], commentMap: { [id: number]: RubricCommentType }) => {
    return rubricCommentz.map((rubricComment) => {
      const editing = rubricComment.id < 0 || props.editingStatuses[rubricComment.id];

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
            autosize
            value={thisComment.text}
            onChange={onChangeText}
            onBlur={saveComment}
            style={{ width: '76%' }}
          />
        );

        const pointInput = (
          <InputNumber
            value={thisComment.pointDelta}
            onChange={onChangePointDelta}
            onBlur={saveComment}
            style={{ width: '20%' }}
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
            autosize
            value={''}
            onChange={updateRubricCommentText}
            onBlur={saveComment}
            style={{ width: '76%' }}
          />
        );

        const pointInput = (
          <InputNumber
            value={0}
            onChange={updateRubricCommentPointDelta}
            onBlur={saveComment}
            style={{ width: '20%' }}
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
            />
          </Menu.Item>
        );
      }
    });
  };

  // const filteredRubricComments =
  // props.rubricComments[rubricCategory.id].filter((rubricComment: RubricCommentType) => {
  //   return rubricComment.text.toUpperCase().includes(searchTerm.toUpperCase());
  // });

  const rows = buildCommentRows(props.rubricComments, state.rubricComments);

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

  // FIXME: https://github.com/ant-design/ant-design/issues/4853
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
              <span style={{ float: 'right' }}>{capTag}</span>
            </div>
          </div>
        </div>
      }
      {...otherProps}
    >
      {rows}
      <Menu.Item
        key={`comment-${props.rubricCategory.id}-add`}
        style={{
          backgroundColor: consoleTheme.siderBg,
          color: consoleTheme.siderMenuItemColor,
          textAlign: 'center',
        }}
      >
        <Button type="dashed" icon="plus" size="small" style={{ width: '100%' }} onClick={helpers.addComment}>
          Add
        </Button>
      </Menu.Item>
    </SubMenu>
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

  if (props.editing) {
    return (
      <div style={{ position: 'relative' }}>
        <div
          style={{ position: 'absolute', left: '-14px', color: '#f64852', cursor: 'pointer' }}
          onClick={props.deleteComment}
        >
          x
        </div>
        <InputGroup>
          {props.textInput}
          {props.pointInput}
        </InputGroup>
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
