/**********************************************************************************************************************/
/* Utility functions extracted from CodeConsole component
 * These static methods handle comment state management, rubric comment linking, grade calculation, and file filtering
/**********************************************************************************************************************/

import { AssignmentType } from '../../infrastructure/assignment';
import { CommentIO, CommentType, UiComment } from '../../infrastructure/comment';
import { BinaryExtensions, FileType } from '../../infrastructure/file';
import * as Immutable from '../../infrastructure/immutable';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';
import { SubmissionTest, SubmissionTestType } from '../../infrastructure/submissionTest';
import { TestCaseType } from '../../infrastructure/types';
import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../types/common';

/**********************************************************************************************************************/
/* Comment State Management
/**********************************************************************************************************************/

export const addCommentToState = (comments: IFileToCommentsMap, comment: CommentType, file: FileType) => {
  const fileComments = Immutable.arrayAdd(comments[file.id], comment);
  return { ...comments, [file.id]: fileComments.sort(CommentIO.compare) };
};

export const removeCommentFromState = (comments: IFileToCommentsMap, comment: CommentType) => {
  const index = comments[comment.file].findIndex((c: CommentType) => c.id === comment.id);

  const fileComments = Immutable.arrayRemove(comments[comment.file], index);
  return { ...comments, [comment.file]: fileComments };
};

/**
 * Updates an existing comment in the state by replacing it with a new version.
 * If the comment is not found (edge case), adds it as a new comment instead.
 */
export const updateCommentsState = (comments: IFileToCommentsMap, commentID: number, newComment: CommentType) => {
  const fileComments = comments[newComment.file] || [];
  const index = fileComments.findIndex((comment: CommentType) => comment.id === commentID);

  if (index === -1) {
    // Fallback: If comment not found, add it as a new comment
    return addCommentToState(comments, newComment, { id: newComment.file } as any);
  }

  const updatedFileComments = Immutable.arrayUpdate(fileComments, newComment, index);
  return { ...comments, [newComment.file]: updatedFileComments };
};

/**********************************************************************************************************************/
/* Linked Rubric Comments State Management
/**********************************************************************************************************************/

export const addToCommentRubricCommentsState = (
  commentRubricComments: ICommentToRubricCommentMap,
  commentID: number,
  rubricComment?: RubricCommentType,
) => {
  if (rubricComment) {
    return { ...commentRubricComments, [commentID]: rubricComment };
  }
  return commentRubricComments;
};

export const removeFromCommentRubricCommentsState = (
  commentRubricComments: ICommentToRubricCommentMap,
  commentID: number,
): [RubricCommentType, ICommentToRubricCommentMap] => {
  const { [commentID]: rubricComment, ...restOfCommentRubricComments } = commentRubricComments;
  return [rubricComment, restOfCommentRubricComments];
};

export const linkRubricComment = (
  comments: IFileToCommentsMap,
  rubricComment: RubricCommentType,
  activeCommentID: number,
) => {
  for (const fileID of Object.keys(comments)) {
    const index = comments[+fileID].findIndex((comment: CommentType) => comment.id === activeCommentID);
    if (index !== -1) {
      const comment = {
        ...comments[+fileID][index],
        rubricComment: rubricComment.id,
        pointDelta: null,
      };
      const fileComments = Immutable.arrayUpdate(comments[+fileID], comment, index);

      return { ...comments, [+fileID]: fileComments };
    }
  }

  return undefined;
};

export const unlinkRubricComment = (
  comments: IFileToCommentsMap,
  comment: CommentType,
  rubricComment: RubricCommentType,
) => {
  const index = comments[comment.file].findIndex((c: CommentType) => c.id === comment.id);
  const editedComment = {
    ...comments[comment.file][index],
    rubricComment: null,
    pointDelta: rubricComment.pointDelta,
  };
  const fileComments = Immutable.arrayUpdate(comments[comment.file], editedComment, index);
  return { ...comments, [comment.file]: fileComments };
};

/**********************************************************************************************************************/
/* Grading Calculations
/**********************************************************************************************************************/

/**
 * Calculate points in a file
 * @returns [deductions, bonuses]
 */
export const pointsInFile = (
  _file: FileType,
  comments: CommentType[],
  rubricComments: ICommentToRubricCommentMap,
): number[] => {
  return comments.reduce(
    (accumulator: number[], comment: CommentType) => {
      if (!UiComment.isNew(comment)) {
        const points = UiComment.points(comment, rubricComments[comment.id]);
        if (points > 0) {
          // Deductions
          return [accumulator[0] + points, accumulator[1]];
        } else {
          // Bonuses
          return [accumulator[0], accumulator[1] - points];
        }
      } else {
        return accumulator;
      }
    },
    [0, 0],
  );
};

/**
 * Calculate points from generic comments (comments with pointDelta)
 */
export const genericCommentPoints = (comments: IFileToCommentsMap, filterFileSet?: Set<number>): number => {
  return Object.keys(comments)
    .map((fileID) => {
      // If there's a filter set, and this file isn't in the set, then ignore it
      if (filterFileSet && !filterFileSet.has(parseInt(fileID))) return 0;

      return comments[+fileID].reduce((accumulator: number, comment: CommentType) => {
        if (!UiComment.isNew(comment) && comment.pointDelta) {
          return accumulator + comment.pointDelta;
        } else {
          return accumulator;
        }
      }, 0);
    })
    .reduce((accumulator: number, fileGrade: number) => {
      return accumulator + fileGrade;
    }, 0);
};

/**
 * Calculate points from RubricComments, ignoring category caps
 */
export const pointsPerCategory = (
  commentRubricComments: ICommentToRubricCommentMap,
  filterCommentSet?: Set<number>,
): { [categoryID: number]: number } => {
  const pointsPerCategory: { [categoryID: number]: number } = {};
  for (const commentID in commentRubricComments) {
    // If there's a filter set, and this comment isn't in the set, then ignore it
    if (filterCommentSet && !filterCommentSet.has(parseInt(commentID))) continue;

    // Don't count unsaved comments
    if (+commentID > 0 && Object.prototype.hasOwnProperty.call(commentRubricComments, commentID)) {
      if (!pointsPerCategory[commentRubricComments[commentID].category]) {
        pointsPerCategory[commentRubricComments[commentID].category] = commentRubricComments[commentID].pointDelta;
      } else {
        pointsPerCategory[commentRubricComments[commentID].category] =
          pointsPerCategory[commentRubricComments[commentID].category] + commentRubricComments[commentID].pointDelta;
      }
    }
  }

  return pointsPerCategory;
};

/**
 * Apply category point caps to calculated points per category
 */
export const pointsPerCategoryWithCaps = (
  pointsPerCategory: { [categoryID: number]: number },
  rubricCategories: RubricCategoryType[],
): { [categoryID: number]: number } => {
  const pointsPerCategoryWithCaps: { [categoryID: number]: number } = {};
  for (const category in pointsPerCategory) {
    if (Object.prototype.hasOwnProperty.call(pointsPerCategory, category)) {
      const thisCategory = rubricCategories.find((rubricCategory: RubricCategoryType) => {
        return rubricCategory.id === +category;
      });
      const pointLimit = thisCategory ? (thisCategory.pointLimit !== null ? thisCategory.pointLimit : 99999) : 99999;
      if (pointLimit < 0) {
        pointsPerCategoryWithCaps[+category] = Math.max(pointsPerCategory[category], pointLimit);
      } else {
        pointsPerCategoryWithCaps[+category] = Math.min(pointsPerCategory[category], pointLimit);
      }
    }
  }
  return pointsPerCategoryWithCaps;
};

/**
 * Calculate points from submission tests
 */
export const pointsFromTests = (submissionTests: SubmissionTestType[], testCases: TestCaseType[]): number => {
  return (
    -1 *
    SubmissionTest.getLatest(submissionTests)
      .map((test) => {
        const match = testCases.find((el) => el.id === test.testCase);

        if (match === undefined) {
          return 0;
        }

        return test.passed ? match!.pointsPass : match!.pointsFail;
      })
      .reduce((el, acc) => el + acc, 0)
  );
};

/**
 * Calculate the final grade for a submission
 */
export const calculateGrade = (
  assignment: AssignmentType,
  comments: IFileToCommentsMap,
  commentRubricComments: ICommentToRubricCommentMap,
  rubricCategories: RubricCategoryType[],
  files: FileType[],
  submissionTests: SubmissionTestType[],
  testCases: TestCaseType[],
): number => {
  // Get the set of fileIDs and commentIDs for the current files
  // This filters out any old file versions
  const [currentFileSet, currentCommentSet] = filterCurrentFileVersions(files, comments);
  const commentPoints = genericCommentPoints(comments, currentFileSet);
  const pointsPerCategoryCalc = pointsPerCategory(commentRubricComments, currentCommentSet);
  const pointsPerCategoryWithCapsCalc = pointsPerCategoryWithCaps(pointsPerCategoryCalc, rubricCategories);

  const categoryPoints = Object.values(pointsPerCategoryWithCapsCalc).reduce((accumulator: number, current: number) => {
    return accumulator + current;
  }, 0);

  /* grab latest submission tests */
  const testPoints = pointsFromTests(submissionTests, testCases);

  let grade = 0;
  if (assignment.additiveGrading) {
    grade = 0 - commentPoints - categoryPoints - testPoints;
  } else {
    grade = assignment.points - commentPoints - categoryPoints - testPoints;
  }

  // Prevent floating point arithmetic causing weird rounding errors
  return parseFloat(grade.toFixed(2));
};

/**********************************************************************************************************************/
/* File Filtering and Processing
/**********************************************************************************************************************/

/**
 * Filter out old file versions, keeping only the current file versions
 * @returns [currentFileSet, currentCommentSet]
 */
export const filterCurrentFileVersions = (
  files: FileType[],
  currentComments?: IFileToCommentsMap,
): [Set<number>, Set<number>] => {
  const currentFiles: { [pathName: string]: FileType } = {};
  files.forEach((file) => {
    const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;
    if (!currentFiles[path]) currentFiles[path] = file;
    else {
      if (Date.parse(currentFiles[path].created) <= Date.parse(file.created)) {
        currentFiles[path] = file;
      }
    }
  });

  const currentFileSet: Set<number> = new Set();
  const currentCommentSet: Set<number> = new Set();
  Object.keys(currentFiles).forEach((path) => {
    const file = currentFiles[path];
    currentFileSet.add(file.id);
    if (currentComments) {
      // If current comment Map is specified, use that instead of file.comments
      const comments = currentComments[file.id];
      if (comments) {
        comments.forEach((comment) => currentCommentSet.add(comment.id));
      }
    } else {
      file.comments.forEach((commentID) => currentCommentSet.add(commentID));
    }
  });

  return [currentFileSet, currentCommentSet];
};

/**
 * Process files to handle size limits and binary file types
 */
export const fileBouncer = (files: FileType[]) => {
  const max_size_bytes = 500000;

  return files.map((file: FileType) => {
    const size_bytes = new Blob([file.code]).size;

    const bounce =
      !['.pdf', 'pdf', 'jpg', '.jpg', 'jpeg', '.jpeg', 'png', '.png', 'ipynb', '.ipynb'].includes(
        file.extension.toLowerCase(),
      ) && size_bytes > max_size_bytes;
    if (bounce) {
      return {
        ...file,
        code: `This file is over the codePost allowable size (${
          max_size_bytes / 1000000
        }MB).\n\nPlease compress the file or contact team@codepost.io.`,
      };
    }

    const binary = BinaryExtensions.includes(file.extension.toLowerCase());

    if (binary) {
      return {
        ...file,
        code: 'Preview Not Available',
      };
    }

    return file;
  });
};
