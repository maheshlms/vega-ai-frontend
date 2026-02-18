import React, { useState, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

const MouseMove: React.FC = () => {
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30"
      style={{
        background: `radial-gradient(35px at ${pos.x}px ${pos.y}px,
          rgba(99,112,241,0.5),
          transparent 80%)`
      }}
    />
  );
};

export default MouseMove;
