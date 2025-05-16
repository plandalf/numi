import React from 'react';

interface DragAdjusterProps {
  children: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
}

export const DragAdjuster: React.FC<DragAdjusterProps> = ({
  children,
  value,
  onChange,
  min = 0,
  max = 50,
  step = 1,
  formatValue = (val) => `${val}px`,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startValue, setStartValue] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartValue(value);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const pixelsPerStep = 10; // Adjust this value to control sensitivity
    const steps = Math.round(deltaX / pixelsPerStep);
    const newValue = Math.max(min, Math.min(max, startValue + steps * step));
    
    onChange(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startX, startValue, value, min, max, step]);

  return (
    <div 
      onMouseDown={handleMouseDown} 
      style={{ cursor: 'ew-resize' }}
      className="!cursor-resize inline-block"
    >
      {children}
    </div>
  );
}; 