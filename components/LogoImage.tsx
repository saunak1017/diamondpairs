'use client';

import { useState } from 'react';

// Tries each candidate in order until one loads successfully.
// Add your logo file to /public/ with any of these names.
const CANDIDATES = [
  '/Shivani.png', '/Shivani.PNG', '/Shivani.jpg', '/Shivani.JPG',
  '/Shivani.jpeg', '/Shivani.JPEG', '/Shivani.webp', '/Shivani.svg',
  '/logo.png', '/logo.PNG', '/logo.jpg', '/logo.JPG', '/logo.svg', '/logo.webp',
];

export function LogoImage({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  if (index >= CANDIDATES.length) return null;

  return (
    <img
      src={CANDIDATES[index]}
      alt="Shivani Gems"
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
