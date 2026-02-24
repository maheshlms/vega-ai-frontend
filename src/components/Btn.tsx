import React from 'react';

interface BtnProps {
  value: string | React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

const Btn: React.FC<BtnProps> = ({ value, className = "", onClick, disabled = false, type = 'button', style }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`
        text-white font-semibold relative overflow-hidden
        transition-all duration-200
        hover:scale-[1.04] active:scale-[0.96]
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <span className="relative z-10">{value}</span>

      {/* shimmer overlay */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
        opacity-0 hover:opacity-100"
        style={{
          backgroundSize: "200% 100%",
          animation: "shimmer 2s linear infinite"
        }}
      />
    </button>
  );
};

export default Btn;