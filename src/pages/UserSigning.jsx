import React, { useState } from "react";
import axios from "axios";
import PDFViewer from "../components/PDF/PDFViewer";
import SignaturePadModal from "./SignaturePadModal";

const UserSigning = () => {
    const [pdfFiles, setPdfFiles] = useState([]);                 // NEW
    const [activePdfIndex, setActivePdfIndex] = useState(0);     // NEW

    const [fieldsByPdf, setFieldsByPdf] = useState({});           // NEW
    const [signaturesByPdf, setSignaturesByPdf] = useState({});   // NEW

    const [activeField, setActiveField] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(null);

    const activePdf = pdfFiles[activePdfIndex];
    const activeFields = fieldsByPdf[activePdfIndex] || [];
    const activeSignatures = signaturesByPdf[activePdfIndex] || {};

    // -------------------------------
    // Upload MULTIPLE PDFs
    // -------------------------------
    const handleFileUpload = async (e) => {
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
        setSignaturesByPdf({});

        // Read metadata for each PDF
        files.forEach(async (file, index) => {
            const formData = new FormData();
            formData.append("pdf", file);

            try {
                const res = await axios.post(
                    "http://127.0.0.1:8000/pdf/read-metadata",
                    formData
                );

                if (res.data.fields) {
                    setFieldsByPdf((prev) => ({
                        ...prev,
                        [index]: res.data.fields,
                    }));
                }
            } catch {
                alert(`Failed to read metadata for ${file.name}`);
            }
        });
    };

    // -------------------------------
    // Page Navigation
    // -------------------------------
    const goPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const goNextPage = () => setCurrentPage((p) => Math.min(p + 1, numPages));

    // -------------------------------
    // Sign & Download ACTIVE PDF
    // -------------------------------
    const handleSignAndDownload = async () => {
        if (!activePdf) return;

        if (Object.keys(activeSignatures).length < activeFields.length) {
            alert("Please sign all fields before downloading.");
            return;
        }

        setIsProcessing(true);

        const finalFields = activeFields.map((f) => ({
            id: f.id,
            type: f.type,
            pageIndex: f.pageIndex,
            coords: {
                x: f.x,
                y: f.y,
                w: f.width,
                h: f.height,
            },
            base64: activeSignatures[f.id],
        }));

        const formData = new FormData();
        formData.append("pdf", activePdf);
        formData.append("fields", JSON.stringify(finalFields));

        try {
            const res = await axios.post(
                "http://127.0.0.1:8000/pdf/apply-signature",
                formData,
                { responseType: "blob" }
            );

            const url = URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.download = activePdf.name.replace(".pdf", "_signed.pdf");
            link.click();
            URL.revokeObjectURL(url);

        } catch {
            alert("Failed to apply signature.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="user-signing-page">
            <header style={{ padding: 10, background: "#eee", display: "flex", gap: 10 }}>
                <input type="file" accept=".pdf" multiple onChange={handleFileUpload} />

                <button
                    onClick={handleSignAndDownload}
                    disabled={!activePdf || isProcessing}
                    style={{ background: "blue", color: "white" }}
                >
                    {isProcessing ? "Processing..." : "Sign & Download"}
                </button>
            </header>

            {/* PDF TABS */}
            {pdfFiles.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
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
                <div style={{ marginTop: 10 }}>
                    <button onClick={goPrevPage} disabled={currentPage === 1}>
                        ◀ Prev
                    </button>
                    <span style={{ margin: "0 10px" }}>
                        Page {currentPage} / {numPages}
                    </span>
                    <button onClick={goNextPage} disabled={currentPage === numPages}>
                        Next ▶
                    </button>
                </div>
            )}

            <div style={{ position: "relative", marginTop: 20 }}>
                {activePdf && (
                    <PDFViewer
                        pdfFile={activePdf}
                        pageNumber={currentPage}
                        onDocumentLoadSuccess={({ numPages }) =>
                            setNumPages(numPages)
                        }
                    />
                )}

                {activeFields
                    .filter((f) => f.pageIndex === currentPage)
                    .map((field) => (
                        <div
                            key={field.id}
                            onClick={() => setActiveField(field)}
                            style={{
                                position: "absolute",
                                left: field.x,
                                top: field.y,
                                width: field.width,
                                height: field.height,
                                border: activeSignatures[field.id]
                                    ? "2px solid green"
                                    : "2px dashed #007bff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            {activeSignatures[field.id] ? (
                                <img
                                    src={activeSignatures[field.id]}
                                    style={{ maxWidth: "100%", maxHeight: "100%" }}
                                />
                            ) : (
                                <span style={{ fontSize: 10, color: "#007bff" }}>
                                    Click to {field.type}
                                </span>
                            )}
                        </div>
                    ))}
            </div>

            {activeField && (
                <SignaturePadModal
                    field={activeField}
                    onClose={() => setActiveField(null)}
                    onSave={(base64) => {
                        setSignaturesByPdf((prev) => ({
                            ...prev,
                            [activePdfIndex]: {
                                ...(prev[activePdfIndex] || {}),
                                [activeField.id]: base64
                            }
                        }));
                        setActiveField(null);
                    }}
                />
            )}
        </div>
    );
};

export default UserSigning;
