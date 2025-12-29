import React, { useEffect } from 'react';
import { Document, Page } from 'react-pdf';

const PDFViewer = ({
  pdfFile,
  pageNumber = 1,                 // NEW: active page from parent
  width = 600,
  onDocumentLoadSuccess
}) => {

  useEffect(() => {
    // Helps verify page changes during navigation
    console.log("PDFViewer rendering page:", pageNumber);
  }, [pageNumber]);

  return (
    <div className="pdf-viewer-wrapper">
      <Document
        file={pdfFile}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div style={{ padding: 20 }}>Loading PDF...</div>}
        error={<div style={{ color: 'red', padding: 20 }}>Failed to load PDF.</div>}
      >
        <Page
          pageNumber={pageNumber}          // 🔑 FIX: dynamic page binding
          width={width}
          renderAnnotationLayer={false}    // Disable default PDF annotations
          renderTextLayer={false}          // Disable text selection layer
        />
      </Document>
    </div>
  );
};

export default PDFViewer;
