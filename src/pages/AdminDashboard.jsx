import React, { useState, useRef } from "react";
import PDFViewer from "../components/PDF/PDFViewer";
import DraggableField from "../components/Admin/DraggableField";

const AdminDashboard = ({ pdfFile, setPdfFile, fields, setFields }) => {
  const [numPages, setNumPages] = useState(null);
  const containerRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPdfFile(URL.createObjectURL(file));
  };

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

  const handleSave = () => {
    if (!containerRef.current) return;
    
    // Calculate scaling if necessary for backend (standardizing to PDF points)
    const { offsetWidth, offsetHeight } = containerRef.current;
    const exportData = {
      canvasWidth: offsetWidth,
      canvasHeight: offsetHeight,
      fields: fields
    };
    
    console.log("Configuration Exported:", exportData);
    alert("Layout Saved! Ready for User Signing.");
  };

  return (
    <div className="admin-container">
      <header className="toolbar">
        <input type="file" onChange={handleFileChange} accept="application/pdf" />
        <button onClick={() => addField("SIGNATURE")} disabled={!pdfFile}>+ Add Signature</button>
        <button onClick={() => addField("INITIAL")} disabled={!pdfFile}>+ Add Initial</button>
        <button onClick={handleSave} className="save-btn" disabled={fields.length === 0}>Save Layout</button>
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