/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* other library imports */
import { Document, Page } from 'react-pdf';

import { pdfjs } from 'react-pdf';

/* codePost imports */
import { ICodeContentCoreProps, ICodeContentEditProps } from './CodeContent';

import { CommentType } from '../../../infrastructure/comment';
import { File } from '../../../infrastructure/file';

import { getBlockClassName } from './BlockUtils.tsx';

/**********************************************************************************************************************/

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export const Pdf = (props: ICodeContentCoreProps & ICodeContentEditProps) => {
  const [numPages, setPages] = useState(null);

  const onBlockElementClick = (e: React.MouseEvent) => {
    const index = e.currentTarget.getAttribute('data-page-number');
    if (index) {
      const newComment: CommentType = {
        id: props.commentCounter,
        endChar: 0,
        endLine: +index,
        file: props.file.id,
        pointDelta: 0.0,
        startChar: 0,
        startLine: +index,
        text: '',
        rubricComment: null,
        author: props.user,
        feedback: 0,
        color: '',
      };

      props.addComment(newComment, props.file);
    }
  };

  const onDocumentLoadSuccess = (pdf: any) => {
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

  if (File.codeType(props.file) === 'pdf') {
    return (
      <Document file={props.file.code} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            className={getBlockClassName(props.comments, props.readOnly, index + 1)}
            pageNumber={index + 1}
            renderTextLayer={false}
            onRenderSuccess={dispatch}
            onClick={onBlockElementClick}
          />
        ))}
      </Document>
    );
  }
  return <div className="markdown-block markdown-block--empty" />;
};
