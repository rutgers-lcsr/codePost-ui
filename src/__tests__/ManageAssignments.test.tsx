import { shallow } from 'enzyme';
import jest from 'jest-mock';

import ManageAssignments, { IManageAssignmentsProps } from '../components/admin/assignments/ManageAssignments';

describe('ManageAssignments', () => {
  const setup = (propOverrides?: Partial<IManageAssignmentsProps>) => {
    // default props
    const props = Object.assign(
      {
        rubricCategories: {},
        rubricComments: {},
        submissions: {},
        loadComplete: true,
        lockManageAssignment: true,
        currentCourse: {
          id: 1,
          name: 'COS126',
          period: 'S2019',
          organization: 1,
          assignments: [],
          sections: [],
          sendReleasedSubmissionsToBack: false,
          showStudentsStatistics: false,
          timezone: 'US/Eastern',
          emailNewUsers: false,
        },
        viewsBySubmission: {},
        assignments: [],
        submissionsByStudent: {},
        students: ['student1@princeton.edu', 'student2@princeton.edu'],
        sections: [],
        toggleLock: jest.fn(),
        addToast: jest.fn(),
        addErrorToast: jest.fn(),
        deleteAssignment: jest.fn(),
        createRubricCategory: jest.fn(),
        createRubricComment: jest.fn(),
        deleteRubricCategory: jest.fn(),
        deleteRubricComment: jest.fn(),
        updateRubricCategory: jest.fn(),
        updateRubricComment: jest.fn(),
        updateAssignment: jest.fn(),
        createAssignment: jest.fn(),
        setLoadingDialog: jest.fn(),
        clearLoadingDialog: jest.fn(),
        uploadSubmission: jest.fn(),
        updateSubmission: jest.fn(),
        deleteSubmission: jest.fn(),
        refreshCourseData: jest.fn(),
        myEmail: 'myEmail@school.edu',
        user: {},
      },
      propOverrides,
    );

    const wrapper = shallow(<ManageAssignments {...(props as any)} />);

    return { props, wrapper };
  };

  it('getAllGrades()', () => {
    const students = ['student1@princeton.edu', 'student2@princeton.edu'];
    const assignments: any = [
      {
        id: 1,
        name: 'Hello',
        points: 20,
        isReleased: true,
        course: 1,
        rubricCategories: [1, 2, 3, 4],
        mean: 20,
        median: 20,
        sortKey: 0,
      },
      {
        id: 2,
        name: 'Loops',
        points: 20,
        isReleased: true,
        course: 1,
        rubricCategories: [],
        mean: 20,
        median: 20,
        sortKey: 0,
      },
    ];
    const submissions = {
      1: [
        {
          id: 9,
          assignment: 1,
          students: ['student1@princeton.edu'],
          grader: '',
          isFinalized: true,
          dateEdited: '2019-03-15T15:26:29.714396-04:00',
          grade: 20,
          files: [],
          queueOrderKey: 0,
        },
        {
          id: 17,
          assignment: 1,
          students: ['student2@princeton.edu'],
          grader: 'superadmin@codepost.io',
          isFinalized: true,
          dateEdited: '2019-03-01T01:13:26.650388-05:00',
          grade: 2,
          files: [],
          queueOrderKey: 0,
        },
      ],
      2: [
        {
          id: 9,
          assignment: 1,
          students: ['student1@princeton.edu'],
          grader: '',
          isFinalized: true,
          dateEdited: '2019-03-15T15:26:29.714396-04:00',
          grade: 18,
          files: [],
          queueOrderKey: 0,
        },
        {
          id: 17,
          assignment: 1,
          students: ['student2@princeton.edu'],
          grader: 'superadmin@codepost.io',
          isFinalized: true,
          dateEdited: '2019-03-01T01:13:26.650388-05:00',
          grade: 17.5,
          files: [],
          queueOrderKey: 0,
        },
      ],
    };

    const expected = [
      ['Active Student', 'Hello', 'Loops'],
      ['student1@princeton.edu', '20', '18'],
      ['student2@princeton.edu', '2', '17.5'],
    ];
    const { wrapper } = setup();
    expect(wrapper.instance().getAllGrades(assignments, submissions, students)).toEqual(expected);
  });
});
