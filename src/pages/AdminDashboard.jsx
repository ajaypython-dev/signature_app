import React, { useState } from 'react';
import axios from 'axios';
import { Rnd } from 'react-rnd';
import PDFViewer from "../components/PDF/PDFViewer";
import {
    Box, Button, Grid, Paper, List, ListItem, ListItemText, CircularProgress,
    IconButton, ButtonGroup, Typography
} from '@mui/material';
import FileUploader from '../components/Admin/FileUploader';
import { Add, Remove, NavigateBefore, NavigateNext } from '@mui/icons-material';

const AdminDashboard = () => {
    const [pdfFiles, setPdfFiles] = useState([]);
    const [activePdfIndex, setActivePdfIndex] = useState(0);
    const [fieldsByPdf, setFieldsByPdf] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(null);
    const [zoom, setZoom] = useState(1.0);
    const [isSaving, setIsSaving] = useState(false);

    const activePdf = pdfFiles[activePdfIndex];
    const activeFields = fieldsByPdf[activePdfIndex] || [];

    const handleFilesChange = (files) => {
        setPdfFiles(files);
        if (files.length === 0) {
            setActivePdfIndex(0);
        }
        if (activePdfIndex >= files.length) {
            setActivePdfIndex(files.length > 0 ? files.length - 1 : 0);
        }
    };

    const addField = (type) => {
        const newField = {
            id: `field_${Date.now()}`,
            type, x: 50, y: 50, width: 150, height: 60, pageIndex: currentPage
        };
        setFieldsByPdf(prev => ({
            ...prev, [activePdfIndex]: [...(prev[activePdfIndex] || []), newField]
        }));
    };

    const updateField = (id, data) => {
        setFieldsByPdf(prev => ({
            ...prev,
            [activePdfIndex]: prev[activePdfIndex].map(f => f.id === id ? { ...f, ...data } : f)
        }));
    };

    const handleSaveMetadata = async () => {
        if (!activePdf) return;
        setIsSaving(true);
        const formData = new FormData();
        formData.append("pdf", activePdf);
        formData.append("fields", JSON.stringify(activeFields));

        try {
            const res = await axios.post("http://127.0.0.1:8000/pdf/metadata-only", formData, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.download = `${activePdf.name}_meta.pdf`;
            link.click();
        } catch (err) { alert("Save failed"); }
        finally { setIsSaving(false); }
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
                <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Admin Panel</Typography>
                    <FileUploader
                        onFilesChange={handleFilesChange}
                        onFileSelect={setActivePdfIndex}
                        activeFileIndex={activePdfIndex}
                    />
                    <Box>
                        <Button onClick={() => addField("SIGNATURE")} variant="outlined" s sx={{
                            mt: 'auto',              // Pushes it to the bottom of a flex container
                            mb: 2,                   // Bottom margin
                            width: '100%',           // Makes it span the sidebar width
                            py: 1.5,                 // Extra vertical padding for a "chunkier" feel
                            borderRadius: '8px',     // Modern rounded corners
                            textTransform: 'none',   // Prevents all-caps (looks more like a SaaS app)
                            fontWeight: '600',       // Bold text for the main action
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', // Soft glow
                            '&:hover': {
                                backgroundColor: '#4338ca', // Darker shade on hover
                                boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                            }
                        }}  >+ Signature Box</Button>
                        <Button onClick={() => addField("INITIAL")} variant="outlined" sx={{
                            mt: 'auto',              // Pushes it to the bottom of a flex container
                            mb: 2,                   // Bottom margin
                            width: '100%',           // Makes it span the sidebar width
                            py: 1.5,                 // Extra vertical padding for a "chunkier" feel
                            borderRadius: '8px',     // Modern rounded corners
                            textTransform: 'none',   // Prevents all-caps (looks more like a SaaS app)
                            fontWeight: '600',       // Bold text for the main action
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', // Soft glow
                            '&:hover': {
                                backgroundColor: '#4338ca', // Darker shade on hover
                                boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                            }
                        }}>+ Initial Box</Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveMetadata}
                            disabled={isSaving || !activePdf}
                            // fullWidth
                            sx={{
                                mt: 'auto',              // Pushes it to the bottom of a flex container
                                mb: 2,                   // Bottom margin
                                width: '100%',           // Makes it span the sidebar width
                                py: 1.5,                 // Extra vertical padding for a "chunkier" feel
                                borderRadius: '8px',     // Modern rounded corners
                                textTransform: 'none',   // Prevents all-caps (looks more like a SaaS app)
                                fontWeight: '600',       // Bold text for the main action
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', // Soft glow
                                '&:hover': {
                                    backgroundColor: '#4338ca', // Darker shade on hover
                                    boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                                }
                            }}
                        >
                            {isSaving ? <CircularProgress size={24} /> : "Save Metadata"}
                        </Button>
                    </Box>
                </Paper>
            </Grid>
            <Grid item xs={12} md={9}>
                <Paper elevation={3} sx={{ position: 'relative', height: '100%', overflow: 'auto' }}>
                    {activePdf && (
                        <Box sx={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                            <Box sx={{ position: "relative" }}>
                                <PDFViewer pdfFile={activePdf} pageNumber={currentPage} onDocumentLoadSuccess={({ numPages }) => setNumPages(numPages)} />
                                <Box sx={{ position: "absolute", top: 0, left: 0, width: '100%', height: '100%' }}>
                                    {activeFields.filter(f => f.pageIndex === currentPage).map(field => (
                                        <Rnd
                                            key={field.id}
                                            scale={zoom}
                                            size={{ width: field.width, height: field.height }}
                                            position={{ x: field.x, y: field.y }}
                                            onDragStop={(e, d) => updateField(field.id, { x: d.x, y: d.y })}
                                            onResizeStop={(e, dir, ref, delta, pos) => updateField(field.id, {
                                                width: parseInt(ref.style.width),
                                                height: parseInt(ref.style.height),
                                                ...pos
                                            })}
                                            bounds="parent"
                                            className="field-box"
                                        >
                                            {field.type}
                                        </Rnd>
                                    ))}
                                </Box>
                            </Box>
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
        </Grid>
    );
};

export default AdminDashboard;