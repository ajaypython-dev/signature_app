import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePadModal = ({ field, onSave, onClose }) => {
    const sigRef = useRef(null);

    const handleApply = () => {
        if (sigRef.current.isEmpty()) return;
        // PNG format preserves the transparency
        const base64Data = sigRef.current.getTrimmedCanvas().toDataURL('image/png');
        onSave(base64Data);
    };

    return (
        <div className="modal-overlay" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
            <div style={{background:'white', padding:'20px', borderRadius:'12px', width:'500px'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <h3>Sign {field.type}</h3>
                    <button onClick={onClose}>✕</button>
                </div>
                <div style={{border:'1px solid #ddd', background:'#fafafa'}}>
                    <SignatureCanvas 
                        ref={sigRef}
                        penColor="black"
                        backgroundColor="rgba(255,255,255,0)" // 🔑 TRANSPARENT BACKGROUND
                        canvasProps={{ width: 460, height: 200, className: 'sigCanvas' }}
                    />
                </div>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px'}}>
                    <button onClick={() => sigRef.current.clear()}>Clear</button>
                    <button onClick={handleApply} style={{background:'var(--primary)', color:'white'}}>Apply Signature</button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePadModal;