import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePadModal = ({ field, onSave, onClose }) => {
    const sigRef = useRef(null);

    const handleSave = () => {
        if (sigRef.current.isEmpty()) {
            alert("Please provide a signature first.");
            return;
        }
        // getTrimmedCanvas removes the whitespace around the signature
        const base64 = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
        onSave(base64);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3>Sign {field.type}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                <div style={styles.canvasContainer}>
                    <SignatureCanvas
                        ref={sigRef}
                        penColor="navy"
                        velocityFilterWeight={0.1}
                        minWidth={0.8}
                        maxWidth={2.5}
                        throttle={16}
                        canvasProps={{
                            width: 500, // Fixed large size for better quality
                            height: 250,
                            className: 'sigCanvas',
                            style: { touchAction: 'none', cursor: 'crosshair', width: '100%' }
                        }}
                        backgroundColor="white"
                    />
                </div>

                <div style={styles.footer}>
                    <button onClick={() => sigRef.current.clear()} style={styles.clearBtn}>Clear</button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                        <button onClick={handleSave} style={styles.saveBtn}>Apply Signature</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { background: '#f4f4f4', padding: '20px', borderRadius: '8px', width: '550px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    canvasContainer: { border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'white' },
    footer: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' },
    saveBtn: { background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
    clearBtn: { background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
    cancelBtn: { background: 'transparent', color: '#333', border: '1px solid #ccc', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
    closeBtn: { fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }
};

export default SignaturePadModal;