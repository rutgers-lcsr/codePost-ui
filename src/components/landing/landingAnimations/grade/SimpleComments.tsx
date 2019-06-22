import React from 'react';
import { animated } from 'react-spring';

import { FileMock } from '../../../../infrastructure/file';

import Comment from '../../../../components/code-review/code-panel/Comment';
export type CPCommentType = 'readonly' | 'active' | 'inactive';

const SimpleComment = (props: {
  text: string;
  points: number;
  top: number;
  classType: CPCommentType;
  line: number;
}) => {
  const data = {
    id: 1,
    text: props.text,
    pointDelta: props.points,
    startChar: 1,
    endChar: 3,
    startLine: props.line,
    endLine: props.line,
    file: 1,
    rubricComment: null,
    author: 'grader@myschool.edu',
  };

  const empty = () => {
    return;
  };
  const AnimatedComment = animated(Comment);
  return (
    <AnimatedComment
      commentType={props.classType}
      comment={data}
      rubricComment={undefined}
      changeActive={empty}
      onSave={empty}
      onDelete={empty}
      addUnsaved={empty}
      removeUnsaved={empty}
      setCommentPlacements={empty}
      removeRubricComment={empty}
      placement={1}
      file={FileMock}
    />
  );
};
export { SimpleComment };
