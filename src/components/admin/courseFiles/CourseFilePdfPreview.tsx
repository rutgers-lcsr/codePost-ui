// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Read-only PDF preview for the Course Files modal (mirrors ViewUpload's minimal
// react-pdf usage). Loaded via React.lazy so the pdf-vendor chunk is only pulled when a
// PDF is opened. A base64 data: URI works directly as the Document source.
import * as React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import { pdfWorkerUrl } from '../../../features/code-review/code-panel/pdfWorkerUrl';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface IProps {
  /** The stored base64 data: URI of the PDF. */
  dataUri: string;
  /** Rendered page width in px (sized to the modal body). */
  width?: number;
}

const CourseFilePdfPreview: React.FC<IProps> = ({ dataUri, width = 560 }) => {
  const [numPages, setNumPages] = React.useState<number | null>(null);
  return (
    <Document file={dataUri} onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}>
      {Array.from({ length: numPages ?? 0 }, (_, index) => (
        // renderTextLayer (default) keeps the PDF's text selectable and readable by AT.
        <Page key={`page_${index + 1}`} pageNumber={index + 1} width={width} />
      ))}
    </Document>
  );
};

export default CourseFilePdfPreview;
