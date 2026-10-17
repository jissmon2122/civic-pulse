import React from 'react';

interface PulseLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const PulseLogo: React.FC<PulseLogoProps> = ({
  className = '',
  size = 32,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Map Pin with Heartbeat Pulse Center */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary transition-transform hover:scale-105"
        >
          {/* Map Pin Outer Path */}
          <path
            d="M16 2C9.925 2 5 6.925 5 13C5 20.875 16 30 16 30C16 30 27 20.875 27 13C27 6.925 22.075 2 16 2Z"
            fill="currentColor"
          />
          {/* Heartbeat Pulse Line Cutout */}
          <path
            d="M9 13.5H12.5L14 9.5L16.5 17L18.5 12L20 13.5H23"
            stroke="#FAFAF7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-heading font-extrabold tracking-tight text-text-primary text-xl leading-none">
            CIVIC<span className="text-primary font-normal ml-1">PULSE</span>
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-text-secondary mt-0.5">
            Daylight Civic
          </span>
        </div>
      )}
    </div>
  );
};
