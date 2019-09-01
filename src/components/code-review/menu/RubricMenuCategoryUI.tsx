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
    linkToComment,
    ...otherProps
  } = props;

  const { consoleTheme } = React.useContext(ConsoleThemeContext);

  const buildCommentRows = (rubricCommentz: RubricCommentType[], commentMap: { [id: number]: RubricCommentType }) => {
    return rubricCommentz.map((rubricComment) => {
      const thisComment = commentMap[rubricComment.id];

      // @ts-ignore
      let thisFeedback;
      if (thisComment && props.feedbackScores && thisComment.id in props.feedbackScores) {
        thisFeedback = props.feedbackScores[thisComment.id];
      }

      if (thisComment) {
        // @ts-ignore
        const onChangeText = (e: any) => {
          helpers.updateRubricComment(thisComment.id, 'text', e);
        };

        // @ts-ignore
        const onChangePointDelta = (e: any) => {
          helpers.updateRubricComment(thisComment.id, 'pointDelta', e);
        };

        // @ts-ignore
        const saveComment = () => {
          helpers.saveComment(thisComment.id);
        };

        // @ts-ignore
        const deleteThisComment = (e: any) => {
          helpers.deleteComment(rubricComment, e);
        };

        // @ts-ignore
        const activateThisCommentExplorer = () => {
          props.activateCommentExplorer(thisComment);
        };

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
              rubricComment={rubricComment}
              linkToComment={props.linkToComment}
              hasActiveComment={props.hasActiveComment}
            />
          </Menu.Item>
        );

        // return {
        //   key: thisComment.id,
        //   text: <TextArea autosize value={thisComment.text} onChange={onChangeText} onBlur={saveComment} />,
        //   deduction: <InputNumber value={thisComment.pointDelta}
        // onChange={onChangePointDelta} onBlur={saveComment} />,
        //   linked: (
        //     <span onClick={activateCommentExplorer}>
        //       <Badge
        //         count={thisComment.comments.length}
        //         className="badge badge--standard"
        //         style={{ backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }}
        //       />
        //     </span>
        //   ),
        //   feedback: !props.commentFeedbackOn ? (
        //     <Tag color="volcano" key="disabled">
        //       DISABLED
        //     </Tag>
        //   ) : thisFeedback === undefined ? (
        //     <Spin />
        //   ) : (
        //         `👎 ${thisFeedback.negative * 100}%   👍 ${thisFeedback.positive * 100}%`
        //       ),
        //   delete: (
        //     <CPTooltip title={tooltips.admin.rubric.deleteComment} hideThisOnHideTips={true}>
        //       <Icon type="delete" onClick={deleteComment} />
        //     </CPTooltip>
        //   ),
        // };
      } else {
        // @ts-ignore
        const updateRubricCommentText = (e: any) => {
          helpers.updateRubricComment(rubricComment.id, 'text', e);
        };

        // @ts-ignore
        const updateRubricCommentPointDelta = (e: any) => {
          helpers.updateRubricComment(rubricComment.id, 'pointDelta', e);
        };

        // @ts-ignore
        const saveComment = () => {
          helpers.saveComment(rubricComment.id);
        };

        // @ts-ignore
        const deleteThisComment = (e: any) => {
          helpers.deleteComment(rubricComment, e);
        };

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
              rubricComment={rubricComment}
              linkToComment={props.linkToComment}
              hasActiveComment={props.hasActiveComment}
            />
          </Menu.Item>
        );

        // return {
        //   key: rubricComment.id,
        //   text: <TextArea autosize value={''} onChange={updateRubricCommentText} onBlur={saveComment} />,
        //   deduction: <InputNumber value={0} onChange={updateRubricCommentPointDelta} onBlur={saveComment} />,
        //   linked: null,
        //   delete: (
        //     <CPTooltip title={tooltips.admin.rubric.deleteComment} hideThisOnHideTips={true}>
        //       <Icon type="delete" onClick={deleteComment} />
        //     </CPTooltip>
        //   ),
        // };
      }
    });
  };

  // const filteredRubricComments =
  // props.rubricComments[rubricCategory.id].filter((rubricComment: RubricCommentType) => {
  //   return rubricComment.text.toUpperCase().includes(searchTerm.toUpperCase());
  // });

  const rows = buildCommentRows(props.rubricComments, state.rubricComments);

  // const rows = props.rubricComments.map((rubricComment: RubricCommentType) => {
  //   const key = `comment-${props.rubricCategory.id}-${rubricComment.id}`;
  //   return (
  //     <Menu.Item
  //       key={key}
  //       style={{
  //         backgroundColor: consoleTheme.siderBg,
  //         color: consoleTheme.siderMenuItemColor,
  //       }}
  //     >
  //       <RubricMenuCommentElement
  //         rubricComment={rubricComment}
  //         linkToComment={props.linkToComment}
  //         hasActiveComment={props.hasActiveComment}
  //       />
  //     </Menu.Item>
  //   );
  // });

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
  // editing: boolean;
  // addEditing: any;
  // removeEditing: any;
}

const RubricMenuCommentElement = (props: IRubricMenuCommentElementProps) => {
  const [pointDelta, setPointDelta] = React.useState(props.rubricComment.pointDelta);

  let points = '';
  if (pointDelta > 0) {
    points = `- ${pointDelta}`;
  } else if (pointDelta < 0) {
    points = `+ ${pointDelta * -1}`;
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
        className={`rubric-row--${props.hasActiveComment ? 'active' : 'inactive'} `}
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

export default RubricMenuCategoryUI;
