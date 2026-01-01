// import React, { useState } from "react";
// import axios from "axios";
// import PDFViewer from "../components/PDF/PDFViewer";
// import SignaturePadModal from "./SignaturePadModal";
// import "../styles/SecureSign.css"; // Ensure global CSS is imported

// const UserSigning = () => {
//     const [pdfFiles, setPdfFiles] = useState([]);
//     const [activePdfIndex, setActivePdfIndex] = useState(0);
//     const [fieldsByPdf, setFieldsByPdf] = useState({});
//     const [signaturesByPdf, setSignaturesByPdf] = useState({});

//     const [activeField, setActiveField] = useState(null);
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [numPages, setNumPages] = useState(null);

//     // UI State for Zoom and Jump Page
//     const [zoom, setZoom] = useState(1.0);
//     const [jumpPage, setJumpPage] = useState("");

//     const activePdf = pdfFiles[activePdfIndex];
//     const activeFields = fieldsByPdf[activePdfIndex] || [];
//     const activeSignatures = signaturesByPdf[activePdfIndex] || {};

//     // --- EXISTING LOGIC PRESERVED ---
//     const handleFileUpload = async (e) => {
//         const files = Array.from(e.target.files).filter((f) => f.type === "application/pdf");
//         if (!files.length) return;

//         setPdfFiles(files);
//         setActivePdfIndex(0);
//         setCurrentPage(1);
//         setFieldsByPdf({});
//         setSignaturesByPdf({});

//         files.forEach(async (file, index) => {
//             const formData = new FormData();
//             formData.append("pdf", file);
//             try {
//                 const res = await axios.post("http://127.0.0.1:8000/pdf/read-metadata", formData);
//                 if (res.data.fields) {
//                     setFieldsByPdf((prev) => ({ ...prev, [index]: res.data.fields }));
//                 }
//             } catch {
//                 console.error(`Failed to read metadata for ${file.name}`);
//             }
//         });
//     };

//     const handleJumpPage = (e) => {
//         e.preventDefault();
//         const p = parseInt(jumpPage);
//         if (p > 0 && p <= numPages) {
//             setCurrentPage(p);
//             setJumpPage("");
//         }
//     };

//     const handleSignAndDownload = async () => {
//         if (!activePdf) return;
//         if (Object.keys(activeSignatures).length < activeFields.length) {
//             alert("Please sign all fields before downloading.");
//             return;
//         }
//         setIsProcessing(true);
//         const finalFields = activeFields.map((f) => ({
//             id: f.id, type: f.type, pageIndex: f.pageIndex,
//             coords: { x: f.x, y: f.y, w: f.width, h: f.height },
//             base64: activeSignatures[f.id],
//         }));

//         const formData = new FormData();
//         formData.append("pdf", activePdf);
//         formData.append("fields", JSON.stringify(finalFields));

//         try {
//             const res = await axios.post("http://127.0.0.1:8000/pdf/apply-signature", formData, { responseType: "blob" });
//             const url = URL.createObjectURL(new Blob([res.data]));
//             const link = document.createElement("a");
//             link.href = url;
//             link.download = activePdf.name.replace(".pdf", "_signed.pdf");
//             link.click();
//             URL.revokeObjectURL(url);
//         } catch {
//             alert("Failed to apply signature.");
//         } finally {
//             setIsProcessing(false);
//         }
//     };

//     return (
//         <div className="user-signing-page">
//             {/* SIDEBAR */}
//             <aside className="sidebar">
//                 <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Sign Documents</h2>
                
//                 <input type="file" accept=".pdf" multiple onChange={handleFileUpload} id="user-upload" hidden />
//                 <label htmlFor="user-upload" className="primary-btn-label">
//                     Upload Documents
//                 </label>

//                 <div className="file-list">
//                     {pdfFiles.map((file, index) => (
//                         <div 
//                             key={index} 
//                             className={`file-card ${index === activePdfIndex ? 'active' : ''}`}
//                             onClick={() => { setActivePdfIndex(index); setCurrentPage(1); }}
//                         >
//                             <span className="file-name">{file.name}</span>
//                             {Object.keys(signaturesByPdf[index] || {}).length === (fieldsByPdf[index] || []).length && pdfFiles.length > 0 && (
//                                 <span style={{ color: 'green', fontSize: '10px' }}>✓ Ready</span>
//                             )}
//                         </div>
//                     ))}
//                 </div>

//                 <div style={{ marginTop: 'auto' }}>
//                     <button 
//                         className="download-btn"
//                         onClick={handleSignAndDownload}
//                         disabled={!activePdf || isProcessing}
//                     >
//                         {isProcessing ? "Processing..." : "Finish & Download"}
//                     </button>
//                 </div>
//             </aside>

//             {/* MAIN WORKSPACE */}
//             <div className="workspace">
//                 <header className="toolbar">
//                     {/* Zoom Group */}
//                     <div className="controls-group">
//                         <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>−</button>
//                         <span style={{ minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
//                         <button onClick={() => setZoom(z => Math.min(z + 0.2, 2.0))}>+</button>
//                     </div>

//                     {/* Navigation Group */}
//                     <div className="controls-group">
//                         <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>◀</button>
//                         <form onSubmit={handleJumpPage}>
//                             <input 
//                                 type="number" 
//                                 className="page-input"
//                                 placeholder={`${currentPage} / ${numPages || 1}`} 
//                                 value={jumpPage} 
//                                 onChange={(e) => setJumpPage(e.target.value)} 
//                             />
//                         </form>
//                         <button onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))} disabled={currentPage === numPages}>▶</button>
//                     </div>

//                     <div className="status-indicator">
//                         {activeFields.length > 0 ? 
//                             `${Object.keys(activeSignatures).length} of ${activeFields.length} signed` : 
//                             "No fields found"}
//                     </div>
//                 </header>

//                 <div className="pdf-canvas-container">
//                     {activePdf ? (
//                         <div className="zoom-wrapper" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
//                             <div style={{ position: "relative" }}>
//                                 <PDFViewer
//                                     pdfFile={activePdf}
//                                     pageNumber={currentPage}
//                                     onDocumentLoadSuccess={({ numPages }) => setNumPages(numPages)}
//                                 />
                                
//                                 {/* Signature Interaction Layer */}
//                                 <div className="interaction-layer" style={{ position: "absolute", top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
//                                     {activeFields
//                                         .filter((f) => f.pageIndex === currentPage)
//                                         .map((field) => (
//                                             <div
//                                                 key={field.id}
//                                                 onClick={() => setActiveField(field)}
//                                                 className={`sign-box ${activeSignatures[field.id] ? 'signed' : 'unsigned'}`}
//                                                 style={{
//                                                     position: "absolute",
//                                                     left: field.x,
//                                                     top: field.y,
//                                                     width: field.width,
//                                                     height: field.height,
//                                                     pointerEvents: 'auto'
//                                                 }}
//                                             >
//                                                 {activeSignatures[field.id] ? (
//                                                     <img src={activeSignatures[field.id]} alt="sig" />
//                                                 ) : (
//                                                     <span>Click to {field.type}</span>
//                                                 )}
//                                             </div>
//                                         ))}
//                                 </div>
//                             </div>
//                         </div>
//                     ) : (
//                         <div className="empty-state">Please upload a PDF to begin signing</div>
//                     )}
//                 </div>
//             </div>

//             {activeField && (
//                 <SignaturePadModal
//                     field={activeField}
//                     onClose={() => setActiveField(null)}
//                     onSave={(base64) => {
//                         setSignaturesByPdf((prev) => ({
//                             ...prev,
//                             [activePdfIndex]: {
//                                 ...(prev[activePdfIndex] || {}),
//                                 [activeField.id]: base64
//                             }
//                         }));
//                         setActiveField(null);
//                     }}
//                 />
//             )}
//         </div>
//     );
// };

// export default UserSigning;


import React, { useState } from "react";
import axios from "axios";
import PDFViewer from "../components/PDF/PDFViewer";
import SignaturePadModal from "./SignaturePadModal";
import {
    Box, Button, Grid, Paper, List, ListItem, ListItemText, CircularProgress,
    IconButton, ButtonGroup, Typography, LinearProgress, Tooltip
} from '@mui/material';
import { Add, Remove, NavigateBefore, NavigateNext } from '@mui/icons-material';

const UserSigning = () => {
    const [pdfFiles, setPdfFiles] = useState([]);
    const [activePdfIndex, setActivePdfIndex] = useState(0);
    const [fieldsByPdf, setFieldsByPdf] = useState({});
    const [signaturesByPdf, setSignaturesByPdf] = useState({});
    const [activeField, setActiveField] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(null);
    const [zoom, setZoom] = useState(1.0);

    const activePdf = pdfFiles[activePdfIndex];
    const activeFields = fieldsByPdf[activePdfIndex] || [];
    const activeSignatures = signaturesByPdf[activePdfIndex] || {};

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        setPdfFiles(files);
        files.forEach(async (file, index) => {
            const formData = new FormData();
            formData.append("pdf", file);
            const res = await axios.post("http://127.0.0.1:8000/pdf/read-metadata", formData);
            if (res.data.fields) {
                setFieldsByPdf(prev => ({ ...prev, [index]: res.data.fields }));
            }
        });
    };

    const handleFinish = async () => {
        setIsProcessing(true);
        const finalFields = activeFields.map(f => ({
            ...f, coords: { x: f.x, y: f.y, w: f.width, h: f.height },
            base64: activeSignatures[f.id]
        }));
        const formData = new FormData();
        formData.append("pdf", activePdf);
        formData.append("fields", JSON.stringify(finalFields));
        try {
            const res = await axios.post("http://127.0.0.1:8000/pdf/apply-signature", formData, { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.download = "signed_document.pdf";
            link.click();
        } catch (error) {
            console.error("Error signing document:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const signingProgress = activeFields.length > 0 ? (Object.keys(activeSignatures).length / activeFields.length) * 100 : 0;

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
                <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Documents</Typography>
                    <Button variant="contained" component="label" fullWidth>
                        Upload Documents
                        <input type="file" multiple hidden onChange={handleFileUpload} />
                    </Button>
                    <List sx={{ my: 2 }}>
                        {pdfFiles.map((f, i) => (
                            <ListItem
                                button
                                key={i}
                                selected={i === activePdfIndex}
                                onClick={() => setActivePdfIndex(i)}
                            >
                                <ListItemText primary={f.name} />
                            </ListItem>
                        ))}
                    </List>
                    {activeFields.length > 0 && (
                        <Box sx={{ my: 2 }}>
                            <Typography variant="body2">Signing Progress</Typography>
                            <LinearProgress variant="determinate" value={signingProgress} />
                        </Box>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFinish}
                        disabled={isProcessing || !activePdf || signingProgress < 100}
                        fullWidth
                    >
                        {isProcessing ? <CircularProgress size={24} /> : "Finish & Download"}
                    </Button>
                </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
                <Paper elevation={3} sx={{ position: 'relative', height: '80vh', overflow: 'auto' }}>
                    {activePdf ? (
                        <Box sx={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                            <Box sx={{ position: "relative" }}>
                                <PDFViewer pdfFile={activePdf} pageNumber={currentPage} onDocumentLoadSuccess={({ numPages }) => setNumPages(numPages)} />
                                {activeFields.filter(f => f.pageIndex === currentPage).map(field => (
                                    <Tooltip title={activeSignatures[field.id] ? "Signed" : `Click to ${field.type}`} key={field.id}>
                                        <Box
                                            className="sign-box"
                                            onClick={() => setActiveField(field)}
                                            sx={{
                                                left: field.x, top: field.y, width: field.width, height: field.height,
                                                border: activeSignatures[field.id] ? '2px solid green' : '2px dashed red',
                                                position: 'absolute',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {activeSignatures[field.id] && <img src={activeSignatures[field.id]} alt="signature" style={{ width: '100%', height: '100%' }} />}
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography variant="h6">Please upload a PDF to begin signing</Typography>
                        </Box>
                    )}
                </Paper>
                <Paper elevation={3} sx={{ p: 1, mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ButtonGroup>
                        <IconButton onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage <= 1}>
                            <NavigateBefore />
                        </IconButton>
                        <Button disabled>{currentPage} / {numPages}</Button>
                        <IconButton onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))} disabled={currentPage >= numPages}>
                            <NavigateNext />
                        </IconButton>
                    </ButtonGroup>
                    <ButtonGroup sx={{ ml: 2 }}>
                        <IconButton onClick={() => setZoom(z => z + 0.1)}>
                            <Add />
                        </IconButton>
                        <IconButton onClick={() => setZoom(z => z - 0.1)}>
                            <Remove />
                        </IconButton>
                    </ButtonGroup>
                </Paper>
            </Grid>
            {activeField && (
                <SignaturePadModal
                    field={activeField}
                    onClose={() => setActiveField(null)}
                    onSave={(b64) => {
                        setSignaturesByPdf(prev => ({
                            ...prev, [activePdfIndex]: { ...(prev[activePdfIndex] || {}), [activeField.id]: b64 }
                        }));
                        setActiveField(null);
                    }}
                />
            )}
        </Grid>
    );
};

export default UserSigning;