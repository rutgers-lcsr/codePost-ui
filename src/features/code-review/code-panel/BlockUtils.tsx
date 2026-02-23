// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// Set of utils for rendering blocks (Markdown, PDF, Image)
import { CommentType } from '../../../types/models';
import { File, FileType } from '../../../utils/file';

import themeVars from '../../../styles/abstracts/_theme.js';

const blockContainsComment = (comments: CommentType[], index: number): boolean => {
  return (
    comments.filter((comment: CommentType) => {
      return comment.startLine === index;
    }).length > 0
  );
};

export const getBlockClassName = (comments: CommentType[], readOnly: boolean, index: number): string => {
  const editable = readOnly ? 'readonly' : 'active';
  let className = `markdown-block markdown-block--empty ${editable}`;
  if (blockContainsComment(comments, index)) {
    className = `markdown-block markdown-block--commented ${editable}`;
  }
  return className;
};

// Function to find a block element, given a comment start line
export const findBlockElement = (file: FileType, startLine: number) => {
  if (File.codeType(file) === 'pdf') {
    return document.querySelector(`[data-page-number="${startLine}"]`);
  } else {
    return document.querySelector(`[index-number="${startLine}"]`);
  }
};

export const getPDFStartPlacement = (comment: CommentType) => {
  return themeVars.grade.pageHeight * (comment.startLine - 1);
};
