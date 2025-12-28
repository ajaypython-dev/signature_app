import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = forwardRef(({ field, onClear }, ref) => {
  return (
    <div
      className="signature-box"
      style={{
        position: 'absolute',
        left: field.x,
        top: field.y,
        width: field.width,
        height: field.height,
        zIndex: 20,
      }}
    >
      {/* <SignatureCanvas
        ref={ref}
        canvasProps={{
          width: field.width,
          height: field.height,
          className: 'sigCanvas',
         // Ensure CSS removes outlines/borders if needed
        }}
        backgroundColor="rgba(255,255,255,0.6)" // Slight semi-transparent white background
      /> */}

    <SignatureCanvas
  ref={ref}
  /* 1. PEN DYNAMICS - These create the "fountain pen" look */
  penColor="navy"
  velocityFilterWeight={0.1} // Low value = high smoothing (eliminates jitters)
  minWidth={0.5}               // Slightly thicker minimum for better visibility
  maxWidth={1.2}               // Higher range allows for beautiful pressure variance
  throttle={16}                // 16ms = ~60fps (perfect for high-refresh touchpads)
  minDistance={0}              // Captures even the smallest dots/movements
  
  /* 2. EVENT HANDLING */
  onEnd={() => {
    console.log('User finished signing!');
    // Optional: Auto-save the signature here
  }}
  
  /* 3. CANVAS & TOUCH OPTIMIZATION */
  canvasProps={{
    width: field.width,
    height: field.height,
    className: 'sigCanvas',
    style: { 
    //   border: '1px solid #ccc', 
      borderRadius: '4px',
      touchAction: 'none',     // CRITICAL: Stops the page from scrolling while signing
      cursor: 'crosshair'      // Better UX for precision drawing
    }
  }}
   backgroundColor="rgba(255,255,255,0.6)" 
/>
      
      {/* Small floating action buttons */}
      <div style={{ position: 'absolute', right: 0, bottom: -25, display: 'flex', gap: '5px' }}>
        <button 
          onClick={onClear}
          style={{ 
            fontSize: '10px', 
            padding: '2px 5px', 
            cursor: 'pointer',
            background: '#d33333ff',
            color: 'white',
            border: 'none',
            borderRadius: '3px'
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
});

export default SignaturePad;