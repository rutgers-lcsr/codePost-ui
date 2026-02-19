/**
 * Utility functions extracted from CodeConsole component.
 * These static methods handle comment state management, rubric comment linking, grade calculation, and file filtering.
 */

import type { AssignmentType, CommentType, SubmissionTestType, TestCaseType } from '../../types/models';
import { CommentIO, UiComment } from '../../utils/comments';
import { BinaryExtensions, type FileWithId, type FileType, getFileContent } from '../../utils/file';
import * as Immutable from '../../utils/immutable';
import { getLatestSubmissionTests } from '../../utils/submissionTests';
import { Comment, RubricCategory, RubricComment } from '../../api-client';
import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../../types/common';

/**********************************************************************************************************************/
/* Comment State Management
/**********************************************************************************************************************/

export const addCommentToState = (comments: IFileToCommentsMap, comment: CommentType, file: FileWithId) => {
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
 * IMPORTANT: Re-sorts the comments array to maintain proper ordering after ID changes.
 *
 * BUG FIX: When a comment's ID changes (negative to positive after save), we need to
 * remove the old comment and add the new one, not just update in place. Otherwise,
 * we can end up with duplicate comments with different IDs referencing the same content.
 */
export const updateCommentsState = (comments: IFileToCommentsMap, commentID: number, newComment: CommentType) => {
  const fileComments = comments[newComment.file] || [];
  const index = fileComments.findIndex((comment: CommentType) => comment.id === commentID);

  if (index === -1) {
    // Fallback: If comment not found, add it as a new comment
    console.warn('[updateCommentsState] Comment not found with ID', commentID, 'adding as new');
    return addCommentToState(comments, newComment, { id: newComment.file } as FileWithId);
  }

  // Check if this is an ID change (negative -> positive after save)
  if (commentID !== newComment.id) {
    console.log(
      '[updateCommentsState] Comment ID changed from',
      commentID,
      'to',
      newComment.id,
      '- removing old and adding new',
    );
    // Remove the old comment (with negative ID)
    const withoutOld = Immutable.arrayRemove(fileComments, index);
    // Add the new comment (with positive ID) and re-sort
    const withNew = [...withoutOld, newComment];
    return { ...comments, [newComment.file]: withNew.sort(CommentIO.compare) };
  }

  // Regular update (same ID, just content changed)
  const updatedFileComments = Immutable.arrayUpdate(fileComments, newComment, index);
  // CRITICAL: Re-sort after update because comment content changes might affect sort order
  return { ...comments, [newComment.file]: updatedFileComments.sort(CommentIO.compare) };
};

/**********************************************************************************************************************/
/* Linked Rubric Comments State Management
/**********************************************************************************************************************/

export const addToCommentRubricCommentsState = (
  commentRubricComments: ICommentToRubricCommentMap,
  commentID: number,
  rubricComment?: RubricComment,
) => {
  if (rubricComment) {
    return { ...commentRubricComments, [commentID]: rubricComment };
  }
  return commentRubricComments;
};

export const removeFromCommentRubricCommentsState = (
  commentRubricComments: ICommentToRubricCommentMap,
  commentID: number,
): [RubricComment, ICommentToRubricCommentMap] => {
  const { [commentID]: rubricComment, ...restOfCommentRubricComments } = commentRubricComments;
  return [rubricComment, restOfCommentRubricComments];
};

export const linkRubricComment = (
  comments: IFileToCommentsMap,
  rubricComment: RubricComment,
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
  rubricComment: RubricComment,
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
        const linkedRubricComment = rubricComments[comment.id];
        const points = UiComment.points(comment, linkedRubricComment);
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
  rubricCategories: RubricCategory[],
): { [categoryID: number]: number } => {
  const pointsPerCategoryWithCaps: { [categoryID: number]: number } = {};
  for (const category in pointsPerCategory) {
    if (Object.prototype.hasOwnProperty.call(pointsPerCategory, category)) {
      const thisCategory = rubricCategories.find((rubricCategory: RubricCategory) => {
        return rubricCategory.id === +category;
      });
      const pointLimit = thisCategory
        ? thisCategory.pointLimit !== undefined && thisCategory.pointLimit !== null
          ? thisCategory.pointLimit
          : 99999
        : 99999;
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
  const latestTests: SubmissionTestType[] = getLatestSubmissionTests(submissionTests) ?? [];
  return (
    -1 *
    latestTests
      .map((test) => {
        const match = testCases.find((el) => el.id === test.testCase);

        if (match === undefined) {
          return 0;
        }

        return test.passed ? (match.pointsPass ?? 0) : (match.pointsFail ?? 0);
      })
      .reduce((sum, value) => sum + value, 0)
  );
};

/**
 * Calculate the final grade for a submission
 */
export const calculateGrade = (
  assignment: AssignmentType,
  comments: IFileToCommentsMap,
  commentRubricComments: ICommentToRubricCommentMap,
  rubricCategories: RubricCategory[],
  files: FileType[],
  submissionTests: SubmissionTestType[],
  testCases: TestCaseType[],
): number => {
  // Get the set of fileIDs and commentIDs for the current files
  // This filters out any old file versions
  const [currentFileSet, currentCommentSet] = filterCurrentFileVersions(files as FileWithId[], comments);
  const commentPoints = genericCommentPoints(comments, currentFileSet);
  const pointsPerCategoryCalc = pointsPerCategory(commentRubricComments, currentCommentSet);
  const pointsPerCategoryWithCapsCalc = pointsPerCategoryWithCaps(pointsPerCategoryCalc, rubricCategories);

  const categoryPoints = Object.values(pointsPerCategoryWithCapsCalc).reduce((accumulator: number, current: number) => {
    return accumulator + current;
  }, 0);

  /* grab latest submission tests */
  const testsAffectGrade = assignment.testsAffectGrade ?? true;
  const testPoints = testsAffectGrade ? pointsFromTests(submissionTests, testCases) : 0;

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
  files: FileWithId[],
  currentComments?: IFileToCommentsMap,
): [Set<number>, Set<number>] => {
  const currentFiles: { [pathName: string]: FileWithId } = {};
  files.forEach((file) => {
    const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;
    if (!currentFiles[path]) currentFiles[path] = file;
    else {
      const currentCreated = currentFiles[path].created ? Date.parse(currentFiles[path].created) : 0;
      const nextCreated = file.created ? Date.parse(file.created) : 0;
      if (currentCreated <= nextCreated) {
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
      file.comments?.forEach((commentID: number | Comment) => {
        if (typeof commentID === 'object') {
          currentCommentSet.add(commentID.id);
        } else {
          currentCommentSet.add(commentID as number);
        }
      });
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
    const size_bytes = new Blob([getFileContent(file)]).size;

    const bounce =
      !['.pdf', 'pdf', 'jpg', '.jpg', 'jpeg', '.jpeg', 'png', '.png', 'ipynb', '.ipynb'].includes(
        file.extension.toLowerCase(),
      ) && size_bytes > max_size_bytes;
    if (bounce) {
      return {
        ...file,
        code: `This file is over the codePost allowable size (${max_size_bytes / 1000000}MB).\n\nPlease compress the file or contact team@codepost.io.`,
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
