import { Divider } from 'antd';
import React from 'react';
import { animated } from 'react-spring';
//
// const SimpleGradeMenu = (props: { screenIndex: number }) => {
//   <div />;
// };

const SimpleGradeHeader = (props: { grade: string }) => {
  return (
    <div>
      <div className="cp-flex--tight">
        <div className="left">
          <span className="cp-label cp-label--very-bold cp-label--large cp-label--title">Loops</span>
        </div>
        <div className="left">
          <animated.div className="cp-label cp-label--very-bold cp-label--medium cp-label--subtitle">
            {props.grade}
          </animated.div>
        </div>
        <Divider type="vertical" />
        <div className="left">
          <div className="left">
            <span className="cp-label">student0@codepost.edu</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { SimpleGradeHeader };
