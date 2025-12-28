import React, { useState } from "react";
import axios from "axios";
import PDFViewer from "../components/PDF/PDFViewer";
import SignaturePadModal from "./SignaturePadModal";

const UserSigning = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [fields, setFields] = useState([]);
    const [signatures, setSignatures] = useState({}); // { field_id: base64_string }
    const [activeField, setActiveField] = useState(null); // Field user clicked on
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Upload file and fetch metadata from your CURL endpoint logic
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPdfFile(file);

        const formData = new FormData();
        formData.append("pdf", file);

        try {
            const res = await axios.post("http://127.0.0.1:8000/pdf/read-metadata", formData);
            if (res.data.fields) setFields(res.data.fields);
        } catch (err) {
            alert("Failed to read PDF metadata");
        }
    };

    // 2. Final Submit to "apply-signature"
    const handleFinalSubmit = async () => {
        if (Object.keys(signatures).length < fields.length) {
            alert("Please sign all boxes before finishing.");
            return;
        }

        setIsProcessing(true);
        const finalFields = fields.map(f => ({
            id: f.id,
            type: f.type,
            coords: { x: f.x, y: f.y, w: f.width, h: f.height },
            base64: signatures[f.id]
        }));

        const formData = new FormData();
        formData.append("pdf", pdfFile);
        formData.append("fields", JSON.stringify(finalFields));

        try {
            const res = await axios.post("http://127.0.0.1:8000/pdf/apply-signature", formData, { responseType: 'blob' });
            
            // Download the final signed file
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', pdfFile.name.replace(".pdf", "_signed.pdf"));
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Error applying signature");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="user-signing-page">
            <header style={{ padding: '10px', background: '#eee', display: 'flex', gap: '10px' }}>
                <input type="file" onChange={handleFileUpload} accept=".pdf" />
                <button 
                    onClick={handleFinalSubmit} 
                    disabled={isProcessing}
                    style={{ background: 'blue', color: 'white' }}
                >
                    {isProcessing ? "Generating PDF..." : "Sign & Download Final"}
                </button>
            </header>

            <div style={{ position: 'relative', marginTop: '20px' }}>
                {pdfFile && <PDFViewer pdfFile={pdfFile} />}
                
                {/* Overlay layer for metadata boxes */}
                {fields.map(field => (
                    <div
                        key={field.id}
                        onClick={() => setActiveField(field)}
                        style={{
                            position: 'absolute',
                            left: field.x,
                            top: field.y,
                            width: field.width,
                            height: field.height,
                            border: signatures[field.id] ? '2px solid green' : '2px dashed #007bff',
                            backgroundColor: 'transparent',
                            // backgroundColor: signatures[field.id] ? 'rgba(0,255,0,0.1)' : 'rgba(0,123,255,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {signatures[field.id] ? (
                            <img src={signatures[field.id]} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        ) : (
                            <span style={{ fontSize: '10px', color: '#007bff' }}>Click to {field.type}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* The Popup */}
            {activeField && (
                <SignaturePadModal 
                    field={activeField} 
                    onClose={() => setActiveField(null)}
                    onSave={(base64) => {
                        setSignatures({ ...signatures, [activeField.id]: base64 });
                        setActiveField(null);
                    }}
                />
            )}
        </div>
    );
};

export default UserSigning;