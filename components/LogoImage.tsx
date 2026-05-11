'use client';

import { useState, useEffect } from 'react';

const CANDIDATES = [
  '/Shivani.PNG', '/Shivani.png', '/Shivani.jpg', '/Shivani.JPG',
  '/Shivani.jpeg', '/Shivani.webp', '/Shivani.svg',
  '/logo.PNG', '/logo.png', '/logo.jpg', '/logo.JPG', '/logo.svg',
];

export function LogoImage({ className }: { className?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem('logo_src');
    if (cached) { setSrc(cached); return; }

    let cancelled = false;
    (async () => {
      for (const path of CANDIDATES) {
        try {
          const res = await fetch(path, { method: 'HEAD' });
          if (res.ok && !cancelled) {
            sessionStorage.setItem('logo_src', path);
            setSrc(path);
            return;
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!src) return null;
  return <img src={src} alt="Shivani Gems" className={className} />;
}
