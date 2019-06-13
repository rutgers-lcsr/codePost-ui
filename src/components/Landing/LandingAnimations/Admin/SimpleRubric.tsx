import React from 'react';
import { animated, useSpring } from 'react-spring';

import CPButton from '../../../../components/core/CPButton';

import { RubricCommentMock } from '../../../../infrastructure/rubricComment';
import SimpleRubricCategory from './SimpleRubricCategory';

const SimpleRubric = () => {
  const props1 = useSpring({
    height: 500,
    width: 640,
    top: 0,
    left: 0,
    opacity: 1,
    from: { width: 1, height: 1, top: 250, left: 250, opacity: 0 },
    delay: 100,
    config: { duration: 100 },
  });
  // --------- Mock Data --------- //

  const category1 = {
    id: 1,
    name: 'Style',
    helpText: '',
    rubricComments: [1],
    assignment: 1,
    pointLimit: 4,
    sortKey: 0,
  };
  const category2 = {
    id: 1,
    name: 'Algorithms',
    helpText: '',
    rubricComments: [1],
    assignment: 1,
    pointLimit: 3,
    sortKey: 0,
  };

  const comments1 = [
    { ...RubricCommentMock, id: 2, text: 'Line length exceeds 120 chars' },
    { ...RubricCommentMock, id: 2, text: 'Functions not modular' },
  ];
  const comments2 = [{ ...RubricCommentMock, id: 3, category: 2, text: 'Sort runs in O(n^2)' }];

  const actions = [
    <div key="title" className="cp-label cp-label--large cp-label--bold">
      Hello World Rubric
    </div>,
    <CPButton key="action-1" cpType="primary">
      Upload/Download
    </CPButton>,
  ];

  const content = (
    <div>
      <SimpleRubricCategory rubricCategory={category1} rubricComments={comments1} />
      <SimpleRubricCategory rubricCategory={category2} rubricComments={comments2} />
    </div>
  );

  return (
    <animated.div
      style={{
        width: props1.width,
        height: props1.height,
        top: props1.top,
        left: props1.left,
        opacity: props1.opacity,
        overflow: 'scroll',
        position: 'relative',
      }}
    >
      <div
        style={{
          marginLeft: 20,
          marginRight: 20,
          marginTop: 20,
          marginBottom: 20,
          backgroundColor: '#FFFFFF',
          padding: 20,
          maxHeight: 500,
          overflow: 'scroll',
        }}
      >
        <div style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between' }}>{actions}</div>
        <div style={{ fontSize: 12 }}>{content}</div>
      </div>
    </animated.div>
  );
};

export { SimpleRubric };
