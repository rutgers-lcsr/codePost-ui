import CodeConsole from '../components/code-review/CodeConsole.tsx';

// Standard Object Mocks
const standardAssignment = {
  name: 'testAssignment',
  points: 20,
  isReleased: true,
  hidGrades: false,
  commentFeedback: false,
  allowStudentUpload: false,
  uploadDueDate: '',
  liveFeedbackMode: false,
  additiveGrading: false,
  rubricCategories: [],
  course: 0,
  sortKey: 0,
  anonymousGrading: false,
  allowRegradeRequests: false,
  regradeDeadline: '',
  hideGradersFromStudents: false,
  mean: null,
  median: null,
};
const standardComment = {
  startChar: 0,
  endChar: 0,
  startLine: 0,
  endLine: 0,
  pointDelta: 0,
  text: 'Comment',
  file: 1,
  rubricComment: null,
  feedback: 1,
};
const standardFile = {
  code: 'Testing',
  comments: [],
  extension: '.java',
  name: 'hello',
  submission: 1,
  path: '',
  created: '',
};
const standardRubricCategory = {
  name: 'cat',
  rubricComments: [],
  assignment: 1,
  pointLimit: 1,
  sortKey: 0,
  helpText: '',
};
const standardRubricComment = { text: 'text', pointDelta: 0, category: 0, comments: [], sortKey: 0 };

// Additive Grading Mocks
const deductiveAssignment = { ...standardAssignment, additiveGrading: false };
const additiveAssignment = { ...standardAssignment, additiveGrading: true };

// File Mocks
const getCommentsAndFileMock = (
  id: number,
  filePath: string,
  startingCommentIndex: number,
  numPoints: number,
  fileName?: string,
) => {
  const name = fileName ? fileName : `file${id}.java`;
  const thisFile = {
    ...standardFile,
    name: name,
    id: id,
    path: filePath,
    comments: [startingCommentIndex, startingCommentIndex + 1],
  };
  const comm1 = { ...standardComment, id: startingCommentIndex, pointDelta: numPoints, file: id };
  const comm2 = { ...standardComment, id: startingCommentIndex + 1, file: id };
  const commentArr = [comm1, comm2];
  return [thisFile, commentArr];
};

const getFilesNoRubric = (
  file1Points: number,
  file2Points: number,
  file3Points: number,
  filepath1: string,
  filepath2: string,
  filepath3: string,
  file1Name?: string,
  file2Name?: string,
  file3Name?: string,
) => {
  let counter = 1;
  const [file1, comments1]: any = file1Name
    ? getCommentsAndFileMock(1, filepath1, counter, file1Points, file1Name)
    : getCommentsAndFileMock(1, filepath1, counter, file1Points);
  counter += comments1.length;
  const [file2, comments2]: any = file2Name
    ? getCommentsAndFileMock(2, filepath2, counter, file2Points, file2Name)
    : getCommentsAndFileMock(2, filepath2, counter, file2Points);
  counter += comments2.length;
  const [file3, comments3]: any = file3Name
    ? getCommentsAndFileMock(3, filepath3, counter, file3Points, file3Name)
    : getCommentsAndFileMock(3, filepath3, counter, file3Points);

  const files = [file1, file2, file3];
  const comments = { 1: comments1, 2: comments2, 3: comments3 };
  return [files, comments];
};

const getCategoryMock = (id: number, limit: number, pts: number, startingCommentIndex: number): any => {
  const cat = { ...standardRubricCategory, pointLimit: limit, id: id };
  const comm1 = { ...standardRubricComment, pointDelta: pts, id: startingCommentIndex, category: id };
  const comm2 = { ...standardRubricComment, pointDelta: 0, id: startingCommentIndex + 1, category: id };

  return [cat, [comm1, comm2]];
};

const getRubric = (cat1Limit: number, cat1Pts: number, cat2Limit: number, cat2Pts: number) => {
  let counter = 1;
  const [cat1, comments1]: any = getCategoryMock(1, cat1Limit, cat1Pts, counter);
  counter += comments1.length;
  const [cat2, comments2]: any = getCategoryMock(2, cat2Limit, cat2Pts, counter);

  const cats = [cat1, cat2];
  const comments = { 1: comments1[0], 2: comments1[1], 3: comments2[0], 4: comments2[1] };
  return [cats, comments];
};

// @ts-ignore
describe('CalculateGrade', () => {
  // Test Syntax: <CommentPoints>_A_IO_FD
  it('0_D', () => {
    const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
    const assignment = deductiveAssignment;
    const commentRubricComments = {};
    const rubricCategories: any = [];
    expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, rubricCategories, files)).toEqual(
      20,
    );
  }),
    it('0_A', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;
      const commentRubricComments = {};
      const rubricCategories: any = [];
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, rubricCategories, files)).toEqual(
        0,
      );
    }),
    it('3_D', () => {
      const [files, comments] = getFilesNoRubric(1, 2, 0, '', '', '');
      const assignment = deductiveAssignment;
      const commentRubricComments = {};
      const rubricCategories: any = [];
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, rubricCategories, files)).toEqual(
        17,
      );
    }),
    it('-3_D', () => {
      const [files, comments] = getFilesNoRubric(-1, -2, 0, '', '', '');
      const assignment = deductiveAssignment;
      const commentRubricComments = {};
      const rubricCategories: any = [];
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, rubricCategories, files)).toEqual(
        23,
      );
    }),
    it('3_A', () => {
      const [files, comments] = getFilesNoRubric(1, 2, 0, '', '', '');
      const assignment = additiveAssignment;
      const commentRubricComments = {};
      const rubricCategories: any = [];
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, rubricCategories, files)).toEqual(
        -3,
      );
    }),
    it('-3_A', () => {
      const [files, comments] = getFilesNoRubric(-1, -2, 0, '', '', '');
      const assignment = additiveAssignment;
      const commentRubricComments = {};
      const rubricCategories: any = [];
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, rubricCategories, files)).toEqual(
        3,
      );
    }),
    it('0_D_R_1', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 1, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 2, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(17);
    }),
    it('0_D_R_2', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 1, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -2, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(21);
    }),
    it('0_D_RL', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 3, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(18);
    }),
    it('0_D_RL', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -3, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(22);
    }),
    it('0_D_R_2', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -2, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(22);
    }),
    it('0_D_R_4', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-1, 2, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(18);
    }),
    it('0_A_R', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 2, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(-2);
    }),
    it('0_A_R', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 3, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(-2);
    }),
    it('0_A_R', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -2, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(2);
    }),
    it('0_A_R', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -3, 0, 0);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(2);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(15);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(3);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(15);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(3);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', '', 'file1', 'file1', 'file1');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(17);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src/test', '', 'file1', 'file1', 'file1');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(3);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '', 'file1', 'file1', 'file1');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(17);
    }),
    it('0_A_R_N', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '', 'file1', 'file2', 'file3');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(CodeConsole.calculateGrade(assignment, comments, commentRubricComments, cats, files)).toEqual(3);
    });
});
