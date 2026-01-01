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
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Edit,
  PanTool,
  TextFields,
  Image,
  Create,
  AutoFixHigh,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Add,
  Remove,
  Fullscreen,
  FitScreen,
  Menu as MenuIcon,
  ChevronRight,
  Close,
} from '@mui/icons-material';
import FileUploader from '../components/Admin/FileUploader';
import '../styles/PDFEditor.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFEditor = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [pdfFiles, setPdfFiles] = useState([]);
  const [activePdfIndex, setActivePdfIndex] = useState(0);
  const [fieldsByPdf, setFieldsByPdf] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pageThumbnails, setPageThumbnails] = useState(null);
  const [zoom, setZoom] = useState(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMode, setActiveMode] = useState('edit');
  const [activeTool, setActiveTool] = useState('pan');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);

  const activePdf = pdfFiles[activePdfIndex];
  const activeFields = fieldsByPdf[activePdfIndex] || [];

  useEffect(() => {
    setLeftSidebarOpen(!isMobile);
    setRightSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleFilesChange = (files) => {
    setPdfFiles(files);
    if (files.length === 0) {
      setActivePdfIndex(0);
      setNumPages(null);
      setPageThumbnails([]);
    }
    if (activePdfIndex >= files.length) {
      setActivePdfIndex(files.length > 0 ? files.length - 1 : 0);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const addField = (type) => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: 150,
      height: 60,
      pageIndex: currentPage,
    };
    setFieldsByPdf((prev) => ({
      ...prev,
      [activePdfIndex]: [...(prev[activePdfIndex] || []), newField],
    }));
  };

  const updateField = (id, data) => {
    setFieldsByPdf((prev) => ({
      ...prev,
      [activePdfIndex]: prev[activePdfIndex].map((f) =>
        f.id === id ? { ...f, ...data } : f
      ),
    }));
  };

  const removeField = (id) => {
    setFieldsByPdf((prev) => ({
      ...prev,
      [activePdfIndex]: prev[activePdfIndex].filter((f) => f.id !== id),
    }));
  };

  const handleSaveMetadata = async () => {
    if (!activePdf) return;
    setIsSaving(true);
    const formData = new FormData();
    formData.append('pdf', activePdf);
    formData.append('fields', JSON.stringify(activeFields));

    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/pdf/metadata-only',
        formData,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activePdf.name}_meta.pdf`;
      link.click();
    } catch (err) {
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
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

  const tools = [
    { id: 'pan', icon: <PanTool />, label: 'Pan' },
    { id: 'text', icon: <TextFields />, label: 'Add Text' },
    { id: 'image', icon: <Image />, label: 'Add Image' },
    { id: 'draw', icon: <Create />, label: 'Draw' },
    { id: 'erase', icon: <AutoFixHigh />, label: 'Erase' },
  ];

  const LeftSidebar = () => (
    <Box className="pdf-editor-left-sidebar">
      <Box className="thumbnail-container">
        {activePdf && numPages && (
          <Document file={activePdf} loading="">
            {Array.from({ length: numPages }, (_, index) => (
              <Box
                key={index}
                className={`thumbnail-wrapper ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                <Page
                  pageNumber={index + 1}
                  width={100}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
                <Typography className="thumbnail-page-number">
                  {index + 1}
                </Typography>
              </Box>
            ))}
          </Document>
        )}
        {!activePdf && (
          <Box className="no-pdf-message">
            <Typography variant="body2" color="textSecondary">
              Upload a PDF to see page thumbnails
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  const TopToolbar = () => (
    <Box className="pdf-editor-toolbar">
      {isMobile && (
        <IconButton onClick={() => setLeftSidebarOpen(true)} className="menu-btn">
          <MenuIcon />
        </IconButton>
      )}

      <Box className="toolbar-center">
        <Box className="mode-toggle">
          <Button
            className={`mode-btn ${activeMode === 'annotate' ? 'active' : ''}`}
            onClick={() => setActiveMode('annotate')}
            startIcon={<Create />}
          >
            Annotate
          </Button>
          <Button
            className={`mode-btn edit-mode ${activeMode === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveMode('edit')}
            startIcon={<Edit />}
          >
            Edit
          </Button>
        </Box>

        <Box className="tool-divider" />

        <Box className="tools-group">
          {tools.map((tool) => (
            <Tooltip key={tool.id} title={tool.label}>
              <IconButton
                className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => setActiveTool(tool.id)}
              >
                {tool.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box className="toolbar-right">
        <Typography variant="h6" className="toolbar-title">
          Edit PDF
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setRightSidebarOpen(true)}>
            <ChevronRight />
          </IconButton>
        )}
      </Box>
    </Box>
  );

  const PageControls = () => (
    <Box className="page-controls">
      <Box className="page-nav">
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

      <Box className="page-indicator">
        <TextField
          value={currentPage}
          onChange={handlePageInputChange}
          size="small"
          className="page-input"
          inputProps={{ min: 1, max: numPages, style: { textAlign: 'center' } }}
        />
        <Typography className="page-total">/ {numPages || 1}</Typography>
      </Box>

      <Box className="zoom-controls">
        <IconButton onClick={handleZoomOut} size="small">
          <Remove />
        </IconButton>
        <IconButton onClick={handleZoomIn} size="small">
          <Add />
        </IconButton>
      </Box>

      <Typography className="zoom-percent">{Math.round(zoom * 100)}%</Typography>

      <IconButton onClick={handleFitWidth} size="small">
        <FitScreen />
      </IconButton>

      <IconButton onClick={handleFullscreen} size="small">
        <Fullscreen />
      </IconButton>
    </Box>
  );

  const RightSidebar = () => (
    <Box className="pdf-editor-right-sidebar">
      <Typography variant="h5" className="sidebar-title">
        Edit PDF
      </Typography>

      <Box className="sidebar-instruction">
        <Typography variant="body2">
          Use the toolbar to modify or add text, upload images, and annotate with ease.
        </Typography>
      </Box>

      <Box className="sidebar-content">
        <FileUploader
          onFilesChange={handleFilesChange}
          onFileSelect={setActivePdfIndex}
          activeFileIndex={activePdfIndex}
        />

        <Box className="field-buttons">
          <Button
            variant="outlined"
            fullWidth
            onClick={() => addField('SIGNATURE')}
            className="field-btn"
          >
            + Signature Box
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => addField('INITIAL')}
            className="field-btn"
          >
            + Initial Box
          </Button>
          {/* <Button
            variant="outlined"
            fullWidth
            onClick={() => addField('DATE')}
            className="field-btn"
          >
            + Date Field
          </Button> */}
          <Button
            variant="outlined"
            fullWidth
            onClick={() => addField('TEXT')}
            className="field-btn"
          >
            + Text Field
          </Button>
        </Box>
      </Box>

      <Box className="sidebar-footer">
        <Button
          variant="contained"
          fullWidth
          onClick={handleSaveMetadata}
          disabled={isSaving || !activePdf}
          className="edit-pdf-btn"
          endIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <ChevronRight />}
        >
          {isSaving ? 'Saving...' : 'Edit PDF'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box className="pdf-editor-container">
      {isMobile ? (
        <Drawer
          anchor="left"
          open={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          className="mobile-drawer"
        >
          <Box className="drawer-header">
            <Typography variant="h6">Pages</Typography>
            <IconButton onClick={() => setLeftSidebarOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <LeftSidebar />
        </Drawer>
      ) : (
        <LeftSidebar />
      )}

      <Box className="pdf-editor-main">
        <TopToolbar />

        <Box className="pdf-viewer-container">
          {activePdf ? (
            <Box
              className="pdf-document-wrapper"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              <Box className="pdf-page-container">
                <Document
                  file={activePdf}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <Box className="pdf-loading">
                      <CircularProgress />
                      <Typography>Loading PDF...</Typography>
                    </Box>
                  }
                  error={
                    <Box className="pdf-error">
                      <Typography color="error">Failed to load PDF</Typography>
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

                <Box className="fields-overlay">
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
                        className="field-box"
                      >
                        <Box className="field-content">
                          <Typography variant="caption">{field.type}</Typography>
                          <IconButton
                            size="small"
                            className="field-remove-btn"
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
            <Box className="no-pdf-placeholder">
              <Typography variant="h6" color="textSecondary">
                Upload a PDF to get started
              </Typography>
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
          className="mobile-drawer"
        >
          <Box className="drawer-header">
            <Typography variant="h6">Edit PDF</Typography>
            <IconButton onClick={() => setRightSidebarOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <RightSidebar />
        </Drawer>
      ) : (
        <RightSidebar />
      )}
    </Box>
  );
};

export default PDFEditor;
