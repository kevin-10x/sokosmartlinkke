'use client';

import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type?: string;
  color?: string;
}

interface GoogleMapProps {
  center: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

type GoogleMapLib = typeof google.maps;

let mapsApiPromise: Promise<GoogleMapLib> | null = null;

function loadGoogleMapsAPI(): Promise<GoogleMapLib> {
  if (typeof google !== 'undefined' && google.maps) {
    return Promise.resolve(google.maps);
  }
  if (!mapsApiPromise) {
    mapsApiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(google.maps);
      script.onerror = () => reject(new Error('Failed to load Google Maps API'));
      document.head.appendChild(script);
    });
  }
  return mapsApiPromise;
}

export default function GoogleMap({ center, markers = [], zoom = 7, className = '', onMarkerClick }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;
    let mounted = true;
    loadGoogleMapsAPI().then((maps) => {
      if (!mounted || !mapRef.current) return;
      const newMap = new maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });
      infoWindowRef.current = new maps.InfoWindow();
      setMap(newMap);
    }).catch((err) => {
      console.error('Google Maps load error:', err);
    });
    return () => { mounted = false; };
  }, [GOOGLE_MAPS_KEY]);

  useEffect(() => {
    if (!map || !GOOGLE_MAPS_KEY) return;
    const maps = google.maps;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    const colors: Record<string, string> = {
      market: '#e74c3c', shop: '#3498db', 'matatu-stage': '#27ae60',
      food: '#f39c12', service: '#9b59b6', health: '#e91e63',
      education: '#00bcd4', hardware: '#795548', electronics: '#607d8b', beauty: '#ff5722',
    };
    markers.forEach((m) => {
      const markerColor = m.color || colors[m.type || ''] || '#FF6B35';
      const marker = new maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.name,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 8,
        },
        animation: maps.Animation.DROP,
      });
      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`<div style="font-size:13px;font-weight:600;padding:4px">${m.name}</div>`);
          infoWindowRef.current.open(map, marker);
        }
        onMarkerClick?.(m);
      });
      markersRef.current.push(marker);
    });
    if (markers.length > 0) {
      const bounds = new maps.LatLngBounds();
      markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
      bounds.extend(center);
      map.fitBounds(bounds);
    }
  }, [map, markers, center, onMarkerClick]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className={`bg-surface flex items-center justify-center text-muted text-sm ${className}`}>
        <div className="text-center p-4">
          <p className="font-medium">Map unavailable</p>
          <p className="text-xs mt-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={`w-full ${className}`} />;
}
