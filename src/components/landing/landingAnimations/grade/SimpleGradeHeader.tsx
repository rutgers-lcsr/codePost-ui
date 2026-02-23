// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Divider } from 'antd';
import { animated, Interpolation } from 'react-spring';
//
// const SimpleGradeMenu = (props: { screenIndex: number }) => {
//   <div />;
// };

const SimpleGradeHeader = (props: { grade: string | Interpolation<number, string> }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <span className="cp-label cp-label--very-bold cp-label--large cp-label--title">Loops</span>
        <div className="gap" />
        <animated.div
          style={{ marginLeft: 10 }}
          className="cp-label cp-label--very-bold cp-label--medium cp-label--subtitle"
        >
          {props.grade}
        </animated.div>
        <Divider type="vertical" />
        <span className="cp-label">student@myschool.edu</span>
      </div>
    </div>
  );
};

export { SimpleGradeHeader };
