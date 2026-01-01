# SecureSign Flow - Project Structure

```
sign_app/
├── public/                          # Static assets
├── src/
│   ├── components/
│   │   ├── Admin/
│   │   │   └── DraggableField.jsx   # Draggable signature field positioning
│   │   ├── PDF/
│   │   │   └── PDFViewer.jsx        # PDF rendering component (react-pdf)
│   │   └── User/
│   │       └── SignaturePad.jsx     # Signature drawing canvas
│   │
│   ├── pages/
│   │   ├── AdminDashboard.jsx       # Admin: Upload PDF & define signature fields
│   │   ├── SignaturePadModal.jsx    # Modal wrapper for signature capture
│   │   └── UserSigning.jsx          # User: View PDF, sign fields, download
│   │
│   ├── styles/
│   │   └── SecureSign.css           # Application styles
│   │
│   ├── App.js                       # Router & shared state management
│   ├── index.js                     # React entry point
│   └── index.css                    # Global styles
│
├── package.json                     # Dependencies & scripts
└── .gitignore
```

## Key Files

| File | Purpose |
|------|---------|
| `App.js` | React Router setup, PDF.js worker config, shared state |
| `AdminDashboard.jsx` | Upload PDF, position draggable signature boxes |
| `UserSigning.jsx` | Multi-PDF upload, pagination, signature capture & download |
| `PDFViewer.jsx` | Renders PDF pages using `react-pdf` |
| `DraggableField.jsx` | `react-rnd` based draggable/resizable field |
| `SignaturePad.jsx` | `react-signature-canvas` for drawing signatures |
| `SignaturePadModal.jsx` | Modal popup containing the signature pad |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/pdf/read-metadata` | POST | Extract signature field coordinates from PDF |
| `/pdf/apply-signature` | POST | Embed signatures into PDF, return signed blob |
