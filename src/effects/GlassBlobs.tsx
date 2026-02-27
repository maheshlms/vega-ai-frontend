import React from 'react';

const GlassBlobs: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div className="absolute -top-20 -left-32 w-[520px] h-[520px] bg-blue-400/20 blur-[140px] rounded-full animate-pulse" />
      <div className="absolute top-1/4 right-[-200px] w-[480px] h-[480px] bg-purple-400/20 blur-[160px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-150px] left-1/3 w-[560px] h-[560px] bg-pink-400/20 blur-[180px] rounded-full animate-pulse" />
    </div>
  );
};

export default GlassBlobs;
