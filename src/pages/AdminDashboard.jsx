import axios from 'axios'; // Recommended, or use fetch
import React, { useState, useRef } from 'react';
import PDFViewer from "../components/PDF/PDFViewer";
import DraggableField from "../components/Admin/DraggableField";

const AdminDashboard = ({ pdfFile, setPdfFile, fields, setFields }) => {
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // NEW: active page
    const [isSaving, setIsSaving] = useState(false);
    const containerRef = useRef(null);

    // -------------------------------
    // ADD FIELD (PAGE-AWARE)
    // -------------------------------
    const addField = (type) => {
        const newField = {
            id: `field_${Date.now()}`,
            type,
            x: 50,
            y: 50,
            width: 150,
            height: 60,
            pageIndex: currentPage, // IMPORTANT: bind field to page
        };

        setFields([...fields, newField]);
    };

    // -------------------------------
    // UPDATE FIELD
    // -------------------------------
    const updateField = (id, updatedData) => {
        setFields(
            fields.map((f) =>
                f.id === id ? { ...f, ...updatedData } : f
            )
        );
    };

    // -------------------------------
    // FILE LOAD
    // -------------------------------
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            setCurrentPage(1); // reset page on new upload
            console.log("File loaded:", file.name);
        } else {
            alert("Please select a valid PDF file.");
        }
    };

    // -------------------------------
    // PAGE NAVIGATION
    // -------------------------------
    const goToPrevPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, numPages));
    };

    // -------------------------------
    // SAVE METADATA
    // -------------------------------
    const handleSave = async () => {
        if (!pdfFile || fields.length === 0) {
            alert("Please select a PDF and add at least one field.");
            return;
        }

        setIsSaving(true);

        const formData = new FormData();
        formData.append('pdf', pdfFile);
        formData.append('fields', JSON.stringify(fields)); // includes pageIndex

        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/pdf/metadata-only',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    responseType: 'blob',
                }
            );

            const originalName = pdfFile.name;
            const lastDotIndex = originalName.lastIndexOf('.');

            let downloadName;
            if (lastDotIndex !== -1) {
                downloadName =
                    originalName.substring(0, lastDotIndex) +
                    "_meta" +
                    originalName.substring(lastDotIndex);
            } else {
                downloadName = originalName + "_meta";
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', downloadName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            if (error.response?.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errObj = JSON.parse(reader.result);
                        alert("Error: " + (errObj.detail || "Server failed"));
                    } catch {
                        alert("Unexpected server error.");
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                console.error("Save Error:", error);
                alert("Network error or server offline.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    // -------------------------------
    // RENDER
    // -------------------------------
    return (
        <div className="admin-container">
            <header className="toolbar">
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                />

                <button onClick={() => addField("SIGNATURE")} disabled={!pdfFile}>
                    + Add Signature
                </button>

                <button onClick={() => addField("INITIAL")} disabled={!pdfFile}>
                    + Add Initial
                </button>

                <button
                    onClick={handleSave}
                    className="save-btn"
                    disabled={fields.length === 0 || isSaving}
                >
                    {isSaving ? "Processing..." : "Save Layout & Download"}
                </button>
            </header>

            {/* PAGE CONTROLS */}
            {pdfFile && numPages && (
                <div className="page-controls">
                    <button onClick={goToPrevPage} disabled={currentPage === 1}>
                        ◀ Prev
                    </button>

                    <span>
                        Page {currentPage} of {numPages}
                    </span>

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === numPages}
                    >
                        Next ▶
                    </button>
                </div>
            )}

            <div className="workspace">
                {pdfFile && (
                    <div className="pdf-page-container" ref={containerRef}>
                        <PDFViewer
                            pdfFile={pdfFile}
                            pageNumber={currentPage} // IMPORTANT
                            onDocumentLoadSuccess={({ numPages }) =>
                                setNumPages(numPages)
                            }
                        />

                        <div className="annotation-layer">
                            {fields
                                .filter(
                                    (field) =>
                                        field.pageIndex === currentPage
                                )
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
