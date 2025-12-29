import axios from 'axios';
import React, { useState, useRef } from 'react';
import PDFViewer from "../components/PDF/PDFViewer";
import DraggableField from "../components/Admin/DraggableField";

const AdminDashboard = () => {
    const [pdfFiles, setPdfFiles] = useState([]);            // NEW
    const [activePdfIndex, setActivePdfIndex] = useState(0); // NEW

    const [fieldsByPdf, setFieldsByPdf] = useState({});      // NEW
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const containerRef = useRef(null);

    const activePdf = pdfFiles[activePdfIndex];
    const activeFields = fieldsByPdf[activePdfIndex] || [];

    // -------------------------------
    // FILE LOAD (MULTI)
    // -------------------------------
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).filter(
            (f) => f.type === "application/pdf"
        );

        if (!files.length) {
            alert("Please upload valid PDF files.");
            return;
        }

        setPdfFiles(files);
        setActivePdfIndex(0);
        setCurrentPage(1);
        setFieldsByPdf({});
    };

    // -------------------------------
    // ADD FIELD (PAGE + PDF AWARE)
    // -------------------------------
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

    // -------------------------------
    // UPDATE FIELD
    // -------------------------------
    const updateField = (id, updatedData) => {
        setFieldsByPdf((prev) => ({
            ...prev,
            [activePdfIndex]: prev[activePdfIndex].map((f) =>
                f.id === id ? { ...f, ...updatedData } : f
            ),
        }));
    };

    // -------------------------------
    // PAGE NAVIGATION
    // -------------------------------
    const goToPrevPage = () => {
        setCurrentPage((p) => Math.max(p - 1, 1));
    };

    const goToNextPage = () => {
        setCurrentPage((p) => Math.min(p + 1, numPages));
    };

    // -------------------------------
    // SAVE METADATA (PER PDF)
    // -------------------------------
    const handleSave = async () => {
        if (!activePdf || activeFields.length === 0) {
            alert("Please add at least one field.");
            return;
        }

        setIsSaving(true);

        const formData = new FormData();
        formData.append("pdf", activePdf);
        formData.append("fields", JSON.stringify(activeFields));

        try {
            const res = await axios.post(
                "http://127.0.0.1:8000/pdf/metadata-only",
                formData,
                { responseType: "blob" }
            );

            const url = URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.download = activePdf.name.replace(".pdf", "_meta.pdf");
            link.click();
            URL.revokeObjectURL(url);

        } catch (e) {
            alert("Failed to save metadata");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="admin-container">
            <header className="toolbar">
                <input
                    type="file"
                    accept="application/pdf"
                    multiple                     // 🔑 MULTI FILE
                    onChange={handleFileChange}
                />

                <button onClick={() => addField("SIGNATURE")} disabled={!activePdf}>
                    + Add Signature
                </button>

                <button onClick={() => addField("INITIAL")} disabled={!activePdf}>
                    + Add Initial
                </button>

                <button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Processing..." : "Save Layout"}
                </button>
            </header>

            {/* PDF SELECTOR */}
            {pdfFiles.length > 1 && (
                <div className="pdf-tabs">
                    {pdfFiles.map((file, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setActivePdfIndex(index);
                                setCurrentPage(1);
                            }}
                            style={{
                                fontWeight: index === activePdfIndex ? "bold" : "normal"
                            }}
                        >
                            {file.name}
                        </button>
                    ))}
                </div>
            )}

            {/* PAGE CONTROLS */}
            {activePdf && numPages && (
                <div className="page-controls">
                    <button onClick={goToPrevPage} disabled={currentPage === 1}>
                        ◀ Prev
                    </button>
                    <span>
                        Page {currentPage} / {numPages}
                    </span>
                    <button onClick={goToNextPage} disabled={currentPage === numPages}>
                        Next ▶
                    </button>
                </div>
            )}

            <div className="workspace">
                {activePdf && (
                    <div className="pdf-page-container" ref={containerRef}>
                        <PDFViewer
                            pdfFile={activePdf}
                            pageNumber={currentPage}
                            onDocumentLoadSuccess={({ numPages }) =>
                                setNumPages(numPages)
                            }
                        />

                        <div className="annotation-layer">
                            {activeFields
                                .filter((f) => f.pageIndex === currentPage)
                                .map((field) => (
                                    <DraggableField
                                        key={field.id}
                                        field={field}
                                        onUpdate={updateField}
                                    />
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
