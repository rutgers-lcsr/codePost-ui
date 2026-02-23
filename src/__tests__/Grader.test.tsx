// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it } from 'vitest';

describe.skip('Grader (legacy enzyme tests)', () => {
  it('skipped', () => {
    // Legacy Enzyme snapshot tests are kept for reference.
  });
});
// import * as React from 'react';

// import { shallow } from 'enzyme';

// import Grader, { IGraderProps } from '../Grader';

// // @ts-expect-error: legacy-ts-ignore
// import { loadIDList } from '../infrastructure/generics';

// describe('Grader', () => {
//   const setup = (propOverrides?: Partial<IGraderProps>) => {
//     // default props
//     const logout = () => null;
//     const props = Object.assign(
//       {
//         match: {
//           path: '/grader/:courseName?/:period?/:assignmentName?',
//           url: '/grader',
//           isExact: true,
//           params: {},
//         },
//         history: {},
//         user: { email: 'jack@myschool.edu' },
//         initialCourses: [],
//         superGraderCourses: [],
//         sectionsLed: [],
//         handleLogout: logout,
//       },
//       propOverrides,
//     );

//     const wrapper = shallow(<Grader {...props} />);

//     return {
//       props,
//       wrapper,
//     };
//   };

//   // it('loadAssignments()', async () => {
//   //   const assignments = [
//   //     {
//   //       id: 1,
//   //       name: 'Hello, World',
//   //       points: 20,
//   //       isReleased: true,
//   //       rubricCategories: [],
//   //       course: 3,
//   //       sortKey: 0,
//   //     },
//   //     {
//   //       id: 2,
//   //       name: 'Sierpinski',
//   //       points: 20,
//   //       isReleased: true,
//   //       rubricCategories: [],
//   //       course: 3,
//   //       sortKey: 0,
//   //     },
//   //   ];

//   //   const courses = [
//   //     {
//   //       id: 3,
//   //       name: 'COS126',
//   //       period: 'S19',
//   //       assignments: [1, 2],
//   //       sections: [],
//   //       sendReleasedSubmissionsToBack: false,
//   //       showStudentsStatistics: false,
//   //       emailNewUsers: false,
//   //       timezone: 'PST',
//   //     },
//   //   ];

//   //   // @ts-expect-error: legacy-ts-ignore
//   //   loadIDList.mockReturnValue(assignments);

//   //   const { wrapper } = setup();
//   //   expect(await wrapper.instance().loadAssignments(courses)).toEqual({ 3: assignments });
//   // });

//   it('isSuperGrader()', () => {
//     const superGraderCourses = [
//       {
//         id: 3,
//         name: 'COS126',
//         period: 'S19',
//         assignments: [1, 2],
//         sections: [],
//         sendReleasedSubmissionsToBack: false,
//         showStudentsStatistics: false,
//         emailNewUsers: false,
//         timezone: 'PST',
//       },
//     ];

//     let currentCourse = {
//       id: 3,
//       name: 'COS126',
//       period: 'S19',
//       assignments: [1, 2],
//       sections: [],
//       sendReleasedSubmissionsToBack: false,
//       showStudentsStatistics: false,
//       emailNewUsers: false,
//       timezone: 'PST',
//     };

//     const { wrapper } = setup();
//     expect(wrapper.instance().isSuperGrader(superGraderCourses, currentCourse)).toBe(true);

//     currentCourse = {
//       id: 4,
//       name: 'COS432',
//       period: 'S19',
//       assignments: [3],
//       sections: [],
//       sendReleasedSubmissionsToBack: false,
//       showStudentsStatistics: false,
//       emailNewUsers: false,
//       timezone: 'PST',
//     };

//     expect(wrapper.instance().isSuperGrader(superGraderCourses, currentCourse)).toBe(false);
//   });
// });
