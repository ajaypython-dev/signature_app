import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import UserSigning from "./pages/UserSigning";
import "./styles/SecureSign.css";

// Configure PDF Worker (Essential for react-pdf)
import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function App1() {
  // Shared State (Simulating Database)
  const [pdfFile, setPdfFile] = useState(null); // Base64 or Blob
  const [fields, setFields] = useState([]); // Array of coordinate objects

  return (
    <Router>
      <nav style={{ padding: 15, background: "#333", color: "#fff" }}>
        <Link to="/" style={{ color: "#fff", marginRight: 20 }}>Admin Dashboard</Link>
        <Link to="/sign" style={{ color: "#fff" }}>User Signing Interface</Link>
      </nav>

      <div style={{ padding: 20 }}>
        <Routes>
          <Route 
            path="/" 
            element={<AdminDashboard pdfFile={pdfFile} setPdfFile={setPdfFile} fields={fields} setFields={setFields} />} 
          />
          <Route 
            path="/sign" 
            element={<UserSigning pdfFile={pdfFile} fields={fields} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}