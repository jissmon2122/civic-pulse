import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Vector artwork for standard PWA icons
function getStandardSvg(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tnM" x1="20" y1="10" x2="80" y2="95" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9E2247" />
      <stop offset="50%" stop-color="#700B2B" />
      <stop offset="100%" stop-color="#4A051A" />
    </linearGradient>
    <linearGradient id="tnG" x1="25" y1="50" x2="75" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Deep Navy Base Medallion -->
  <rect width="100" height="100" rx="22" fill="#0B2545" />

  <!-- Inner Gold Trim -->
  <rect x="2" y="2" width="96" height="96" rx="20" fill="none" stroke="url(#tnG)" stroke-width="1.2" opacity="0.8" />

  <!-- Tamil Nadu Geographic Silhouette -->
  <path
    d="M 78,13 C 70,11 58,11 48,15 C 38,18 30,21 26,26 C 23,32 21,39 22,46 C 25,49 27,51 26,54 C 27,61 31,70 36,80 C 41,88 45,94 48,97 C 52,94 56,86 60,78 C 65,72 71,69 76,68 C 71,63 67,60 67,55 C 73,53 80,50 81,44 C 77,36 76,27 78,13 Z"
    fill="url(#tnM)"
    stroke="url(#tnG)"
    stroke-width="2.6"
    stroke-linejoin="round"
    filter="url(#shadow)"
  />

  <!-- Internal Geospatial Latitude/Longitude Gridlines -->
  <path d="M 48,16 L 48,95" stroke="#FDE68A" stroke-width="0.8" stroke-dasharray="1.5 2.5" opacity="0.3" />
  <path d="M 24,46 Q 48,50 78,44" stroke="#FDE68A" stroke-width="0.8" stroke-dasharray="1.5 2.5" opacity="0.3" />

  <!-- Civic Pulse Telemetry Waveform -->
  <path
    d="M 28,52 L 39,52 L 43,42 L 48,63 L 53,38 L 58,52 L 72,52"
    stroke="url(#tnG)"
    stroke-width="3.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />

  <!-- Central Civic Hub Beacon (Trichy/Madurai Axis) -->
  <circle cx="53" cy="38" r="4.5" fill="#FEF3C7" stroke="#B45309" stroke-width="1.5" />
  <circle cx="53" cy="38" r="2" fill="#D97706" />
</svg>
`;
}

// Vector artwork for maskable icon (full-bleed background with 20% safe zone padding)
function getMaskableSvg() {
  return `
<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tnM" x1="20" y1="10" x2="80" y2="95" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9E2247" />
      <stop offset="50%" stop-color="#700B2B" />
      <stop offset="100%" stop-color="#4A051A" />
    </linearGradient>
    <linearGradient id="tnG" x1="25" y1="50" x2="75" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="50%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Full-Bleed Background for Adaptive Masks -->
  <rect width="100" height="100" fill="#0B2545" />

  <!-- Safe Area Group (scaled 0.76 centered at 50,50 so it never clips on Android round/squircle) -->
  <g transform="translate(12, 12) scale(0.76)">
    <!-- Tamil Nadu Geographic Silhouette -->
    <path
      d="M 78,13 C 70,11 58,11 48,15 C 38,18 30,21 26,26 C 23,32 21,39 22,46 C 25,49 27,51 26,54 C 27,61 31,70 36,80 C 41,88 45,94 48,97 C 52,94 56,86 60,78 C 65,72 71,69 76,68 C 71,63 67,60 67,55 C 73,53 80,50 81,44 C 77,36 76,27 78,13 Z"
      fill="url(#tnM)"
      stroke="url(#tnG)"
      stroke-width="3"
      stroke-linejoin="round"
      filter="url(#shadow)"
    />

    <!-- Civic Pulse Telemetry Waveform -->
    <path
      d="M 28,52 L 39,52 L 43,42 L 48,63 L 53,38 L 58,52 L 72,52"
      stroke="url(#tnG)"
      stroke-width="3.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />

    <!-- Central Civic Hub Beacon -->
    <circle cx="53" cy="38" r="4.5" fill="#FEF3C7" stroke="#B45309" stroke-width="1.5" />
    <circle cx="53" cy="38" r="2" fill="#D97706" />
  </g>
</svg>
`;
}

async function generate() {
  console.log('Generating PWA Icons...');

  // 1. pwa-192x192.png
  await sharp(Buffer.from(getStandardSvg(192)))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created pwa-192x192.png');

  // 2. pwa-512x512.png
  await sharp(Buffer.from(getStandardSvg(512)))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 3. pwa-maskable-512x512.png
  await sharp(Buffer.from(getMaskableSvg()))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created pwa-maskable-512x512.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(getStandardSvg(180)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
