import { describe, it } from 'vitest';

describe.skip('CommentList (legacy enzyme tests)', () => {
  it('skipped', () => {
    // Legacy Enzyme snapshot tests are kept for reference.
  });
});
// import * as React from 'react';

// import { shallow } from 'enzyme';

// import CommentList, { ICommentListProps } from '../components/Code/CommentList';

// describe('CommentList', () => {
//   const setup = (propOverrides?: Partial<ICommentListProps>) => {
//     // default props
//     const props = Object.assign(
//       {
//         activeCommentId: undefined,
//         file: {
//           name: 'hello.java',
//           code: 'public static void main() {}',
//           extension: 'java',
//           submission: 1,
//           id: 1,
//           comments: [1, 2, 3],
//         },
//         readOnly: false,
//         comments: [
//           {
//             id: 1,
//             text: 'good job',
//             pointDelta: null,
//             startChar: 1,
//             endChar: 3,
//             startLine: 0,
//             endLine: 0,
//             file: 1,
//             rubricComment: 1,
//             author: 'grader@myschool.edu',
//           },
//           {
//             id: 2,
//             text: 'good job',
//             pointDelta: 1,
//             startChar: 2,
//             endChar: 3,
//             startLine: 0,
//             endLine: 0,
//             file: 1,
//             rubricComment: null,
//             author: 'grader@myschool.edu',
//           },
//           {
//             id: 3,
//             text: 'good job',
//             pointDelta: 1,
//             startChar: 3,
//             endChar: 5,
//             startLine: 0,
//             endLine: 0,
//             file: 1,
//             rubricComment: null,
//             author: 'grader@myschool.edu',
//           },
//         ],
//         rubricComments: {
//           1: {
//             id: 1,
//             text: 'Need more comments',
//             pointDelta: 3,
//             category: 1,
//             comments: [1],
//           },
//         },
//         unsavedComments: [],
//         changeActive: jest.fn(),
//         deleteComment: jest.fn(),
//         updateComment: jest.fn(),
//         updateSubmissionGrade: jest.fn(),
//       },
//       propOverrides,
//     );

//     const wrapper = shallow(<CommentList {...props} />);

//     return {
//       props,
//       wrapper,
//     };
//   };

//   it('renders correctly', () => {
//     const { wrapper } = setup();
//     expect(wrapper).toMatchSnapshot();
//   });
// });
