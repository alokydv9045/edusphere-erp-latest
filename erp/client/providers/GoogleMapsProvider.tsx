'use client';

import Script from 'next/script';
import React, { createContext, useContext, useState, useEffect } from 'react';

const GoogleMapsContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export default function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Check if already loaded (e.g. from previous navigation)
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      setIsLoaded(true);
    }
  }, []);

  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`}
        strategy="afterInteractive"
        onLoad={() => {
            console.log('Google Maps Script Loaded');
            setIsLoaded(true);
        }}
      />
      {children}
    </GoogleMapsContext.Provider>
  );
}
