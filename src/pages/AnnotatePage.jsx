import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import axios from 'axios';
import {
  Box,
  IconButton,
  Button,
  Typography,
  TextField,
  Drawer,
  useMediaQuery,
  useTheme,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  KeyboardArrowUp,
  KeyboardArrowDown,
  Add,
  Remove,
  Fullscreen,
  FitScreen,
  Menu as MenuIcon,
  Close,
  CloudUpload,
  Delete,
  Download,
  Draw,
  Edit,
} from '@mui/icons-material';
import '../styles/PDFEditor.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const MAX_FILES = 10;

const AnnotatePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  const [pdfFiles, setPdfFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [fieldsByFile, setFieldsByFile] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(0.8);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);
  const [isDownloading, setIsDownloading] = useState(false);

  const activePdf = pdfFiles[activeFileIndex];
  const activeFields = fieldsByFile[activeFileIndex] || [];

  useEffect(() => {
    setLeftSidebarOpen(!isMobile);
    setRightSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isSmall) {
      setZoom(0.5);
    } else if (isMobile) {
      setZoom(0.7);
    } else {
      setZoom(0.8);
    }
  }, [isMobile, isSmall]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFilesOnly = files.filter((f) => f.type === 'application/pdf');

    if (pdfFiles.length + pdfFilesOnly.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setPdfFiles((prev) => [...prev, ...pdfFilesOnly]);
    if (pdfFiles.length === 0 && pdfFilesOnly.length > 0) {
      setActiveFileIndex(0);
    }
  };

  const removeFile = (index) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    setFieldsByFile((prev) => {
      const updated = { ...prev };
      delete updated[index];
      const reindexed = {};
      Object.keys(updated).forEach((key) => {
        const newKey = parseInt(key) > index ? parseInt(key) - 1 : parseInt(key);
        reindexed[newKey] = updated[key];
      });
      return reindexed;
    });
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex((prev) => prev - 1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const addField = (type) => {
    if (!activePdf) {
      alert('Please upload a PDF first');
      return;
    }
    const newField = {
      id: `field_${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === 'DATE' ? 120 : 180,
      height: type === 'DATE' ? 35 : 50,
      pageIndex: currentPage,
      fileIndex: activeFileIndex,
    };
    setFieldsByFile((prev) => ({
      ...prev,
      [activeFileIndex]: [...(prev[activeFileIndex] || []), newField],
    }));
  };

  const updateField = (id, data) => {
    setFieldsByFile((prev) => ({
      ...prev,
      [activeFileIndex]: prev[activeFileIndex].map((f) =>
        f.id === id ? { ...f, ...data } : f
      ),
    }));
  };

  const removeField = (id) => {
    setFieldsByFile((prev) => ({
      ...prev,
      [activeFileIndex]: prev[activeFileIndex].filter((f) => f.id !== id),
    }));
  };

  const handleDownloadAnnotated = async () => {
    if (pdfFiles.length === 0) {
      alert('Please upload at least one PDF');
      return;
    }

    setIsDownloading(true);

    try {
      for (let fileIndex = 0; fileIndex < pdfFiles.length; fileIndex++) {
        const file = pdfFiles[fileIndex];
        const fields = fieldsByFile[fileIndex] || [];

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('fields', JSON.stringify(fields));

        const res = await axios.post(
          'http://127.0.0.1:8000/pdf/metadata-only',
          formData,
          { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `annotated_${file.name}`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getTotalFieldsCount = () => {
    return Object.values(fieldsByFile).reduce(
      (acc, fields) => acc + (fields?.length || 0),
      0
    );
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
  const handleFitWidth = () => setZoom(1);
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const handlePageInputChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= numPages) {
      setCurrentPage(value);
    }
  };

  const LeftSidebar = () => (
    <Box className="editor-left-sidebar">
      <Box className="sidebar-header-section">
        <Typography variant="subtitle2" className="sidebar-section-title">
          Pages
        </Typography>
      </Box>
      <Box className="thumbnail-list">
        {activePdf && numPages ? (
          <Document file={activePdf} loading="">
            {Array.from({ length: numPages }, (_, index) => (
              <Box
                key={index}
                className={`page-thumbnail ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                <Page
                  pageNumber={index + 1}
                  width={80}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
                <span className="page-number">{index + 1}</span>
              </Box>
            ))}
          </Document>
        ) : (
          <Box className="empty-state">
            <Typography variant="caption" color="textSecondary">
              No document loaded
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  const TopToolbar = () => (
    <Box className="editor-toolbar">
      <Box className="toolbar-left">
        {isMobile && (
          <IconButton onClick={() => setLeftSidebarOpen(true)} size="small">
            <MenuIcon />
          </IconButton>
        )}
        <Box className="toolbar-brand">
          <Draw className="brand-icon" />
          <Typography variant="h6" className="brand-title">
            Annotate
          </Typography>
        </Box>
      </Box>

      <Box className="toolbar-center">
        {pdfFiles.length > 0 && (
          <Box className="file-tabs-inline">
            {pdfFiles.map((file, index) => (
              <Chip
                key={index}
                label={file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                onClick={() => {
                  setActiveFileIndex(index);
                  setCurrentPage(1);
                }}
                onDelete={() => removeFile(index)}
                variant={activeFileIndex === index ? 'filled' : 'outlined'}
                color={activeFileIndex === index ? 'primary' : 'default'}
                size="small"
                className="file-chip"
              />
            ))}
          </Box>
        )}
      </Box>

      <Box className="toolbar-right">
        {!isMobile && (
          <Chip
            label={`${getTotalFieldsCount()} fields`}
            size="small"
            color="secondary"
            variant="outlined"
          />
        )}
        {isMobile && (
          <IconButton onClick={() => setRightSidebarOpen(true)} size="small">
            <Edit />
          </IconButton>
        )}
      </Box>
    </Box>
  );

  const PageControls = () => (
    <Box className="page-controls-bar">
      <Box className="controls-group">
        <IconButton
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage <= 1}
          size="small"
        >
          <KeyboardArrowUp />
        </IconButton>
        <IconButton
          onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
          disabled={currentPage >= numPages}
          size="small"
        >
          <KeyboardArrowDown />
        </IconButton>
      </Box>

      <Box className="page-info">
        <TextField
          value={currentPage}
          onChange={handlePageInputChange}
          size="small"
          className="page-input-field"
          inputProps={{ style: { textAlign: 'center', padding: '4px 8px' } }}
        />
        <Typography variant="body2" className="page-total-text">
          / {numPages || 1}
        </Typography>
      </Box>

      <Box className="controls-group zoom-group">
        <IconButton onClick={handleZoomOut} size="small">
          <Remove />
        </IconButton>
        <Typography variant="body2" className="zoom-text">
          {Math.round(zoom * 100)}%
        </Typography>
        <IconButton onClick={handleZoomIn} size="small">
          <Add />
        </IconButton>
      </Box>

      {!isSmall && (
        <>
          <IconButton onClick={handleFitWidth} size="small">
            <FitScreen />
          </IconButton>
          <IconButton onClick={handleFullscreen} size="small">
            <Fullscreen />
          </IconButton>
        </>
      )}
    </Box>
  );

  const RightSidebar = () => (
    <Box className="editor-right-sidebar">
      <Box className="sidebar-header-section">
        <Typography variant="h6" className="sidebar-title">
          Annotate PDF
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setRightSidebarOpen(false)} size="small">
            <Close />
          </IconButton>
        )}
      </Box>

      <Box className="sidebar-info-box">
        <Typography variant="body2">
          Upload PDFs, add signature fields, then download the annotated files for signing.
        </Typography>
      </Box>

      <Box className="sidebar-content">
        <Box className="upload-area">
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="pdf-upload"
            disabled={pdfFiles.length >= MAX_FILES}
          />
          <label htmlFor="pdf-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              startIcon={<CloudUpload />}
              disabled={pdfFiles.length >= MAX_FILES}
              className="upload-button"
            >
              Upload PDF ({pdfFiles.length}/{MAX_FILES})
            </Button>
          </label>
        </Box>

        {pdfFiles.length > 0 && (
          <Box className="files-list">
            <Typography variant="subtitle2" className="section-label">
              Documents
            </Typography>
            {pdfFiles.map((file, index) => (
              <Box
                key={index}
                className={`file-list-item ${activeFileIndex === index ? 'active' : ''}`}
                onClick={() => {
                  setActiveFileIndex(index);
                  setCurrentPage(1);
                }}
              >
                <Typography variant="body2" noWrap className="file-name-text">
                  {file.name}
                </Typography>
                <Box className="file-actions">
                  <Chip
                    size="small"
                    label={`${(fieldsByFile[index] || []).length}`}
                    className="field-badge"
                  />
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Box className="field-tools">
          <Typography variant="subtitle2" className="section-label">
            Add Fields
          </Typography>
          <Box className="field-buttons-grid">
            <Button
              variant="outlined"
              onClick={() => addField('SIGNATURE')}
              className="field-type-btn signature"
              disabled={!activePdf}
            >
              <Box className="field-btn-content">
                <span className="field-icon">✍️</span>
                <span>Signature</span>
              </Box>
            </Button>
            <Button
              variant="outlined"
              onClick={() => addField('INITIAL')}
              className="field-type-btn initial"
              disabled={!activePdf}
            >
              <Box className="field-btn-content">
                <span className="field-icon">🔤</span>
                <span>Initial</span>
              </Box>
            </Button>
            {/* <Button
              variant="outlined"
              onClick={() => addField('DATE')}
              className="field-type-btn date"
              disabled={!activePdf}
            >
              <Box className="field-btn-content">
                <span className="field-icon">📅</span>
                <span>Date</span>
              </Box>
            </Button> */}
          </Box>
        </Box>
      </Box>

      <Box className="sidebar-footer">
        <Button
          variant="contained"
          fullWidth
          onClick={handleDownloadAnnotated}
          disabled={pdfFiles.length === 0 || isDownloading}
          className="primary-action-btn"
          startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
        >
          {isDownloading ? 'Downloading...' : 'Download Annotated'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className="editor-container">
      {isMobile ? (
        <Drawer
          anchor="left"
          open={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          className="mobile-drawer-left"
        >
          <LeftSidebar />
        </Drawer>
      ) : (
        <LeftSidebar />
      )}

      <Box className="editor-main">
        <TopToolbar />

        <Box className="editor-canvas-area">
          {activePdf ? (
            <Box
              className="pdf-wrapper"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              <Box className="pdf-page-wrapper">
                <Document
                  file={activePdf}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <Box className="loading-state">
                      <CircularProgress size={32} />
                      <Typography variant="body2">Loading...</Typography>
                    </Box>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    width={600}
                  />
                </Document>

                <Box className="fields-layer">
                  {activeFields
                    .filter((f) => f.pageIndex === currentPage)
                    .map((field) => (
                      <Rnd
                        key={field.id}
                        scale={zoom}
                        size={{ width: field.width, height: field.height }}
                        position={{ x: field.x, y: field.y }}
                        onDragStop={(e, d) => updateField(field.id, { x: d.x, y: d.y })}
                        onResizeStop={(e, dir, ref, delta, pos) =>
                          updateField(field.id, {
                            width: parseInt(ref.style.width),
                            height: parseInt(ref.style.height),
                            ...pos,
                          })
                        }
                        bounds="parent"
                        className={`draggable-field ${field.type.toLowerCase()}`}
                      >
                        <Box className="field-inner">
                          <Typography variant="caption" className="field-label">
                            {field.type}
                          </Typography>
                          <IconButton
                            size="small"
                            className="field-delete-btn"
                            onClick={() => removeField(field.id)}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      </Rnd>
                    ))}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box className="empty-canvas">
              <CloudUpload className="empty-icon" />
              <Typography variant="h6">Upload PDF to Start</Typography>
              <Typography variant="body2" color="textSecondary">
                Add up to {MAX_FILES} documents for annotation
              </Typography>
              <label htmlFor="pdf-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                  className="empty-upload-btn"
                >
                  Choose Files
                </Button>
              </label>
            </Box>
          )}
        </Box>

        {activePdf && numPages && <PageControls />}
      </Box>

      {isMobile ? (
        <Drawer
          anchor="right"
          open={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          className="mobile-drawer-right"
        >
          <RightSidebar />
        </Drawer>
      ) : (
        <RightSidebar />
      )}
    </Box>
  );
};

export default AnnotatePage;
