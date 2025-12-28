import React from 'react';
import { Rnd } from 'react-rnd';

const DraggableField = ({ field, onUpdate }) => {
  return (
    <Rnd
      size={{ width: field.width, height: field.height }}
      position={{ x: field.x, y: field.y }}
      onDragStop={(e, d) => {
        // Update X/Y coordinates on drag stop
        onUpdate(field.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        // Update Width/Height + position adjustments on resize stop
        onUpdate(field.id, {
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          ...position,
        });
      }}
      bounds="parent" // Restricts movement to inside the PDF wrapper
      className="field-box" // Styles defined in SecureSign.css
    >
      {/* Label inside the box */}
      <span style={{ pointerEvents: 'none' }}>
        {field.type}
      </span>
    </Rnd>
  );
};

export default DraggableField;