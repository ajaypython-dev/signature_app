import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AnnotatePage from "./pages/AnnotatePage";
import SignPage from "./pages/SignPage";
import "./styles/PDFEditor.css";

import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AnnotatePage />} />
        <Route path="/sign" element={<SignPage />} />
      </Routes>
    </Router>
  );
}
