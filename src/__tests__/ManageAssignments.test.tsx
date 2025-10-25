import { buildAllGradesTable } from '../components/admin/assignments/assignments/DownloadGrades';
import { AssignmentType } from '../infrastructure/assignment';
import { SubmissionInfoType } from '../infrastructure/types';

describe('buildAllGradesTable', () => {
  it('creates a matrix of grades for each student and assignment', () => {
    const assignments = [
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
        allowStudentUpload: false,
        allowStudentUploadWithPartners: false,
        allowLateUploads: false,
        explanation: '',
        files: [],
        liveFeedbackMode: false,
        testCategories: [],
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
        allowStudentUpload: false,
        allowStudentUploadWithPartners: false,
        allowLateUploads: false,
        explanation: '',
        files: [],
        liveFeedbackMode: false,
        testCategories: [],
      },
    ];
    const typedAssignments = assignments as unknown as AssignmentType[];

    const students = ['student1@princeton.edu', 'student2@princeton.edu'];

    const submissionsByStudent = {
      'student1@princeton.edu': {
        1: {
          id: 9,
          assignment: 1,
          students: ['student1@princeton.edu'],
          grader: '',
          isFinalized: true,
          dateEdited: '2019-03-15T15:26:29.714396-04:00',
          grade: 20,
          files: [],
          queueOrderKey: 0,
        } as unknown as SubmissionInfoType,
        2: {
          id: 10,
          assignment: 2,
          students: ['student1@princeton.edu'],
          grader: '',
          isFinalized: true,
          dateEdited: '2019-03-15T15:26:29.714396-04:00',
          grade: 18,
          files: [],
          queueOrderKey: 0,
        } as unknown as SubmissionInfoType,
      },
      'student2@princeton.edu': {
        1: {
          id: 11,
          assignment: 1,
          students: ['student2@princeton.edu'],
          grader: 'superadmin@codepost.io',
          isFinalized: true,
          dateEdited: '2019-03-01T01:13:26.650388-05:00',
          grade: 2,
          files: [],
          queueOrderKey: 0,
        } as unknown as SubmissionInfoType,
        2: {
          id: 12,
          assignment: 2,
          students: ['student2@princeton.edu'],
          grader: 'superadmin@codepost.io',
          isFinalized: true,
          dateEdited: '2019-03-01T01:13:26.650388-05:00',
          grade: 17.5,
          files: [],
          queueOrderKey: 0,
        } as unknown as SubmissionInfoType,
      },
    };
    const typedSubmissions = submissionsByStudent as unknown as Record<string, Record<number, SubmissionInfoType>>;

    const expected = [
      ['Active Student', 'Hello', 'Loops'],
      ['student1@princeton.edu', '20', '18'],
      ['student2@princeton.edu', '2', '17.5'],
    ];

    expect(buildAllGradesTable(typedAssignments, students, typedSubmissions)).toEqual(expected);
  });
});
