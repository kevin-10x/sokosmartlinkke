'use client';

import { useState } from 'react';
import { Bus, MapPin, Send, CheckCircle, ArrowLeft, Navigation } from 'lucide-react';
import PlacesAutocomplete from '@/components/PlacesAutocomplete';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function submitStage(data: any) {
  const res = await fetch(`${API_URL}/api/v1/matatu/stages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit');
  return res.json();
}

export default function SubmitStage() {
  const [form, setForm] = useState({
    name: '',
    commonNames: '',
    lat: '',
    lng: '',
    address: '',
    county: '',
    city: '',
    stageType: 'stage',
    operatingHours: '05:00-23:00',
    facilities: { shelter: false, lighting: false, security: false, toilet: false },
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitStage({
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        commonNames: form.commonNames.split(',').map((s: string) => s.trim()).filter(Boolean),
        submittedById: '00000000-0000-0000-0000-000000000000',
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm({ ...form, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        },
        () => alert('Could not get your location. Please enter coordinates manually.')
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  if (submitted) {
    return (
      <main className="max-w-lg mx-auto min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Stage Submitted!</h2>
          <p className="text-muted text-sm mb-6">Thank you for contributing to Smart Soko. Our team will review and verify your submission within 24 hours.</p>
          <div className="flex gap-3 justify-center">
            <a href="/" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </a>
            <button onClick={() => { setSubmitted(false); setForm({ ...form, name: '', commonNames: '', lat: '', lng: '', address: '' }); }} className="btn-secondary">
              Submit Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-white">
      <header className="px-4 pt-6 pb-4 border-b border-border sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <a href="/" className="p-2 -ml-2 hover:bg-surface rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">Submit Matatu Stage</h1>
            </div>
            <p className="text-xs text-muted mt-0.5">Help map Kenya's transport network</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-24">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Stage Name *</label>
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="e.g., Odeon Cinema Stage" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Common Names</label>
          <input value={form.commonNames} onChange={e => setForm({...form, commonNames: e.target.value})} className="input" placeholder="e.g., Odeon, CBD Stage (comma separated)" />
          <p className="text-[10px] text-muted mt-1">Other names people use for this stage</p>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Search Location</label>
          <PlacesAutocomplete
            onSelect={(place) => {
              setForm({
                ...form,
                lat: place.lat.toString(),
                lng: place.lng.toString(),
                address: place.address || form.address,
              });
            }}
            placeholder="Search for a location in Kenya..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Latitude *</label>
            <input required type="number" step="any" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} className="input" placeholder="-1.2921" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Longitude *</label>
            <input required type="number" step="any" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} className="input" placeholder="36.8219" />
          </div>
        </div>

        <button type="button" onClick={handleLocate} className="btn-secondary w-full text-xs flex items-center justify-center gap-2">
          <Navigation className="w-3 h-3" /> Use My Current Location
        </button>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Address</label>
          <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input" placeholder="Street, Area, Landmark" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">County *</label>
            <input required value={form.county} onChange={e => setForm({...form, county: e.target.value})} className="input" placeholder="Nairobi" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">City/Town *</label>
            <input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input" placeholder="Nairobi" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Stage Type</label>
          <select value={form.stageType} onChange={e => setForm({...form, stageType: e.target.value})} className="input">
            <option value="stage">Stage (Regular stop with shelter)</option>
            <option value="terminal">Terminal (Major hub with multiple routes)</option>
            <option value="stop">Stop (No shelter, flag down)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1.5">Operating Hours</label>
          <input value={form.operatingHours} onChange={e => setForm({...form, operatingHours: e.target.value})} className="input" placeholder="05:00-23:00" />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">Facilities Available</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(form.facilities).map(([key, val]) => (
              <button key={key} type="button" onClick={() => setForm({...form, facilities: {...form.facilities, [key]: !val}})}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${val ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-border hover:bg-surface'}`}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Send className="w-4 h-4" /> Submit Stage for Review</>
            )}
          </button>
          <p className="text-[10px] text-muted text-center mt-3">Your submission will be reviewed by our team before appearing on the map.</p>
        </div>
      </form>
    </main>
  );
}
