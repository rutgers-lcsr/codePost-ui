// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { animated } from 'react-spring';

import { FileMock } from '../../../../utils/file';

import Comment from '../../../../features/code-review/code-panel/Comment';

export type CPCommentType = 'readonly' | 'active' | 'inactive';

const AnimatedComment = animated(Comment);

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
    feedback: 0,
    color: null,
  };

  const empty = () => {
    return;
  };

  return (
    <AnimatedComment
      showExplanations={false}
      rubricCategories={[]}
      additiveGrading={false}
      isStudent={false}
      commentType={props.classType}
      comment={data}
      rubricComment={undefined}
      changeActive={empty}
      onSave={empty}
      onDelete={empty}
      setCommentPlacements={empty}
      removeRubricComment={empty}
      placement={1}
      file={FileMock}
      updateFeedback={empty}
      studentFeedbackOn={false}
      hideAuthor={true}
      forcedRubricMode={false}
      cursored={false}
    />
  );
};
export { SimpleComment };
