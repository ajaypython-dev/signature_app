import axios from 'axios'; // Recommended, or use fetch
import React, { useState, useRef } from 'react';
import PDFViewer from "../components/PDF/PDFViewer";
import DraggableField from "../components/Admin/DraggableField";


const AdminDashboard = ({ pdfFile, setPdfFile, fields, setFields }) => {
    const [numPages, setNumPages] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const containerRef = useRef(null);

    // const handleFileChange = (e) => {
    //     const file = e.target.files[0];
    //     if (file) setPdfFile(URL.createObjectURL(file));
    // };

    const addField = (type) => {
        const newField = {
            id: `field_${Date.now()}`,
            type,
            x: 50,
            y: 50,
            width: 150,
            height: 60,
            pageIndex: 1,
        };
        setFields([...fields, newField]);
    };

    const updateField = (id, updatedData) => {
        setFields(fields.map((f) => (f.id === id ? { ...f, ...updatedData } : f)));
    };

    // Capture the file from the input
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            console.log("File loaded:", file.name);
        } else {
            alert("Please select a valid PDF file.");
        }
    };
    

    // const handleSave = async () => {
    //     if (!pdfFile || fields.length === 0) {
    //         alert("Please select a PDF and add at least one field.");
    //         return;
    //     }

    //     setIsSaving(true);
    //     const formData = new FormData();
        
    //     // Match these keys EXACTLY with the Backend parameters
    //     formData.append('pdf', pdfFile); 
    //     formData.append('fields', JSON.stringify(fields));

    //     try {
    //         const response = await axios.post('http://127.0.0.1:8000/pdf/metadata-only', formData, {
    //             headers: { 'Content-Type': 'multipart/form-data' },
    //             responseType: 'blob', // Necessary for PDF downloads
    //         });

    //         // Trigger Download
    //         const url = window.URL.createObjectURL(new Blob([response.data]));
    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.setAttribute('download', 'document_with_meta.pdf');
    //         document.body.appendChild(link);
    //         link.click();
    //         link.remove();
    //         window.URL.revokeObjectURL(url);

    //     } catch (error) {
    //         // Handle 422 and other errors wrapped in Blobs
    //         if (error.response?.data instanceof Blob) {
    //             const reader = new FileReader();
    //             reader.onload = () => {
    //                 const errObj = JSON.parse(reader.result);
    //                 console.error("Detail:", errObj.detail);
    //                 alert("Error: " + JSON.stringify(errObj.detail));
    //             };
    //             reader.readAsText(error.response.data);
    //         } else {
    //             console.error("Save Error:", error);
    //         }
    //     } finally {
    //         setIsSaving(false);
    //     }
    // };

      const handleSave = async () => {
            if (!pdfFile || fields.length === 0) {
                alert("Please select a PDF and add at least one field.");
                return;
            }
    
            setIsSaving(true);
            const formData = new FormData();
            
            // Match these keys EXACTLY with the FastAPI parameters
            formData.append('pdf', pdfFile); 
            formData.append('fields', JSON.stringify(fields));
    
            try {
                const response = await axios.post('http://127.0.0.1:8000/pdf/metadata-only', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    responseType: 'blob', // Critical for binary file responses
                });
    
                // --- FILENAME LOGIC ---
                // Extract original name (e.g., "my_document.pdf")
                const originalName = pdfFile.name;
                const lastDotIndex = originalName.lastIndexOf('.');
                
                let downloadName;
                if (lastDotIndex !== -1) {
                    // Insert "_meta" before the extension
                    downloadName = 
                        originalName.substring(0, lastDotIndex) + 
                        "_meta" + 
                        originalName.substring(lastDotIndex);
                } else {
                    // If file has no extension
                    downloadName = originalName + "_meta";
                }
    
                // --- TRIGGER DOWNLOAD ---
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', downloadName); 
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
    
            } catch (error) {
                // Handle error response which is wrapped in a Blob due to responseType: 'blob'
                if (error.response?.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errObj = JSON.parse(reader.result);
                            alert("Error: " + (errObj.detail || "Server failed to process metadata"));
                        } catch (e) {
                            alert("An unexpected error occurred.");
                        }
                    };
                    reader.readAsText(error.response.data);
                } else {
                    console.error("Save Error:", error);
                    alert("Network error or server is offline.");
                }
            } finally {
                setIsSaving(false);
            }
        };
    

    return (
        <div className="admin-container">
            <header className="toolbar">
                {/* <input type="file" onChange={handleFileChange} accept="application/pdf" /> */}
                <input type="file" accept="application/pdf" onChange={handleFileChange} />
                <button onClick={() => addField("SIGNATURE")} disabled={!pdfFile}>+ Add Signature</button>
                <button onClick={() => addField("INITIAL")} disabled={!pdfFile}>+ Add Initial</button>
                {/* <button onClick={handleSave} className="save-btn" disabled={fields.length === 0}>Save Layout & Download </button> */}
                <button
                    onClick={handleSave}
                    className="save-btn"
                    disabled={fields.length === 0 || isSaving}
                >
                    {isSaving ? "Processing..." : "Save Layout & Download"}
                </button>
            </header>

            <div className="workspace">
                {pdfFile && (
                    <div className="pdf-page-container" ref={containerRef}>
                        <PDFViewer pdfFile={pdfFile} onDocumentLoadSuccess={({ numPages }) => setNumPages(numPages)} />

                        <div className="annotation-layer">
                            {fields.map((field) => (
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