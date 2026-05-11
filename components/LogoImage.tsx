'use client';

import { useState } from 'react';

export function LogoImage({ className }: { className?: string }) {
  const [src, setSrc] = useState('/Shivani.png');
  return (
    <img
      src={src}
      alt="Shivani Gems"
      className={className}
      onError={() => {
        if (src === '/Shivani.png') setSrc('/Shivani.PNG');
      }}
    />
  );
}
