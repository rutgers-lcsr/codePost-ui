// import * as React from 'react';

// import { shallow } from 'enzyme';

// import Student, { IStudentProps } from '../Student';

// // @ts-expect-error: legacy-ts-ignore
// import { loadIDList } from '../infrastructure/generics';

// describe('Student', () => {
//   const setup = (propOverrides?: Partial<IStudentProps>) => {
//     // default props
//     const logout = () => null;
//     const props = Object.assign(
//       {
//         match: {
//           path: '/student/:courseName?/:period?/:assignmentName?',
//           url: '/student',
//           isExact: true,
//           params: {},
//         },
//         history: {},
//         email: 'jack@myschool.edu',
//         initialCourses: [],
//         handleLogout: logout,
//       },
//       propOverrides,
//     );

//     const wrapper = shallow(<Student {...props} />);

//     return {
//       props,
//       wrapper,
//     };
//   };

//   it('getPointsPerCategory()', () => {
//     const commentRubricComments = {
//       1: {
//         id: 1,
//         text: 'good job',
//         pointDelta: 2,
//         category: 2,
//         comments: [1],
//       },
//       2: {
//         id: 2,
//         text: 'good job',
//         pointDelta: 1,
//         category: 2,
//         comments: [2],
//       },
//     };

//     const { wrapper } = setup();
//     expect(wrapper.instance().getPointsPerCategory(commentRubricComments)).toEqual({ 2: 3 });
//   });

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
//   //   loadIDList = jest.fn().mockReturnValue(assignments);

//   //   const { wrapper } = setup();
//   //   expect(await wrapper.instance().loadAssignments(courses)).toEqual({ 3: assignments });
//   // });

//   it('writeCategoryCapMessages()', () => {
//     const rubricCategories = [
//       {
//         id: 1,
//         rubricComments: [1, 2],
//         assignment: 1,
//         pointLimit: 2,
//       },
//     ];

//     const pointsPerCategory = {
//       1: 3,
//     };

//     const { wrapper } = setup();
//     expect(wrapper.instance().writeCategoryCapMessages(pointsPerCategory, rubricCategories).length).toBe(1);
//   });
// });
