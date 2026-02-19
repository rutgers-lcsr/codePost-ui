import * as CodeConsoleUtils from '../features/code-review/codeConsoleUtils';

// ##############################################################################
// ######################### Standard Object Mocks ##############################
// ##############################################################################
const standardAssignment = {
  id: 1,
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

// ##############################################################################
// ######################### Helper Functions ###################################
// ##############################################################################
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

// ##############################################################################
// ############$$$$$$############# Tests #####################$$$$$$#############
// ##############################################################################
describe('CalculateGrade_NoFileVersions', () => {
  // Test Syntax: <CommentPoints>_A_IO_FD
  it('NoCaps_Deductive', () => {
    const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
    const assignment = deductiveAssignment;
    const commentRubricComments = {};
    const rubricCategories: any = [];
    expect(
      CodeConsoleUtils.calculateGrade(
        assignment as any,
        comments as any,
        commentRubricComments as any,
        rubricCategories as any,
        files as any,
        [],
        [],
      ),
    ).toEqual(20);
  });
  it('NoCaps_Additive', () => {
    const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
    const assignment = additiveAssignment;
    const commentRubricComments = {};
    const rubricCategories: any = [];
    expect(
      CodeConsoleUtils.calculateGrade(
        assignment as any,
        comments as any,
        commentRubricComments as any,
        rubricCategories as any,
        files as any,
        [],
        [],
      ),
    ).toEqual(0);
  });
  (it('NoCaps_Deductive_2', () => {
    const [files, comments] = getFilesNoRubric(1, 2, 0, '', '', '');
    const assignment = deductiveAssignment;
    const commentRubricComments = {};
    const rubricCategories: any = [];
    expect(
      CodeConsoleUtils.calculateGrade(
        assignment as any,
        comments as any,
        commentRubricComments as any,
        rubricCategories as any,
        files as any,
        [],
        [],
      ),
    ).toEqual(17);
  }),
    it('NoCaps_Deductive_3', () => {
      const [files, comments] = getFilesNoRubric(-1, -2, 0, '', '', '');
      const assignment = deductiveAssignment;
      const commentRubricComments = {};
      const rubricCategories: any = [];
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          rubricCategories as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(23);
    }));
  (it('NoCaps_Additive_2', () => {
    const [files, comments] = getFilesNoRubric(1, 2, 0, '', '', '');
    const assignment = additiveAssignment;
    const commentRubricComments = {};
    const rubricCategories: any = [];
    expect(
      CodeConsoleUtils.calculateGrade(
        assignment as any,
        comments as any,
        commentRubricComments as any,
        rubricCategories as any,
        files as any,
        [],
        [],
      ),
    ).toEqual(-3);
  }),
    it('NoCaps_Additive_3', () => {
      const [files, comments] = getFilesNoRubric(-1, -2, 0, '', '', '');
      const assignment = additiveAssignment;
      const commentRubricComments = {};
      const rubricCategories: any = [];
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          rubricCategories as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(3);
    }),
    it('NoCaps_Deductive_4', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 1, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 2, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(17);
    }),
    it('NoCaps_Deductive_5', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 1, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -2, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(21);
    }),
    it('Caps_Deductive', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 3, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(18);
    }),
    it('Caps_Deductive_2', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -3, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(22);
    }),
    it('Caps_Deductive_3', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -2, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(22);
    }),
    it('Caps_Deductive_5', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(-1, 2, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(18);
    }),
    it('Caps_Additive', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 2, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(-2);
    }),
    it('Caps_Additive_1', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(2, 3, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(-2);
    }),
    it('Caps_Additive_2', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -2, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(2);
    }),
    it('Caps_Additive_3', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-2, -3, 0, 0);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(2);
    }),
    it('Caps_Deductive_Paths', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(15);
    }),
    it('Caps_Additive_Paths', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(3);
    }),
    it('Caps_Deductive_Paths_2', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(15);
    }),
    it('Caps_Additive_Paths_2', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', 'src/tst');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(3);
    }));
});

describe('CalculateGrade_FileVersions', () => {
  // Test Syntax: <CommentPoints>_A_IO_FD
  (it('Caps_Deductive_Paths_OldFiles', () => {
    const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src', '', 'file1', 'file1', 'file1');
    const assignment = deductiveAssignment;

    const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
    expect(
      CodeConsoleUtils.calculateGrade(
        assignment as any,
        comments as any,
        commentRubricComments as any,
        cats as any,
        files as any,
        [],
        [],
      ),
    ).toEqual(17);
  }),
    it('Caps_Additive_Paths_OldFiles', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, 'src', 'src/test', '', 'file1', 'file1', 'file1');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(3);
    }),
    it('Caps_Deductive_OldFiles', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '', 'file1', 'file1', 'file1');
      const assignment = deductiveAssignment;

      const [cats, commentRubricComments] = getRubric(5, 3, 4, 2);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(17);
    }),
    it('Caps_Additive_OldFiles', () => {
      const [files, comments] = getFilesNoRubric(0, 0, 0, '', '', '', 'file1', 'file2', 'file3');
      const assignment = additiveAssignment;

      const [cats, commentRubricComments] = getRubric(-4, -2, -3, -1);
      expect(
        CodeConsoleUtils.calculateGrade(
          assignment as any,
          comments as any,
          commentRubricComments as any,
          cats as any,
          files as any,
          [],
          [],
        ),
      ).toEqual(3);
    }));
});
