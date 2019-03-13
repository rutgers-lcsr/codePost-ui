import * as React from 'react';

import { shallow } from 'enzyme';

import Grader, { IGraderProps } from '../Grader';

// @ts-ignore
import { loadIDList } from '../infrastructure/generics';

describe('Grader', () => {
  const setup = (propOverrides?: Partial<IGraderProps>) => {
    // default props
    const props = Object.assign(
      {
        match: {
          path: '/grader/:courseName?/:period?/:assignmentName?',
          url: '/grader',
          isExact: true,
          params: {},
        },
        history: {},
        email: 'jack@myschool.edu',
        initialCourses: [],
        superGraderCourses: [],
        sectionsLed: [],
      },
      propOverrides,
    );

    const wrapper = shallow(<Grader {...props} />);

    return {
      props,
      wrapper,
    };
  };

  it('loadAssignments()', async () => {
    const assignments = [
      {
        id: 1,
        name: 'Hello, World',
        points: 20,
        isReleased: true,
        rubricCategories: [],
        course: 3,
        sortKey: 0,
      },
      {
        id: 2,
        name: 'Sierpinski',
        points: 20,
        isReleased: true,
        rubricCategories: [],
        course: 3,
        sortKey: 0,
      },
    ];

    const courses = [
      {
        id: 3,
        name: 'COS126',
        period: 'S19',
        assignments: [1, 2],
        sections: [],
        sendReleasedSubmissionsToBack: false,
        showStudentsStatistics: false,
        emailNewUsers: false,
        timezone: 'PST',
      },
    ];

    // @ts-ignore
    loadIDList = jest.fn().mockReturnValue(assignments);

    const { wrapper } = setup();
    expect(await wrapper.instance().loadAssignments(courses)).toEqual({ 3: assignments });
  });
});
