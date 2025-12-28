import React from 'react';
import { Document, Page } from 'react-pdf';

const PDFViewer = ({ pdfFile, width = 600, onDocumentLoadSuccess }) => {
  return (
    <div className="pdf-viewer-wrapper">
      <Document
        file={pdfFile}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div style={{ padding: 20 }}>Loading PDF...</div>}
        error={<div style={{ color: 'red', padding: 20 }}>Failed to load PDF.</div>}
      >
        <Page 
          pageNumber={1} 
          width={width} 
          renderAnnotationLayer={false} // Disable default PDF annotations
          renderTextLayer={false}       // Disable text selection layer for cleaner UI
        />
      </Document>
    </div>
  );
};

export default PDFViewer;