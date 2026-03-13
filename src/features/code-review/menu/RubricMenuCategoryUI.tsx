// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import * as React from 'react';

// imports
import MarkdownEditorModal from '../../../components/core/MarkdownEditorModal';
import {
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
  EditOutlined,
  PlusOutlined,
  TagOutlined,
  InfoCircleOutlined,
  MessageOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
/* antd imports */
/* antd imports */
import { Button, Input, Menu, Popover, Space, Tag, Tooltip, Typography } from 'antd';

import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';

import { RubricComment } from '../../../api-client';
import { AssignmentType } from '../../../types/models';

// import InlineMarkdown from '../../core/InlineMarkdown';
import BlockMarkdown from '../../../components/core/BlockMarkdown';

import CPPointInput from '../../../components/core/CPPointInput';

import { CURSOR_DOMAIN } from '../CodeConsoleEnums';

import {
  IRubricCategoryManagerHelpers,
  IRubricCategoryManagerProps,
  IRubricCategoryManagerState,
} from '../../../components/core/rubric/RubricCategoryManager';

interface IRubricMenuCategoryUIProps extends IRubricCategoryManagerProps {
  hasActiveComment: boolean;
  handleRubricCommentClick: (rubricComment: RubricComment) => void;
  editingStatuses: { [id: number]: number };
  startEditing: (rubricCommentID: number) => void;
  linkToComment: (rubricComment: RubricComment) => void;
  searchTerm: string;
  assignment: AssignmentType;
  editRubricMode: boolean;
  turnOnReload: () => void;
  turnOffReload: () => void;
  showCursor: CURSOR_DOMAIN;
  cursorIndex: number;
  commentIndex: number;
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
  const [openKeys, setOpenKeys] = React.useState<string[]>([`category-${props.rubricCategory.id}`]);

  const onOpenChange = (keys: any) => {
    setOpenKeys(keys);
  };

  const buildCommentRows = (rubricCommentz: RubricComment[], commentMap: { [id: number]: RubricComment }) => {
    return rubricCommentz
      .filter((rubricComment: RubricComment) => {
        const thisComment = commentMap[rubricComment.id];
        const effectiveComment = thisComment || rubricComment;

        const term = props.searchTerm.toUpperCase();
        const matchesText = (effectiveComment.text || '').toUpperCase().includes(term);
        const matchesExplanation =
          !props.editRubricMode &&
          effectiveComment.explanation &&
          effectiveComment.explanation.toUpperCase().includes(term);
        const matchesInstruction =
          !props.editRubricMode &&
          effectiveComment.instructionText &&
          effectiveComment.instructionText.toUpperCase().includes(term);

        return matchesText || matchesExplanation || matchesInstruction;
      })
      .map((rubricComment, index: number) => {
        const editing = rubricComment.id < 0 || props.editingStatuses[rubricComment.id] ? true : false;

        // Use state value if available, otherwise use props value
        const thisComment = commentMap[rubricComment.id];
        const currentComment = thisComment || rubricComment;

        const startEditingThis = () => {
          props.startEditing(rubricComment.id);
        };

        const onChangeText = (e: any) => {
          helpers.updateRubricComment(rubricComment.id, 'text', e);
        };

        const onChangePointDelta = (e: any) => {
          helpers.updateRubricComment(rubricComment.id, 'pointDelta', e);
        };

        const saveComment = () => {
          helpers.saveComment(rubricComment.id);
        };

        const deleteThisComment = () => {
          helpers.deleteComment(rubricComment);
        };

        const textInput = (
          <Input
            style={{ backgroundColor: consoleTheme.commentTextArea, color: consoleTheme.text }}
            value={currentComment.text}
            onChange={onChangeText}
            onBlur={saveComment}
            placeholder="Enter rubric item name..."
          />
        );

        const pointInput = (
          <CPPointInput
            value={currentComment.pointDelta}
            size="small"
            onChange={onChangePointDelta}
            onBlur={saveComment}
            disabled={false}
          />
        );

        const key = `comment-${props.rubricCategory.id}-${rubricComment.id}`;
        const cursored = props.showCursor === CURSOR_DOMAIN.RUBRIC && props.cursorIndex === props.commentIndex + index;

        return (
          <Menu.Item
            key={key}
            style={{
              backgroundColor: cursored ? 'rgba(0, 0, 255, 0.2)' : consoleTheme.siderBg,
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
              text={currentComment.text || ''}
              pointDelta={currentComment.pointDelta || 0.0}
              deleteComment={deleteThisComment}
              assignment={props.assignment}
              editRubricMode={props.editRubricMode}
              explanation={currentComment.explanation || ''}
              instructionText={currentComment.instructionText || ''}
              cursored={cursored}
              onUpdateField={(field, value) => helpers.updateRubricComment(rubricComment.id, field, value)}
              onSaveComment={saveComment}
            />
          </Menu.Item>
        );
      });
  };

  const rows = buildCommentRows(props.rubricComments, state.rubricComments);

  // hide categories with no matching comments
  if (rows.length === 0 && props.searchTerm.length > 0) {
    return null;
  }

  let formattedPointLimit = '';
  const pointLimit = props.rubricCategory.pointLimit ?? null;
  if (pointLimit !== null) {
    if (pointLimit > 0) {
      formattedPointLimit = `-${pointLimit}`;
    } else if (pointLimit < 0) {
      formattedPointLimit = `+${Math.abs(pointLimit)}`;
    } else {
      formattedPointLimit = '0';
    }
  }

  const pointLimitBadge =
    pointLimit !== null ? (
      <Tag
        style={{
          margin: 0,
          marginLeft: 8,
          backgroundColor: consoleTheme.siderSubmenuTitleBg,
          color: consoleTheme.text,
          border: consoleTheme.siderSubmenuBorder,
          fontSize: '10.5px',
        }}
      >
        Max: {formattedPointLimit}
      </Tag>
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
      // eslint-disable-next-line react-hooks/refs -- helpers ref-derived object is stable
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
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
      <Typography.Text ellipsis={true} style={{ color: consoleTheme.text }}>
        {props.rubricCategory.name}
      </Typography.Text>
      {pointLimitBadge}
      {props.rubricCategory.atMostOnce ? (
        <Tooltip title="This category can be applied at most once.">
          <TagOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      ) : null}
    </div>
  );

  const addComment = () => {
    props.turnOffReload();
    helpers.addComment();
  };

  const categoryKey = `category-${props.rubricCategory.id}`;
  const isOpen = openKeys.includes(categoryKey);

  const menuIcon = props.editRubricMode ? (
    <EditOutlined style={{ color: consoleTheme.siderMenuItemColor }} />
  ) : rows.length > 0 ? (
    isOpen ? (
      <UpOutlined style={{ color: consoleTheme.siderMenuItemColor }} />
    ) : (
      <DownOutlined style={{ color: consoleTheme.siderMenuItemColor }} />
    )
  ) : null;

  // Build menu items array for Ant Design v5
  const menuItems = [
    {
      key: `category-${props.rubricCategory.id}`,
      className: 'rubric-menu-category-item',
      style: { height: 'auto' }, // Allow height to grow for wrapped text
      label: (
        <div
          style={{
            // Removed negative margins because we override parent padding to 0
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: consoleTheme.siderSubmenuTitleBg,
            color: consoleTheme.siderSubmenuTitleColor,
            borderBottom: consoleTheme.siderSubmenuBorder,
            whiteSpace: 'normal',
            lineHeight: 1.5,
            width: '100%',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
              {title}
              {errorTag}
            </div>
            {props.rubricCategory.helpText && (
              <div
                style={{
                  width: '100%',
                  marginTop: '2px',
                  fontSize: '11px',
                  color: consoleTheme.siderMenuItemColor,
                  lineHeight: '1.2',
                }}
              >
                {props.rubricCategory.helpText}
              </div>
            )}
          </div>
          {/* Manually render expansion icon for visibility and alignment control */}
          <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}>{menuIcon}</div>
        </div>
      ),
      children: [
        ...rows.map((row: any) => ({
          key: row.key,
          label: row.props.children,
          style: row.props.style,
        })),
        ...(props.editRubricMode && props.searchTerm.length === 0
          ? [
              {
                key: `comment-${props.rubricCategory.id}-add`,
                label: (
                  <Button
                    type="default"
                    icon={<PlusOutlined />}
                    size="small"
                    style={{
                      width: '180px',
                      backgroundColor: consoleTheme.siderBg,
                      color: consoleTheme.siderMenuItemColor,
                    }}
                    onClick={addComment}
                  >
                    Add Comment
                  </Button>
                ),
                style: {
                  textAlign: 'center' as const,
                },
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <>
      <style>{`
        .rubric-menu-category-item .ant-menu-submenu-title {
          height: auto !important;
          line-height: normal !important;
          white-space: normal !important;
          overflow: visible !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .rubric-menu-category-item .ant-menu-submenu-title > .ant-menu-title-content {
          overflow: visible !important;
          flex: 1;
        }
      `}</style>
      <Menu
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        mode="inline"
        id="rubric-menu-menu"
        className="rubric-menu"
        style={{ backgroundColor: consoleTheme.siderBg }}
        expandIcon={() => null} // Disable default icon, we render it manually
        items={menuItems}
      />
    </>
  );
};

interface IRubricMenuCommentElementProps {
  rubricComment: RubricComment;
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

  explanation: string;
  instructionText: string;

  onUpdateField?: (field: string, value: string) => void;
  onSaveComment?: () => void;
}

const RubricMenuCommentElement = (props: IRubricMenuCommentElementProps) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const [modalType, setModalType] = React.useState<'explanation' | 'instructionText' | null>(null);

  const handleOpenModal = (type: 'explanation' | 'instructionText') => {
    setModalType(type);
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  const handleSaveModal = (text: string) => {
    if (modalType && props.onUpdateField) {
      props.onUpdateField(modalType, text);
      if (props.onSaveComment) {
        props.onSaveComment();
      }
    }
    setModalType(null);
  };

  let points: string;
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

  const pointBadge = (
    <Tag
      style={{
        margin: 0,
        marginLeft: 8,
        backgroundColor: consoleTheme.siderSubmenuTitleBg, // distinct background
        color: consoleTheme.text,
        border: consoleTheme.siderSubmenuBorder,
        fontFamily: 'monospace',
        fontWeight: 600,
      }}
    >
      {points}
    </Tag>
  );

  if (!props.editRubricMode) {
    return (
      <div
        className={`rubric-row rubric-row--active${props.cursored ? ' rubric-row-cursored' : ''}`}
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.5',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div
            style={{ flex: 1, minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word', color: consoleTheme.text }}
          >
            <BlockMarkdown source={props.text.length === 0 ? '-' : props.text} />
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            {props.explanation ? (
              <Popover
                content={
                  <div style={{ maxWidth: '400px', minWidth: '300px', color: consoleTheme.text }}>
                    <div
                      style={{
                        backgroundColor: consoleTheme.siderSubmenuTitleBg,
                        border: `1px solid ${consoleTheme.siderSubmenuBorder}`,
                        borderRadius: '4px',
                        padding: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px',
                          color: consoleTheme.siderMenuItemColor,
                          fontWeight: 600,
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <MessageOutlined style={{ marginRight: '6px' }} /> STUDENT EXPLANATION
                      </div>
                      <div style={{ color: consoleTheme.text }}>
                        <BlockMarkdown source={props.explanation} />
                      </div>
                    </div>
                  </div>
                }
                title={null}
                trigger={['hover', 'click']}
                overlayStyle={{ maxWidth: '450px' }}
                overlayInnerStyle={{
                  backgroundColor: consoleTheme.siderBg,
                  color: consoleTheme.text,
                  border: consoleTheme.siderSubmenuBorder,
                  padding: '12px',
                }}
              >
                <InfoCircleOutlined
                  style={{
                    marginRight: 8,
                    color: consoleTheme.siderMenuItemColor, // Use secondary color to be subtle
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                />
              </Popover>
            ) : null}
            {pointBadge}
          </div>
        </div>

        {props.instructionText && (
          <div
            style={{
              marginTop: '6px',
              width: '100%',
              padding: '6px 10px',
              backgroundColor: consoleTheme.siderSubmenuTitleBg,
              borderLeft: `3px solid ${consoleTheme.siderMenuItemColor}`,
              fontSize: '0.9em',
              color: consoleTheme.siderMenuItemColor,
              borderRadius: '0 4px 4px 0',
            }}
          >
            <BlockMarkdown source={props.instructionText} />
          </div>
        )}
      </div>
    );
  } else if (props.editing) {
    return (
      <>
        <div
          className={`rubric-row rubric-row--editing${props.cursored ? ' rubric-row-cursored' : ''}`}
          style={{ padding: '8px 12px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {/* Text input */}
            {props.textInput}

            {/* Points and actions row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                {props.pointInput}
              </div>
              <Space size={4}>
                {props.onUpdateField && (
                  <>
                    <Tooltip title={props.explanation ? 'Edit Student Explanation (Set)' : 'Add Student Explanation'}>
                      <Button
                        size="small"
                        type={props.explanation ? 'primary' : 'default'}
                        icon={<MessageOutlined />}
                        onClick={() => handleOpenModal('explanation')}
                        style={{
                          // Highlight if set
                          color: props.explanation ? undefined : consoleTheme.siderMenuItemColor,
                        }}
                      />
                    </Tooltip>
                    <Tooltip
                      title={props.instructionText ? 'Edit Grader Instructions (Set)' : 'Add Grader Instructions'}
                    >
                      <Button
                        size="small"
                        type={props.instructionText ? 'primary' : 'default'}
                        icon={<FileTextOutlined />}
                        onClick={() => handleOpenModal('instructionText')}
                        style={{
                          color: props.instructionText ? undefined : consoleTheme.siderMenuItemColor,
                        }}
                      />
                    </Tooltip>
                  </>
                )}
                {props.deleteComment && (
                  <Tooltip title="Delete Item">
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={props.deleteComment} />
                  </Tooltip>
                )}
              </Space>
            </div>
          </Space>
        </div>

        <MarkdownEditorModal
          open={modalType !== null}
          title={modalType === 'explanation' ? 'Edit Student Explanation' : 'Edit Grader Instructions'}
          startText={modalType === 'explanation' ? props.explanation : props.instructionText}
          onCancel={handleCloseModal}
          onSave={handleSaveModal}
          placeholder={
            modalType === 'explanation'
              ? 'Explain to the student why they received this grade...'
              : 'Instructions for graders on when to apply this item...'
          }
        />
      </>
    );
  } else {
    return (
      <div
        className={`rubric-row rubric-row--${props.hasActiveComment ? 'active' : 'inactive'}${props.cursored ? ' rubric-row-cursored' : ''}`}
        onClick={props.hasActiveComment ? onClick : props.startEditing}
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.5',
          padding: '8px 12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div
            style={{ flex: 1, minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word', color: consoleTheme.text }}
          >
            <BlockMarkdown source={props.text.length === 0 ? '-' : props.text} />
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
            {props.explanation ? (
              <Popover
                content={
                  <div style={{ maxWidth: '400px', minWidth: '300px', color: consoleTheme.text }}>
                    <div
                      style={{
                        backgroundColor: consoleTheme.siderSubmenuTitleBg,
                        border: `1px solid ${consoleTheme.siderSubmenuBorder}`,
                        borderRadius: '4px',
                        padding: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '8px',
                          color: consoleTheme.siderMenuItemColor,
                          fontWeight: 600,
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <MessageOutlined style={{ marginRight: '6px' }} /> STUDENT EXPLANATION
                      </div>
                      <div style={{ color: consoleTheme.text }}>
                        <BlockMarkdown source={props.explanation} />
                      </div>
                    </div>
                  </div>
                }
                title={null}
                trigger={['hover', 'click']}
                overlayStyle={{ maxWidth: '450px' }}
                overlayInnerStyle={{
                  backgroundColor: consoleTheme.siderBg,
                  color: consoleTheme.text,
                  border: consoleTheme.siderSubmenuBorder,
                  padding: '12px',
                }}
              >
                <InfoCircleOutlined
                  style={{
                    marginRight: 8,
                    color: consoleTheme.siderMenuItemColor,
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                />
              </Popover>
            ) : null}
            {pointBadge}
          </div>
        </div>

        {props.instructionText && (
          <div
            style={{
              marginTop: '6px',
              width: '100%',
              padding: '6px 10px',
              backgroundColor: consoleTheme.siderSubmenuTitleBg,
              borderLeft: `3px solid ${consoleTheme.siderMenuItemColor}`,
              fontSize: '0.9em',
              color: consoleTheme.siderMenuItemColor,
              borderRadius: '0 4px 4px 0',
            }}
          >
            <BlockMarkdown source={props.instructionText} />
          </div>
        )}

        {!props.hasActiveComment ? (
          <div className="overlay">
            <EditOutlined />
          </div>
        ) : null}
      </div>
    );
  }
};

export default RubricMenuCategoryUI;
