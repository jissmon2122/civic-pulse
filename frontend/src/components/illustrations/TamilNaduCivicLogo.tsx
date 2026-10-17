import React from 'react';

interface TamilNaduCivicLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'full' | 'compact' | 'symbol';
  theme?: 'light' | 'dark';
}

/**
 * Civic Pulse Official Logo
 * Distinctive combination of the geographical outline of Tamil Nadu (from Chennai down to Kanyakumari,
 * Nilgiris to Point Calimere) integrated with the glowing golden civic pulse line and public service node.
 */
export const TamilNaduCivicLogo: React.FC<TamilNaduCivicLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  variant = 'full',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Tamil Nadu Geographical Silhouette + Civic Service Pulse Symbol */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform hover:scale-105 duration-200"
          role="img"
          aria-label="Civic Pulse Tamil Nadu Emblem"
        >
          <defs>
            {/* Tamil Nadu Regional Maroon / Deep Crimson Gradient */}
            <linearGradient id="tnMaroonGrad" x1="20" y1="10" x2="80" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B1E3F" />
              <stop offset="50%" stopColor="#700B2B" />
              <stop offset="100%" stopColor="#4A051A" />
            </linearGradient>

            {/* Warm Temple Gold Gradient */}
            <linearGradient id="tnGoldGrad" x1="25" y1="50" x2="75" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Glowing Pulse Shadow Filter */}
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#F59E0B" floodOpacity="0.6" />
            </filter>

            {/* Map Shadow Filter */}
            <filter id="tnMapShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Geographical Outline of Tamil Nadu */}
          <path
            d="M 78,13
               C 70,11 58,11 48,15
               C 38,18 30,21 26,26
               C 23,32 21,39 22,46
               C 25,49 27,51 26,54
               C 27,61 31,70 36,80
               C 41,88 45,94 48,97
               C 52,94 56,86 60,78
               C 65,72 71,69 76,68
               C 71,63 67,60 67,55
               C 73,53 80,50 81,44
               C 77,36 76,27 78,13 Z"
            fill="url(#tnMaroonGrad)"
            stroke="url(#tnGoldGrad)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            filter="url(#tnMapShadow)"
          />

          {/* Civic Network Grid Lines inside State Geography */}
          <path
            d="M 48,16 L 48,95"
            stroke="#FDE68A"
            strokeWidth="0.8"
            strokeDasharray="1.5 2.5"
            strokeOpacity="0.35"
          />
          <path
            d="M 24,46 Q 48,50 78,44"
            stroke="#FDE68A"
            strokeWidth="0.8"
            strokeDasharray="1.5 2.5"
            strokeOpacity="0.35"
          />

          {/* Central Civic Pulse / Life Line across Tamil Nadu */}
          <path
            d="M 28,52 L 39,52 L 43,42 L 48,63 L 53,38 L 58,52 L 72,52"
            stroke="url(#tnGoldGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#goldGlow)"
          />

          {/* Central Civic Service Hub / Location Beacon (Trichy-Madurai Civic Core) */}
          <circle cx="53" cy="38" r="4.2" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.2" />
          <circle cx="53" cy="38" r="2" fill="#D97706" />

          {/* Civic Radiating Wavelets */}
          <path
            d="M 48,34 A 6 6 0 0 1 58,34"
            stroke="#FDE68A"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          <path
            d="M 45,30 A 10 10 0 0 1 61,30"
            stroke="#FDE68A"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />

          {/* Southern Apex Marker (Kanyakumari Anchor Node) */}
          <circle cx="48" cy="94" r="1.8" fill="#FCD34D" />
          {/* Northern Coastal Marker (Chennai Metropolitan Node) */}
          <circle cx="76" cy="16" r="1.8" fill="#FCD34D" />
        </svg>
      </div>

      {/* Typography Lockup */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-heading font-extrabold tracking-tight text-xl ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              CIVIC<span className="text-[#8B1E3F] font-bold ml-0.5 dark:text-[#F59E0B]">PULSE</span>
            </span>
            <span className="bg-[#8B1E3F]/10 text-[#8B1E3F] border border-[#8B1E3F]/20 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
              TN
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase mt-1 flex items-center gap-1 ${
              isDark ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            <span>Tamil Nadu</span>
            <span className="text-[#D97706]">•</span>
            <span>Civic Platform</span>
          </span>
        </div>
      )}
    </div>
  );
};
