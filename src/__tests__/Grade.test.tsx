import * as React from 'react';

import { shallow } from 'enzyme';

import Grade, { IGradeProps } from '../Grade';

// @ts-ignore
import { loadIDList } from '../infrastructure/generics';

import { Submission } from '../infrastructure/submission';

describe('Grade', () => {
  const setup = (propOverrides?: Partial<IGradeProps>) => {
    // default props
    const props = Object.assign(
      {
        match: {
          path: '/grade/:submissionId',
          url: '/grade/1',
          isExact: true,
          params: {
            submissionId: '1',
          },
        },
        history: {},
        location: {
          pathname: '/grade/1',
          search: '',
          hash: '',
        },
        user: {},
        addErrorToast: (text: string, action: string | undefined) => {
          return;
        },
      },
      propOverrides,
    );

    const wrapper = shallow(<Grade {...props} />);

    return {
      props,
      wrapper,
    };
  };

  it('commentPoints()', () => {
    const comments = {
      1: [
        {
          id: 1,
          text: 'good job',
          pointDelta: 1,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 1,
          rubricComment: null,
        },
      ],
      2: [
        {
          id: 2,
          text: 'good job',
          pointDelta: 3,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 2,
          rubricComment: null,
        },
      ],
    };

    // This is just a hack to avoid all the loading functions in ComponentDidMount()
    Submission.read = jest.fn().mockReturnValue(undefined);

    const { wrapper } = setup();
    expect(wrapper.instance().commentPoints(comments)).toBe(4);
  });

  it('pointsPerCategory()', () => {
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

    // This is just a hack to avoid all the loading functions in ComponentDidMount()
    Submission.read = jest.fn().mockReturnValue(undefined);

    const { wrapper } = setup();
    expect(wrapper.instance().pointsPerCategory(commentRubricComments)).toEqual({ 2: 3 });
  });

  it('pointsPerCategoryWithCaps()', () => {
    const pointsPerCategory = {
      2: 3,
      3: 4,
    };

    const rubricCategories = [
      {
        id: 2,
        rubricComments: [1, 2],
        assignment: 1,
        pointLimit: 2,
      },
    ];

    // This is just a hack to avoid all the loading functions in ComponentDidMount()
    Submission.read = jest.fn().mockReturnValue(undefined);

    const { wrapper } = setup();
    expect(wrapper.instance().pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories)).toEqual({ 2: 2, 3: 4 });
  });

  it('hasPositiveAndNegativeComments()', () => {
    let comments = {
      1: [
        {
          id: 1,
          text: 'good job',
          pointDelta: 1,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 1,
          rubricComment: null,
        },
      ],
      2: [
        {
          id: 2,
          text: 'good job',
          pointDelta: 3,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 2,
          rubricComment: null,
        },
      ],
    };

    let commentRubricComments = {};
    // This is just a hack to avoid all the loading functions in ComponentDidMount()
    Submission.read = jest.fn().mockReturnValue(undefined);

    const { wrapper } = setup();
    expect(wrapper.instance().hasPositiveAndNegativeComments(comments, commentRubricComments)).toBe(false);

    comments = {
      1: [
        {
          id: 1,
          text: 'good job',
          pointDelta: -1,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 1,
          rubricComment: null,
        },
      ],
      2: [
        {
          id: 2,
          text: 'good job',
          pointDelta: 3,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 2,
          rubricComment: null,
        },
      ],
    };

    expect(wrapper.instance().hasPositiveAndNegativeComments(comments, commentRubricComments)).toBe(true);

    comments = {
      1: [
        {
          id: 1,
          text: 'good job',
          // @ts-ignore
          pointDelta: undefined,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 1,
          rubricComment: null,
        },
      ],
      2: [
        {
          id: 2,
          text: 'good job',
          pointDelta: 3,
          startChar: 0,
          endChar: 1,
          startLine: 0,
          endLine: 0,
          file: 2,
          rubricComment: null,
        },
      ],
    };
    commentRubricComments = {
      1: {
        id: 1,
        text: 'good job',
        pointDelta: -1,
        category: 1,
        comments: [1],
      },
    };

    expect(wrapper.instance().hasPositiveAndNegativeComments(comments, commentRubricComments)).toBe(true);
  });

  it('addComment()', () => {
    const newComment = {
      id: 1,
      text: 'good job',
      pointDelta: 1,
      startChar: 0,
      endChar: 1,
      startLine: 0,
      endLine: 0,
      file: 1,
      rubricComment: null,
    };

    const file = {
      id: 1,
      code: 'code',
      comments: [],
      extension: 'txt',
      name: 'code.txt',
      submission: 1,
    };

    const submission = {
      id: 1,
      isFinalized: false,
      files: [1],
      assignment: 1,
      dateEdited: '1/1/1999',
      grade: null,
    };

    const { wrapper } = setup();
    wrapper.setState({ comments: { 1: [] } });

    // Should not add any comment when there is no submission
    let didAddComment = wrapper.instance().addComment(newComment, file);
    expect(didAddComment).toBe(false);

    wrapper.setState({ submission });

    didAddComment = wrapper.instance().addComment(newComment, file);
    expect(didAddComment).toBe(true);
    expect(wrapper.state().comments).toEqual({ 1: [newComment] });
  });

  it('updateComment()', () => {
    const comment = {
      id: 1,
      text: 'good job',
      pointDelta: 1,
      startChar: 0,
      endChar: 1,
      startLine: 0,
      endLine: 0,
      file: 1,
      rubricComment: null,
    };

    const newComment = {
      id: 1,
      text: 'great job',
      pointDelta: 1,
      startChar: 0,
      endChar: 1,
      startLine: 0,
      endLine: 0,
      file: 1,
      rubricComment: null,
    };

    const file = {
      id: 1,
      code: 'code',
      comments: [],
      extension: 'txt',
      name: 'code.txt',
      submission: 1,
    };

    const submission = {
      id: 1,
      isFinalized: false,
      files: [1],
      assignment: 1,
      dateEdited: '1/1/1999',
      grade: null,
    };

    const { wrapper } = setup();
    wrapper.setState({ comments: { 1: [comment] } });

    // Should not update any comment when there is no submission
    let didUpdateComment = wrapper.instance().updateComment(1, newComment, file, true);
    expect(didUpdateComment).toBe(false);

    wrapper.setState({ submission });

    didUpdateComment = wrapper.instance().updateComment(1, newComment, file, true);
    expect(didUpdateComment).toBe(true);
    expect(wrapper.state().comments).toEqual({ 1: [newComment] });

    const newCommentWithRubric = {
      id: 1,
      text: 'great job with rubric',
      pointDelta: null,
      startChar: 0,
      endChar: 1,
      startLine: 0,
      endLine: 0,
      file: 1,
      rubricComment: 3,
    };

    didUpdateComment = wrapper.instance().updateComment(1, newCommentWithRubric, file, true);
    expect(didUpdateComment).toBe(true);
    expect(wrapper.state().comments).toEqual({ 1: [newCommentWithRubric] });
    expect(wrapper.state().commentRubricComments).toEqual({ 1: 3 });
  });
});
