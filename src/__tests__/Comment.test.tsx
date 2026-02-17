import { describe, it } from 'vitest';

describe.skip('Comment (legacy enzyme tests)', () => {
  it('skipped', () => {
    // Legacy Enzyme snapshot tests are kept for reference.
  });
});
// import * as React from 'react';

// import { shallow } from 'enzyme';

// import Comment, { ICommentProps } from '../components/Code/Comment';

// describe('Comment', () => {
//   const setup = (propOverrides?: Partial<ICommentProps>) => {
//     // default props
//     const props = Object.assign(
//       {
//         key: 1,
//         comment: {
//           id: 1,
//           text: 'Extra text',
//           pointDelta: null,
//           startChar: 1,
//           endChar: 3,
//           startLine: 0,
//           endLine: 0,
//           file: 1,
//           rubricComment: 1,
//           author: 'grader@myschool.edu',
//         },
//         rubricComment: {
//           id: 1,
//           text: 'Missing a semicolon',
//           pointDelta: 3,
//           category: 1,
//           comments: [1],
//         },
//         style: {
//           top: '0px',
//           zIndex: '99982',
//         },
//         readOnly: false,
//         file: {
//           name: 'hello.java',
//           code: 'public static void main {}',
//           extension: 'java',
//           submission: 1,
//           id: 1,
//           comments: [1],
//         },
//         active: false,
//         unsavedComments: [],
//         changeActive: jest.fn(),
//         deleteComment: jest.fn(),
//         updateComment: jest.fn(),
//         updateSubmissionGrade: jest.fn(),
//         rerender: jest.fn(),
//       },
//       propOverrides,
//     );

//     // The the shallow render of the ReactMarkdown component is
//     // throwiing console.error logs that I don't know how to deal with right now
//     // This mock function hides them.
//     console.error = jest.fn();
//     const wrapper = shallow(<Comment {...props} />);

//     return {
//       props,
//       wrapper,
//     };
//   };

//   it('inactive, editable comment renders', () => {
//     const { wrapper } = setup({ readOnly: false, active: false });
//     expect(wrapper).toMatchSnapshot();
//   });

//   it('active, editable comment renders', () => {
//     const { wrapper } = setup({ readOnly: false, active: true });
//     expect(wrapper).toMatchSnapshot();
//   });

//   it('readOnly comment renders', () => {
//     const { wrapper } = setup({ readOnly: true, active: false });
//     expect(wrapper).toMatchSnapshot();
//   });
// });
