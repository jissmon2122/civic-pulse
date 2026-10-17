import React from 'react';
import { TamilNaduCivicLogo } from './TamilNaduCivicLogo';

interface PulseLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export const PulseLogo: React.FC<PulseLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  theme = 'light',
}) => {
  return (
    <TamilNaduCivicLogo
      className={className}
      size={size}
      showText={showText}
      theme={theme}
    />
  );
};
