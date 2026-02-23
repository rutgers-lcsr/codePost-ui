// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useContext, useMemo, useState } from 'react';

/* other library imports */
import { Document, Page } from 'react-pdf';

import { pdfjs } from 'react-pdf';

/* codePost imports */
import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import type { CommentType } from '../../../types/models';
import { File, getFileContent } from '../../../utils/file';

import { getBlockClassName } from './BlockUtils.tsx';
import CommentHighlightContext from './CommentHighlightContext';

/**********************************************************************************************************************/

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

type PdfDocumentProxyLike = {
  numPages: number;
};

export const Pdf = (props: ICodeContentCoreProps & ICodeContentEditProps) => {
  const [numPages, setPages] = useState<number | null>(null);

  const { addComment, commentCounter, comments, file, readOnly, user } = props;

  const commentHighlight = useContext(CommentHighlightContext);
  const setHoveredCommentId = commentHighlight?.setHoveredCommentId;
  const getCommentsForLine = commentHighlight?.getCommentsForLine;
  const lineHasComments = commentHighlight?.lineHasComments;
  const isCommentHovered = commentHighlight?.isCommentHovered;
  const contextOnHighlightClick = commentHighlight?.onHighlightClick;

  const hasCommentsForPage = useCallback(
    (pageNumber: number): boolean => {
      if (!lineHasComments) {
        return false;
      }

      return lineHasComments(pageNumber);
    },
    [lineHasComments],
  );

  const handleHoverEnterPage = useCallback(
    (pageNumber: number) => {
      if (!setHoveredCommentId || !getCommentsForLine) {
        return;
      }

      const commentsForPage = getCommentsForLine(pageNumber);
      if (commentsForPage.length === 0) {
        return;
      }

      setHoveredCommentId(commentsForPage[0].id);
    },
    [getCommentsForLine, setHoveredCommentId],
  );

  const handleHoverLeavePage = useCallback(
    (pageNumber: number) => {
      if (!setHoveredCommentId || !getCommentsForLine || !isCommentHovered) {
        return;
      }

      const commentsForPage = getCommentsForLine(pageNumber);
      if (commentsForPage.some((comment) => isCommentHovered(comment.id))) {
        setHoveredCommentId(null);
      }
    },
    [getCommentsForLine, isCommentHovered, setHoveredCommentId],
  );

  const handleExistingCommentOpen = useCallback(
    (event: React.MouseEvent, pageNumber: number): boolean => {
      if (!contextOnHighlightClick || !getCommentsForLine) {
        return false;
      }

      const commentsForPage = getCommentsForLine(pageNumber);
      if (commentsForPage.length === 0) {
        return false;
      }

      const primaryComment = commentsForPage[0];
      if (!primaryComment || primaryComment.id === 0 || primaryComment.id === Number.MAX_SAFE_INTEGER) {
        return false;
      }

      contextOnHighlightClick(event, primaryComment.id);
      setHoveredCommentId?.(primaryComment.id);
      return true;
    },
    [contextOnHighlightClick, getCommentsForLine, setHoveredCommentId],
  );

  const handlePageClick = useCallback(
    (event: React.MouseEvent, pageNumber: number) => {
      if (handleExistingCommentOpen(event, pageNumber)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (readOnly) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const newComment: CommentType = {
        id: commentCounter,
        endChar: 0,
        endLine: pageNumber,
        file: file.id ?? 0,
        pointDelta: 0.0,
        startChar: 0,
        startLine: pageNumber,
        text: '',
        rubricComment: null,
        author: user,
        feedback: 0,
        color: '',
      };

      addComment(newComment, file);
      setHoveredCommentId?.(newComment.id);
    },
    [addComment, commentCounter, file, handleExistingCommentOpen, readOnly, setHoveredCommentId, user],
  );

  const onDocumentLoadSuccess = (pdf: PdfDocumentProxyLike) => {
    setPages(pdf.numPages);
    dispatch();
  };

  // FIXME: This is a hack to trigger comment placements to reload after the PDF has loaded.
  // The PDF can take some time to load, and if the placement isn't triggered the comments will stay on top
  // Passing in refs to the <Comments /> and triggering comment placement from <CodeConent /> doesn't work because
  // of a typescript issue with being unable to use react.forwardRef(), which we need to do because each <Comments />
  // object is wrapped in a HOC with withWindowWatcher.
  const dispatch = () => {
    const event = new Event('pdf-loaded');
    document.dispatchEvent(event);
  };

  const getPageClassName = useCallback(
    (pageNumber: number) => {
      return getBlockClassName(comments, readOnly, pageNumber);
    },
    [comments, readOnly],
  );

  const pageEventHandlers = useMemo(
    () =>
      Array.from({ length: numPages ?? 0 }, (_, index) => {
        const pageNumber = index + 1;
        const pageHasComments = hasCommentsForPage(pageNumber);

        return {
          pageNumber,
          pageHasComments,
          onMouseEnter: pageHasComments ? () => handleHoverEnterPage(pageNumber) : undefined,
          onMouseLeave: pageHasComments ? () => handleHoverLeavePage(pageNumber) : undefined,
          onClick: (event: React.MouseEvent) => handlePageClick(event, pageNumber),
        };
      }),
    [handleHoverEnterPage, handleHoverLeavePage, handlePageClick, hasCommentsForPage, numPages],
  );

  if (File.codeType(props.file) === 'pdf') {
    return (
      <Document
        file={getFileContent(props.file)}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error) => console.error('Error loading PDF:', error)}
      >
        {pageEventHandlers.map(({ pageNumber, pageHasComments, onMouseEnter, onMouseLeave, onClick }) => (
          <Page
            key={`page_${pageNumber}`}
            className={getPageClassName(pageNumber)}
            data-has-comment={pageHasComments ? 'true' : undefined}
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onRenderSuccess={dispatch}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
          />
        ))}
      </Document>
    );
  }
  return <div className="markdown-block markdown-block--empty" />;
};
