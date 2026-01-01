import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';
import SignatureCanvas from 'react-signature-canvas';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
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
  Check,
  Download,
  Refresh,
  Draw,
} from '@mui/icons-material';
import '../styles/PDFEditor.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const SignPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const signatureRef = useRef(null);

  const [pdfFiles, setPdfFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [fieldsByFile, setFieldsByFile] = useState({});
  const [signaturesByField, setSignaturesByField] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [zoom, setZoom] = useState(0.8);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [activeFieldType, setActiveFieldType] = useState('SIGNATURE');
  const [isDownloading, setIsDownloading] = useState(false);
  const [dateValue, setDateValue] = useState(new Date().toLocaleDateString());

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

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    const pdfFilesOnly = files.filter((f) => f.type === 'application/pdf');

    setPdfFiles(pdfFilesOnly);
    
    // Extract fields from PDF metadata
    for (let i = 0; i < pdfFilesOnly.length; i++) {
      try {
        const formData = new FormData();
        formData.append('pdf', pdfFilesOnly[i]);
        
        const res = await axios.post('http://127.0.0.1:8000/pdf/read-metadata', formData);
        if (res.data && res.data.fields) {
          setFieldsByFile((prev) => ({
            ...prev,
            [i]: res.data.fields,
          }));
        }
      } catch (err) {
        console.log('No embedded fields found, using empty');
        setFieldsByFile((prev) => ({
          ...prev,
          [i]: [],
        }));
      }
    }

    if (pdfFilesOnly.length > 0) {
      setActiveFileIndex(0);
    }
  };

  const removeFile = (index) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
    setFieldsByFile((prev) => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    setSignaturesByField((prev) => {
      const updated = { ...prev };
      const fieldsToRemove = fieldsByFile[index] || [];
      fieldsToRemove.forEach((f) => delete updated[f.id]);
      return updated;
    });
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex((prev) => prev - 1);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const openSignatureDialog = (fieldId, fieldType) => {
    setActiveFieldId(fieldId);
    setActiveFieldType(fieldType);
    setSignatureDialogOpen(true);
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const saveSignature = () => {
    if (activeFieldType === 'DATE') {
      setSignaturesByField((prev) => ({
        ...prev,
        [activeFieldId]: { type: 'date', value: dateValue },
      }));
    } else if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureImage = signatureRef.current.toDataURL('image/png');
      setSignaturesByField((prev) => ({
        ...prev,
        [activeFieldId]: { type: 'image', value: signatureImage },
      }));
    }
    setSignatureDialogOpen(false);
    setActiveFieldId(null);
  };

  const getSignedFieldsCount = () => {
    return Object.keys(signaturesByField).length;
  };

  const getTotalFieldsCount = () => {
    return Object.values(fieldsByFile).reduce(
      (acc, fields) => acc + (fields?.length || 0),
      0
    );
  };

  const getProgress = () => {
    const total = getTotalFieldsCount();
    if (total === 0) return 0;
    return Math.round((getSignedFieldsCount() / total) * 100);
  };

  const isAllSigned = () => {
    const totalFields = getTotalFieldsCount();
    return totalFields > 0 && getSignedFieldsCount() >= totalFields;
  };

  const handleDownload = async () => {
    if (!isAllSigned()) {
      alert('Please complete all signature fields before downloading');
      return;
    }

    setIsDownloading(true);

    try {
      for (let fileIndex = 0; fileIndex < pdfFiles.length; fileIndex++) {
        const file = pdfFiles[fileIndex];
        const fields = fieldsByFile[fileIndex] || [];
        const fieldsWithSignatures = fields.map((field) => {
          const signData = signaturesByField[field.id];
          return {
            ...field,
            coords: { x: field.x, y: field.y, w: field.width, h: field.height },
            base64: signData?.type === 'image' ? signData.value : null,
            dateValue: signData?.type === 'date' ? signData.value : null,
          };
        });

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('fields', JSON.stringify(fieldsWithSignatures));

        const res = await axios.post(
          'http://127.0.0.1:8000/pdf/apply-signature',
          formData,
          { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `signed_${file.name}`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
      alert('Download failed');
    } finally {
      setIsDownloading(false);
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
    <Box className="editor-toolbar sign-mode">
      <Box className="toolbar-left">
        {isMobile && (
          <IconButton onClick={() => setLeftSidebarOpen(true)} size="small">
            <MenuIcon />
          </IconButton>
        )}
        <Box className="toolbar-brand">
          <Draw className="brand-icon sign" />
          <Typography variant="h6" className="brand-title sign">
            Sign
          </Typography>
        </Box>
      </Box>

      <Box className="toolbar-center">
        {pdfFiles.length > 0 && (
          <Box className="file-tabs-inline">
            {pdfFiles.map((file, index) => {
              const fileFields = fieldsByFile[index] || [];
              const signedCount = fileFields.filter((f) => signaturesByField[f.id]).length;
              const isComplete = fileFields.length > 0 && signedCount === fileFields.length;

              return (
                <Chip
                  key={index}
                  label={file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                  onClick={() => {
                    setActiveFileIndex(index);
                    setCurrentPage(1);
                  }}
                  onDelete={() => removeFile(index)}
                  variant={activeFileIndex === index ? 'filled' : 'outlined'}
                  color={isComplete ? 'success' : activeFileIndex === index ? 'primary' : 'default'}
                  size="small"
                  className="file-chip"
                  icon={isComplete ? <Check fontSize="small" /> : undefined}
                />
              );
            })}
          </Box>
        )}
      </Box>

      <Box className="toolbar-right">
        {!isMobile && (
          <Box className="progress-inline">
            <Typography variant="caption">
              {getSignedFieldsCount()}/{getTotalFieldsCount()}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={getProgress()}
              className="progress-bar-inline"
            />
          </Box>
        )}
        {isMobile && (
          <IconButton onClick={() => setRightSidebarOpen(true)} size="small">
            <Check />
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
    <Box className="editor-right-sidebar sign-mode">
      <Box className="sidebar-header-section">
        <Typography variant="h6" className="sidebar-title sign">
          Sign Documents
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setRightSidebarOpen(false)} size="small">
            <Close />
          </IconButton>
        )}
      </Box>

      <Box className="sidebar-info-box sign">
        <Typography variant="body2">
          Upload annotated PDFs, click on each field to sign, then download completed documents.
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
            id="pdf-upload-sign"
          />
          <label htmlFor="pdf-upload-sign">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              startIcon={<CloudUpload />}
              className="upload-button"
            >
              Upload Annotated PDFs
            </Button>
          </label>
        </Box>

        {pdfFiles.length > 0 && (
          <>
            <Box className="progress-section">
              <Typography variant="subtitle2" className="section-label">
                Signing Progress
              </Typography>
              <Box className="progress-bar-section">
                <LinearProgress
                  variant="determinate"
                  value={getProgress()}
                  className="main-progress-bar"
                />
                <Typography variant="body2" className="progress-text">
                  {getSignedFieldsCount()} of {getTotalFieldsCount()} fields completed
                </Typography>
              </Box>
            </Box>

            <Box className="files-list">
              <Typography variant="subtitle2" className="section-label">
                Documents
              </Typography>
              {pdfFiles.map((file, index) => {
                const fields = fieldsByFile[index] || [];
                const signedCount = fields.filter((f) => signaturesByField[f.id]).length;
                const isComplete = fields.length > 0 && signedCount === fields.length;

                return (
                  <Box
                    key={index}
                    className={`file-list-item ${activeFileIndex === index ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                    onClick={() => {
                      setActiveFileIndex(index);
                      setCurrentPage(1);
                    }}
                  >
                    <Box className="file-info">
                      {isComplete && <Check fontSize="small" className="complete-icon" />}
                      <Typography variant="body2" noWrap className="file-name-text">
                        {file.name}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${signedCount}/${fields.length}`}
                      color={isComplete ? 'success' : 'default'}
                      className="status-badge"
                    />
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Box>

      <Box className="sidebar-footer">
        <Button
          variant="contained"
          fullWidth
          onClick={handleDownload}
          disabled={!isAllSigned() || isDownloading || pdfFiles.length === 0}
          className="primary-action-btn success"
          startIcon={isDownloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
        >
          {isDownloading ? 'Downloading...' : 'Download Signed'}
        </Button>
      </Box>
    </Box>
  );

  const SignatureDialog = () => (
    <Dialog
      open={signatureDialogOpen}
      onClose={() => setSignatureDialogOpen(false)}
      maxWidth="sm"
      fullWidth
      className="signature-dialog"
    >
      <DialogTitle className="dialog-title">
        {activeFieldType === 'DATE' ? 'Select Date' : activeFieldType === 'INITIAL' ? 'Add Your Initials' : 'Add Your Signature'}
        <IconButton
          onClick={() => setSignatureDialogOpen(false)}
          className="dialog-close-btn"
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent className="dialog-content">
        {activeFieldType === 'DATE' ? (
          <TextField
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            fullWidth
            className="date-input"
          />
        ) : (
          <Box className="canvas-container">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'signature-pad',
              }}
              backgroundColor="#fff"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions className="dialog-actions">
        {activeFieldType !== 'DATE' && (
          <Button onClick={clearSignature} startIcon={<Refresh />} className="clear-btn">
            Clear
          </Button>
        )}
        <Button onClick={saveSignature} variant="contained" startIcon={<Check />} className="apply-btn">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box className="editor-container sign-page">
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
                    .map((field) => {
                      const signData = signaturesByField[field.id];
                      const isSigned = !!signData;

                      return (
                        <Box
                          key={field.id}
                          className={`signable-field ${field.type.toLowerCase()} ${isSigned ? 'signed' : ''}`}
                          style={{
                            position: 'absolute',
                            left: field.x,
                            top: field.y,
                            width: field.width,
                            height: field.height,
                          }}
                          onClick={() => !isSigned && openSignatureDialog(field.id, field.type)}
                        >
                          {isSigned ? (
                            signData.type === 'date' ? (
                              <Typography className="date-display">{signData.value}</Typography>
                            ) : (
                              <img src={signData.value} alt="Signature" className="signature-img" />
                            )
                          ) : (
                            <Box className="field-placeholder">
                              <Typography variant="caption">
                                Click to {field.type.toLowerCase()}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box className="empty-canvas">
              <CloudUpload className="empty-icon" />
              <Typography variant="h6">Upload Annotated PDFs</Typography>
              <Typography variant="body2" color="textSecondary">
                Upload documents that have been prepared for signing
              </Typography>
              <label htmlFor="pdf-upload-sign">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                  className="empty-upload-btn success"
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

      <SignatureDialog />
    </Box>
  );
};

export default SignPage;
