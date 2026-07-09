'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PlacesAutocompleteProps {
  onSelect: (place: { address: string; lat: number; lng: number; name?: string }) => void;
  placeholder?: string;
}

export default function PlacesAutocomplete({ onSelect, placeholder = 'Search for a location...' }: PlacesAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = async (input: string) => {
    if (input.length < 3) { setPredictions([]); return; }
    setLoading(true);
    try {
      if (GOOGLE_MAPS_KEY) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_KEY}&components=country:ke`
        );
        const data = await res.json();
        if (data.status === 'OK') {
          setPredictions(data.predictions.map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description,
          })));
          return;
        }
      }
      const res = await fetch(`${API_URL}/api/v1/places/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowDropdown(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(value), 400);
  };

  const handleSelect = async (prediction: any) => {
    setQuery(prediction.mainText || prediction.description);
    setShowDropdown(false);
    setLoading(true);
    try {
      if (GOOGLE_MAPS_KEY) {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?place_id=${prediction.placeId}&key=${GOOGLE_MAPS_KEY}`
        );
        const data = await res.json();
        if (data.status === 'OK' && data.results[0]) {
          const loc = data.results[0].geometry.location;
          onSelect({
            address: prediction.description,
            lat: loc.lat,
            lng: loc.lng,
            name: prediction.mainText,
          });
          return;
        }
      }
      const res = await fetch(`${API_URL}/api/v1/places/details?place_id=${prediction.placeId}`);
      const place = await res.json();
      onSelect({
        address: prediction.description,
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
        name: prediction.mainText,
      });
    } catch (err) {
      console.error('Place details error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="input pl-9"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.placeId}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-surface transition-colors border-b border-border last:border-0 flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
              <span>{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
