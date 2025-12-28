import React, { useRef } from "react";
import PDFViewer from "../components/PDF/PDFViewer";
import SignaturePad from "../components/User/SignaturePad";

const UserSigning = ({ pdfFile, fields }) => {
  // Store multiple signature refs in an object
  const sigRefs = useRef({});

  const handleFinalize = () => {
    const signatureData = fields.map(field => {
      const canvas = sigRefs.current[field.id];
      if (canvas && !canvas.isEmpty()) {
        return {
          id: field.id,
          type: field.type,
          coords: { x: field.x, y: field.y, w: field.width, h: field.height },
          base64: canvas.getTrimmedCanvas().toDataURL('image/png')
        };
      }
      return null;
    }).filter(Boolean);

    if (signatureData.length < fields.length) {
      alert("Please sign all required fields before finishing.");
      return;
    }

    console.log("Payload for Python Backend:", signatureData);
    // Here you would: axios.post('/api/sign', { pdf: pdfFile, signatures: signatureData })
  };

  return (
    <div className="user-container">
      <div className="user-header">
        <h3>Please Review and Sign</h3>
        <button onClick={handleFinalize} className="finalize-btn">Sign & Finish</button>
      </div>

      <div className="workspace">
        {pdfFile ? (
          <div className="pdf-page-container">
            <PDFViewer pdfFile={pdfFile} />

            <div className="annotation-layer">
              {fields.map((field) => (
                <SignaturePad
                  key={field.id}
                  field={field}
                  ref={(el) => (sigRefs.current[field.id] = el)}
                  onClear={() => sigRefs.current[field.id]?.clear()}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="error-state">No document loaded. Please go to Admin first.</div>
        )}
      </div>
    </div>
  );
};

export default UserSigning;