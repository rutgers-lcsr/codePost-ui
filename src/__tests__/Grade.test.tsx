//tslint:disable

// import * as React from 'react';

// import { shallow } from 'enzyme';

// import Grade, { IGradeProps } from '../components/grade/Grade';

// import { Submission } from '../infrastructure/submission';

// describe('Grade', () => {
//   const setup = (propOverrides?: Partial<IGradeProps>) => {
//     // default props
//     const logout = () => null;
//     const props = Object.assign(
//       {
//         match: {
//           path: '/grade/:submissionId',
//           url: '/grade/1',
//           isExact: true,
//           params: {
//             submissionId: '1',
//           },
//         },
//         history: {},
//         location: {
//           pathname: '/grade/1',
//           search: '',
//           hash: '',
//         },
//         user: {},
//         addToast: (text: string, action: string | undefined) => {
//           return;
//         },
//         addErrorToast: (text: string, action: string | undefined) => {
//           return;
//         },
//         handleLogout: logout,
//       },
//       propOverrides,
//     );

//     const wrapper = shallow(<Grade {...props} />);

//     return {
//       props,
//       wrapper,
//     };
//   };

//   it('commentPoints()', () => {
//     const comments = {
//       1: [
//         {
//           id: 1,
//           text: 'good job',
//           pointDelta: 1,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 1,
//           rubricComment: null,
//         },
//       ],
//       2: [
//         {
//           id: 2,
//           text: 'good job',
//           pointDelta: 3,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 2,
//           rubricComment: null,
//         },
//       ],
//     };

//     // This is just a hack to avoid all the loading functions in ComponentDidMount()
//     Submission.read = jest.fn().mockReturnValue(undefined);

//     const { wrapper } = setup();
//     expect(wrapper.instance().commentPoints(comments)).toBe(4);
//   });

//   it('pointsPerCategory()', () => {
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

//     // This is just a hack to avoid all the loading functions in ComponentDidMount()
//     Submission.read = jest.fn().mockReturnValue(undefined);

//     const { wrapper } = setup();
//     expect(wrapper.instance().pointsPerCategory(commentRubricComments)).toEqual({ 2: 3 });
//   });

//   it('pointsPerCategoryWithCaps()', () => {
//     const pointsPerCategory = {
//       2: 3,
//       3: 4,
//     };

//     const rubricCategories = [
//       {
//         id: 2,
//         rubricComments: [1, 2],
//         assignment: 1,
//         pointLimit: 2,
//       },
//     ];

//     // This is just a hack to avoid all the loading functions in ComponentDidMount()
//     Submission.read = jest.fn().mockReturnValue(undefined);

//     const { wrapper } = setup();
//     expect(wrapper.instance().pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories)).toEqual({ 2: 2, 3: 4 });
//   });

//   it('hasPositiveAndNegativeComments()', () => {
//     let comments = {
//       1: [
//         {
//           id: 1,
//           text: 'good job',
//           pointDelta: 1,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 1,
//           rubricComment: null,
//         },
//       ],
//       2: [
//         {
//           id: 2,
//           text: 'good job',
//           pointDelta: 3,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 2,
//           rubricComment: null,
//         },
//       ],
//     };

//     let commentRubricComments = {};
//     // This is just a hack to avoid all the loading functions in ComponentDidMount()
//     Submission.read = jest.fn().mockReturnValue(undefined);

//     const { wrapper } = setup();
//     expect(wrapper.instance().hasPositiveAndNegativeComments(comments, commentRubricComments)).toBe(false);

//     comments = {
//       1: [
//         {
//           id: 1,
//           text: 'good job',
//           pointDelta: -1,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 1,
//           rubricComment: null,
//         },
//       ],
//       2: [
//         {
//           id: 2,
//           text: 'good job',
//           pointDelta: 3,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 2,
//           rubricComment: null,
//         },
//       ],
//     };

//     expect(wrapper.instance().hasPositiveAndNegativeComments(comments, commentRubricComments)).toBe(true);

//     comments = {
//       1: [
//         {
//           id: 1,
//           text: 'good job',
//           // @ts-expect-error: legacy-ts-ignore
//           pointDelta: undefined,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 1,
//           rubricComment: null,
//         },
//       ],
//       2: [
//         {
//           id: 2,
//           text: 'good job',
//           pointDelta: 3,
//           startChar: 0,
//           endChar: 1,
//           startLine: 0,
//           endLine: 0,
//           file: 2,
//           rubricComment: null,
//         },
//       ],
//     };
//     commentRubricComments = {
//       1: {
//         id: 1,
//         text: 'good job',
//         pointDelta: -1,
//         category: 1,
//         comments: [1],
//       },
//     };

//     expect(wrapper.instance().hasPositiveAndNegativeComments(comments, commentRubricComments)).toBe(true);
//   });

//   it('addCommentHelper()', () => {
//     const newComment = {
//       id: 1,
//       text: 'good job',
//       pointDelta: 1,
//       startChar: 0,
//       endChar: 1,
//       startLine: 0,
//       endLine: 0,
//       file: 1,
//       rubricComment: null,
//     };

//     const file = {
//       id: 1,
//       code: 'code',
//       comments: [],
//       extension: 'txt',
//       name: 'code.txt',
//       submission: 1,
//     };

//     const { wrapper } = setup();

//     const comments = wrapper.instance().addCommentHelper(newComment, file, { 1: [] });
//     expect(comments).toEqual({ 1: [newComment] });
//   });

//   it('updateCommentHelper()', () => {
//     const comment = {
//       id: 1,
//       text: 'good job',
//       pointDelta: 1,
//       startChar: 0,
//       endChar: 1,
//       startLine: 0,
//       endLine: 0,
//       file: 1,
//       rubricComment: null,
//     };

//     const newComment = {
//       id: 1,
//       text: 'great job',
//       pointDelta: 1,
//       startChar: 0,
//       endChar: 1,
//       startLine: 0,
//       endLine: 0,
//       file: 1,
//       rubricComment: null,
//     };

//     const file = {
//       id: 1,
//       code: 'code',
//       comments: [],
//       extension: 'txt',
//       name: 'code.txt',
//       submission: 1,
//     };

//     const { wrapper } = setup();

//     const [comments, commentRubricComments, unsavedComments] = wrapper
//       .instance()
//       .updateCommentHelper(1, newComment, file, true, { 1: [comment] }, {}, []);

//     expect(comments).toEqual({ 1: [newComment] });
//     expect(commentRubricComments).toEqual({});
//     expect(unsavedComments).toEqual([]);

//     const [comments2, commentRubricComments2, unsavedComments2] = wrapper
//       .instance()
//       .updateCommentHelper(1, newComment, file, false, { 1: [comment] }, {}, []);

//     expect(comments2).toEqual({ 1: [newComment] });
//     expect(commentRubricComments2).toEqual({});
//     expect(unsavedComments2).toEqual([1]);
//   });

//   it('addComment() and updateComment()', () => {
//     const { wrapper } = setup();

//     // Should not add or update comment if no submission
//     let didModifyComment = wrapper.instance().updateComment(1, {}, {}, true);
//     expect(didModifyComment).toBe(false);

//     didModifyComment = wrapper.instance().addComment({}, {});
//     expect(didModifyComment).toBe(false);
//   });
// });
