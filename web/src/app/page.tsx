'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Bus, Store, Star, Phone, Navigation, Clock, CheckCircle, X, Map, List } from 'lucide-react';
import { api } from '@/lib/api';
import GoogleMap from '@/components/GoogleMap';

interface Business {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  categoryColor: string;
  distance: number | null;
  rating: number;
  reviewCount: number;
  isOpenNow: boolean;
  isVerified: boolean;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  photos: any[];
  coverPhoto: string;
  businessHours: any;
}

interface MatatuStage {
  id: string;
  name: string;
  distance: number;
  lat: number;
  lng: number;
  address: string;
  safetyRating: number;
  routes: any[];
}

const categories = [
  { slug: 'all', name: 'All', icon: '🔍' },
  { slug: 'market', name: 'Markets', icon: '🏪' },
  { slug: 'shop', name: 'Shops', icon: '🛍️' },
  { slug: 'matatu-stage', name: 'Matatu', icon: '🚌' },
  { slug: 'food', name: 'Food', icon: '🍽️' },
  { slug: 'service', name: 'Services', icon: '🔧' },
];

export default function Home() {
  const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [results, setResults] = useState<Business[]>([]);
  const [stages, setStages] = useState<MatatuStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Business | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: -0.0236, lng: 37.9062 }); // Center of Kenya
  const [locationName, setLocationName] = useState('Kenya');
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<'all' | 'matatu'>('all');
  const [showMap, setShowMap] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          reverseGeocode(loc);
        },
        () => {}
      );
    }
  }, []);

  async function reverseGeocode(loc: { lat: number; lng: number }) {
    if (!GOOGLE_MAPS_KEY) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.lat},${loc.lng}&key=${GOOGLE_MAPS_KEY}&components=country:ke`
      );
      const data = await res.json();
      if (data.status === 'OK' && data.results[0]) {
        const parts = data.results[0].address_components;
        const town = parts.find((p: any) => p.types.includes('locality') || p.types.includes('administrative_area_level_2'));
        if (town) setLocationName(town.long_name);
      }
    } catch {}
  }

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      params.set('lat', userLocation.lat.toString());
      params.set('lng', userLocation.lng.toString());
      params.set('radius', '10000');
      if (activeCategory !== 'all') params.set('category', activeCategory);
      params.set('limit', '20');

      if (viewMode === 'matatu' || activeCategory === 'matatu-stage') {
        const stageData = await api.nearbyStages(userLocation.lat, userLocation.lng, 10000);
        setStages(stageData.results || []);
        setResults([]);
        setTotalResults(stageData.results?.length || 0);
        setBackendAvailable(true);
      } else {
        const data = await api.search(params.toString());
        setResults(data.results || []);
        setTotalResults(data.total || 0);
        setStages([]);
        setBackendAvailable(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setBackendAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory, userLocation, viewMode]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          reverseGeocode(loc);
        },
        () => alert('Could not get your location.')
      );
    }
  };

  const openDetail = (item: Business) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const getCategoryIcon = (slug: string) => {
    const map: Record<string, string> = { market: '🏪', shop: '🛍️', 'matatu-stage': '🚌', food: '🍽️', service: '🔧', health: '💊', education: '🎓', hardware: '🔨', electronics: '📱', beauty: '✨' };
    return map[slug] || '📍';
  };

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-white relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-border px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">SS</div>
          <h1 className="text-lg font-bold tracking-tight">Smart Soko</h1>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search markets, shops, stages..."
            className="input pl-9"
          />
        </div>

        {/* Category Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => {
                setActiveCategory(cat.slug);
                setViewMode(cat.slug === 'matatu-stage' ? 'matatu' : 'all');
              }}
              className={`chip whitespace-nowrap ${activeCategory === cat.slug ? 'chip-active' : ''}`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Location Bar */}
      <div className="px-4 py-2 bg-surface/50 flex items-center justify-between text-xs text-muted">
        <span>📍 <strong className="text-primary">{locationName}</strong> — {totalResults} found</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMap(!showMap)} className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${showMap ? 'bg-primary text-white' : 'hover:text-primary'}`}>
            {showMap ? <List className="w-3 h-3" /> : <Map className="w-3 h-3" />}
            {showMap ? 'List' : 'Map'}
          </button>
          <button onClick={handleLocate} className="flex items-center gap-1 hover:text-primary transition-colors">
            <MapPin className="w-3 h-3" />
            Locate me
          </button>
        </div>
      </div>

      {/* Map View */}
      {showMap && (
        <div className="h-64 border-b border-border">
          <GoogleMap
            center={userLocation}
            markers={[
              ...results.map(b => ({ id: b.id, lat: b.lat, lng: b.lng, name: b.name, type: b.categorySlug })),
              ...stages.map(s => ({ id: s.id, lat: s.lat, lng: s.lng, name: s.name, type: 'matatu-stage' })),
            ]}
            onMarkerClick={(m) => {
              const biz = results.find(b => b.id === m.id);
              if (biz) openDetail(biz);
            }}
            className="h-full"
          />
        </div>
      )}

      {/* Results List */}
      <div className="px-4 pb-24">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && results.length === 0 && stages.length === 0 && (
          <div className="text-center py-12 text-muted">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            {backendAvailable ? (
              <>
                <p className="font-medium">No results found</p>
                <p className="text-xs mt-1">Try a different search or category</p>
              </>
            ) : (
              <>
                <p className="font-medium">Backend server not connected</p>
                <p className="text-xs mt-1">Set up the API server to see business listings</p>
              </>
            )}
          </div>
        )}

        {/* Business Results */}
        {results.map((biz) => (
          <div key={biz.id} onClick={() => openDetail(biz)} className="card mb-3 flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center text-2xl flex-shrink-0">
              {getCategoryIcon(biz.categorySlug)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{biz.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {biz.rating}
                </span>
                <span>({biz.reviewCount})</span>
                <span>|</span>
                <span>{biz.category}</span>
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  biz.isOpenNow ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {biz.isOpenNow ? 'Open' : 'Closed'}
                </span>
                {biz.isVerified && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-600 flex items-center gap-0.5">
                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Matatu Stage Results */}
        {stages.map((stage) => (
          <div key={stage.id} className="card mb-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Bus className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{stage.name}</h3>
                <p className="text-xs text-muted mt-0.5">{stage.address}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {stage.safetyRating}
                  </span>
                  <span className="text-muted">{stage.distance}m away</span>
                </div>
                {stage.routes && stage.routes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {stage.routes.slice(0, 3).map((route: any) => (
                      <span key={route.id} className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded font-medium">
                        {route.routeNumber} → {route.destination}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {showDetail && selectedItem && (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-bottom duration-300">
          <div className="h-48 bg-surface flex items-center justify-center text-6xl relative">
            <button 
              onClick={() => setShowDetail(false)}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
            {getCategoryIcon(selectedItem.categorySlug)}
          </div>
          <div className="p-5 pb-24 overflow-y-auto h-[calc(100vh-12rem)]">
            <h2 className="text-xl font-extrabold">{selectedItem.name}</h2>
            <p className="text-sm text-muted mt-1">{selectedItem.category} · {selectedItem.address}</p>

            <div className="flex gap-3 mt-4">
              <a href={`tel:${selectedItem.phone}`} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> Call
              </a>
              <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" /> Directions
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-muted mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Rating</p>
                  <p className="text-sm font-medium">{selectedItem.rating} / 5.0 · {selectedItem.reviewCount} reviews</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Hours</p>
                  <p className="text-sm font-medium">
                    Mon-Sat: 6:00 AM - 6:00 PM
                    <span className={`ml-2 font-semibold ${selectedItem.isOpenNow ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedItem.isOpenNow ? 'Open Now' : 'Closed'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Address</p>
                  <p className="text-sm font-medium">{selectedItem.address}</p>
                </div>
              </div>
              {selectedItem.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted mt-0.5" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">Phone</p>
                    <p className="text-sm font-medium">{selectedItem.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <a 
        href="/submit"
        className="fixed bottom-4 right-4 z-40 bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
      >
        <Store className="w-5 h-5" />
      </a>
    </main>
  );
}
