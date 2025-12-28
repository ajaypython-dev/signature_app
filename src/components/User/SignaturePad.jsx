import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ field, onSave, onClose }) => {
    const sigRef = useRef(null);

    const handleApply = () => {
        if (sigRef.current.isEmpty()) {
            alert("Please provide a signature first.");
            return;
        }
        // getTrimmedCanvas removes the empty space around the signature for a professional look
        const base64Data = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
        onSave(base64Data);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h3 style={{ margin: 0 }}>Add {field.type}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>&times;</button>
                </div>

                <div style={styles.canvasWrapper}>
                    <SignatureCanvas
                        ref={sigRef}
                        /* Your Pen Dynamics */
                        penColor="navy"
                        velocityFilterWeight={0.1}
                        minWidth={0.8}
                        maxWidth={2.5}
                        throttle={16}
                        
                        canvasProps={{
                            width: 500, // Large canvas for high-quality signatures
                            height: 250,
                            className: 'sigCanvas',
                            style: { 
                                touchAction: 'none', 
                                cursor: 'crosshair', 
                                width: '100%', 
                                display: 'block',
                                background: 'transparent'
                            }
                        }}
                        backgroundColor="#fff"
                    />
                </div>

                <div style={styles.footer}>
                    <button 
                        onClick={() => sigRef.current.clear()} 
                        style={styles.secondaryBtn}
                    >
                        Clear Canvas
                    </button>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
                        <button onClick={handleApply} style={styles.primaryBtn}>Apply to Document</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999
    },
    modal: {
        background: '#fff',
        padding: '24px',
        borderRadius: '12px',
        width: '550px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
    },
    header: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '15px'
    },
    canvasWrapper: {
        border: '2px solid #eaeaea',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        overflow: 'hidden'
    },
    footer: {
        display: 'flex', justifyContent: 'space-between', marginTop: '20px'
    },
    primaryBtn: {
        background: '#007bff', color: '#fff', border: 'none',
        padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
    },
    secondaryBtn: {
        background: '#f8f9fa', color: '#333', border: '1px solid #ddd',
        padding: '10px 20px', borderRadius: '6px', cursor: 'pointer'
    },
    cancelBtn: {
        background: 'none', border: 'none', color: '#666', cursor: 'pointer'
    },
    closeBtn: {
        fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', color: '#999'
    }
};

export default SignaturePad;