import * as React from 'react';

import { shallow } from 'enzyme';

import Student, { IStudentProps } from '../Student';

describe('Student', () => {
  const setup = (propOverrides?: Partial<IStudentProps>) => {
    // default props
    const props = Object.assign(
      {
        match: {
          path: '/student/:courseName?/:period?/:assignmentName?',
          url: '/student',
          isExact: true,
          params: {},
        },
        history: {},
        email: 'jack@myschool.edu',
        initialCourses: [],
      },
      propOverrides,
    );

    const wrapper = shallow(<Student {...props} />);

    return {
      props,
      wrapper,
    };
  };

  it('calculates points per category correctly', () => {
    const { wrapper } = setup();

    const commentRubricComments = {
      1: {
        id: 1,
        text: 'good job',
        pointDelta: 2,
        category: 2,
        comments: [1],
      },
      2: {
        id: 2,
        text: 'good job',
        pointDelta: 1,
        category: 2,
        comments: [2],
      },
    };

    expect(wrapper.instance().getPointsPerCategory(commentRubricComments)).toEqual({ 2: 3 });
  });
});
