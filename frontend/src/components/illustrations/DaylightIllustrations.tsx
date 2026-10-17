import React from 'react';

export const CitySkyline: React.FC<{ className?: string }> = ({ className = 'w-full h-auto text-primary' }) => (
  <svg
    viewBox="0 0 800 240"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Sunny Morning Sky Elements */}
    <circle cx="680" cy="60" r="32" fill="#F5A524" fillOpacity="0.2" />
    <circle cx="680" cy="60" r="20" fill="#F5A524" fillOpacity="0.4" />
    {/* Cloud lines */}
    <path d="M120 70C130 55 160 55 170 70C185 70 195 85 190 100H100C95 85 105 70 120 70Z" fill="#E3F4F5" />
    <path d="M480 90C490 80 510 80 520 90C530 90 540 100 535 110H465C460 100 470 90 480 90Z" fill="#E3F4F5" />
    {/* Skyline silhouette */}
    <path
      d="M0 220H80V140H130V220H180V100H220V70H230V100H260V220H320V120H370V220H410V160H460V220H500V80H560V220H620V130H670V220H720V150H760V220H800"
      stroke="#0E7C86"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="#FAFAF7"
    />
    {/* Architectural Windows and Details */}
    <line x1="195" y1="120" x2="205" y2="120" stroke="#0E7C86" strokeWidth="2" />
    <line x1="195" y1="140" x2="205" y2="140" stroke="#0E7C86" strokeWidth="2" />
    <line x1="195" y1="160" x2="205" y2="160" stroke="#0E7C86" strokeWidth="2" />
    <line x1="520" y1="100" x2="540" y2="100" stroke="#0E7C86" strokeWidth="2" />
    <line x1="520" y1="120" x2="540" y2="120" stroke="#0E7C86" strokeWidth="2" />
    <line x1="520" y1="140" x2="540" y2="140" stroke="#0E7C86" strokeWidth="2" />
    {/* Street baseline and gentle trees */}
    <line x1="0" y1="220" x2="800" y2="220" stroke="#1F2933" strokeWidth="3" />
    {/* Tree 1 */}
    <path d="M150 220V190M150 190C140 190 135 175 145 165C140 155 160 155 165 165C175 175 170 190 150 190Z" stroke="#2E8B57" strokeWidth="2" fill="#EAF7EE" />
    {/* Tree 2 */}
    <path d="M480 220V195M480 195C472 195 468 180 478 172C474 162 490 162 494 172C502 180 498 195 480 195Z" stroke="#2E8B57" strokeWidth="2" fill="#EAF7EE" />
  </svg>
);

export const RoadIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#FEF7EB" />
    <path d="M14 52L26 12H38L50 52H14Z" fill="#F3F1EA" stroke="#D98E04" strokeWidth="2" strokeLinejoin="round" />
    <line x1="32" y1="16" x2="32" y2="24" stroke="#D98E04" strokeWidth="2" strokeDasharray="3 3" />
    <line x1="32" y1="32" x2="32" y2="44" stroke="#D98E04" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M22 42C24 38 28 38 30 42C32 46 36 46 38 42" stroke="#D64545" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const StreetlightIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#FEF7EB" />
    <path d="M26 52H38M32 52V18C32 14 36 12 40 12H44" stroke="#F5A524" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M40 12L44 18H36L40 12Z" fill="#F5A524" />
    <path d="M38 22L36 28M42 22L44 28" stroke="#F5A524" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const WaterTapIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#E3F4F5" />
    <path d="M16 28H36V34H16V28Z" fill="#0E7C86" stroke="#0E7C86" strokeWidth="2" />
    <path d="M30 28V20C30 18 32 16 34 16H42" stroke="#0E7C86" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M38 12V20" stroke="#0E7C86" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 34V40H26" stroke="#0E7C86" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 46C26 44 28 42 28 42C28 42 30 44 30 46C30 47.1 29.1 48 28 48C26.9 48 26 47.1 26 46Z" fill="#0E7C86" />
  </svg>
);

export const BinIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#EAF7EE" />
    <path d="M20 22L24 50H40L44 22H20Z" fill="#FFFFFF" stroke="#2E8B57" strokeWidth="2" strokeLinejoin="round" />
    <line x1="16" y1="22" x2="48" y2="22" stroke="#2E8B57" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M28 22V16H36V22" stroke="#2E8B57" strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="28" x2="29" y2="44" stroke="#2E8B57" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="36" y1="28" x2="35" y2="44" stroke="#2E8B57" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const EmptyIllustration: React.FC<{ className?: string; message?: string }> = ({
  className = 'w-48 h-48',
  message = 'Nothing reported here yet. A quiet street is a good street.'
}) => (
  <div className="flex flex-col items-center justify-center text-center p-6">
    <svg viewBox="0 0 160 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="60" r="50" fill="#F3F1EA" />
      <path d="M40 90H120" stroke="#CBD2D9" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 90V75C60 70 65 65 70 65H90C95 65 100 70 100 75V90" stroke="#0E7C86" strokeWidth="2" fill="#FFFFFF" />
      <circle cx="80" cy="50" r="8" fill="#F5A524" />
      <path d="M72 40L88 40" stroke="#F5A524" strokeWidth="2" strokeLinecap="round" />
      {/* Little green plant */}
      <path d="M110 90C110 82 116 78 116 78C116 78 122 82 122 90" stroke="#2E8B57" strokeWidth="2" fill="#EAF7EE" />
    </svg>
    <p className="text-text-secondary text-sm font-medium mt-3 max-w-sm">{message}</p>
  </div>
);
