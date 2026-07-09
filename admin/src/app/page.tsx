'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Bus, Store, Users, Star, AlertCircle, Clock, MapPin, Phone, Search, Filter, Globe, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'submissions' | 'businesses' | 'stages' | 'places'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/dashboard`);
      const data = await res.json();
      setStats(data.stats);
      setSubmissions(data.recentSubmissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/submissions?status=all`);
      const data = await res.json();
      setSubmissions(data.submissions.map((s: any) => ({...s, data: typeof s.data === 'string' ? JSON.parse(s.data) : s.data})));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/businesses?status=all`);
      const data = await res.json();
      setBusinesses(data.businesses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/stages?status=all`);
      const data = await res.json();
      setStages(data.stages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'submissions') fetchSubmissions();
    if (tab === 'businesses') fetchBusinesses();
    if (tab === 'stages') fetchStages();
    if (tab === 'dashboard') fetchDashboard();
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/api/v1/admin/submissions/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      fetchSubmissions();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`${API_URL}/api/v1/admin/submissions/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      fetchSubmissions();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBusinessStatus = async (id: string, status: string) => {
    await fetch(`${API_URL}/api/v1/admin/businesses/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchBusinesses();
  };

  const handleStageActivate = async (id: string) => {
    await fetch(`${API_URL}/api/v1/admin/stages/${id}/activate`, { method: 'PUT' });
    fetchStages();
  };

  if (loading && activeTab === 'dashboard') return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-border z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">SS</div>
            <h1 className="font-bold text-lg">Smart Soko</h1>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'submissions', label: 'Submissions', icon: '📥' },
              { id: 'businesses', label: 'Businesses', icon: '🏪' },
              { id: 'stages', label: 'Matatu Stages', icon: '🚌' },
              { id: 'places', label: 'Places Sync', icon: '🌍' },
            ].map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'text-secondary hover:bg-surface'}`}>
                <span>{tab.icon}</span> {tab.label}
                {tab.id === 'submissions' && stats?.pendingSubmissions > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.pendingSubmissions}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-sm">👤</div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted">admin@smartsoko.co</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {activeTab === 'dashboard' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <button onClick={fetchDashboard} className="btn-secondary text-xs">Refresh</button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Businesses', value: stats?.totalBusinesses, icon: Store, color: 'bg-blue-50 text-blue-600' },
                { label: 'Pending Reviews', value: stats?.pendingBusinesses, icon: AlertCircle, color: 'bg-yellow-50 text-yellow-600' },
                { label: 'Matatu Stages', value: stats?.totalStages, icon: Bus, color: 'bg-green-50 text-green-600' },
                { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'bg-purple-50 text-purple-600' },
                { label: 'Total Reviews', value: stats?.totalReviews, icon: Star, color: 'bg-orange-50 text-orange-600' },
                { label: 'Pending Submissions', value: stats?.pendingSubmissions, icon: Clock, color: 'bg-red-50 text-red-600' },
                { label: 'Active Stages', value: stats?.totalStages - stats?.pendingStages, icon: MapPin, color: 'bg-teal-50 text-teal-600' },
                { label: 'Pending Stages', value: stats?.pendingStages, icon: Bus, color: 'bg-gray-50 text-gray-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white p-5 rounded-xl border border-border hover:border-primary/20 transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value || 0}</p>
                  <p className="text-xs text-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <h3 className="font-bold mb-4 flex items-center gap-2">
              Recent Pending Submissions
              {submissions.length > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{submissions.length}</span>}
            </h3>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Target</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Submitted By</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No pending submissions</td></tr>
                  )}
                  {submissions.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${sub.type === 'matatu_stage' ? 'bg-green-50 text-green-600' : sub.type === 'new_business' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                          {sub.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{sub.targetName}</td>
                      <td className="px-4 py-3 text-muted">{sub.submittedBy || 'Anonymous'}</td>
                      <td className="px-4 py-3 text-muted text-xs">{new Date(sub.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(sub.id)} disabled={actionLoading === sub.id}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50">
                            {actionLoading === sub.id ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleReject(sub.id)} disabled={actionLoading === sub.id}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'submissions' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">All Submissions</h2>
              <div className="flex gap-2">
                <button onClick={fetchSubmissions} className="btn-secondary text-xs">Refresh</button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Data</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-4 py-3 font-mono text-xs">{sub.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sub.submissionType === 'matatu_stage' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {sub.submissionType?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${sub.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : sub.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted max-w-xs truncate">{JSON.stringify(sub.data).slice(0, 60)}...</td>
                      <td className="px-4 py-3">
                        {sub.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(sub.id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100">Approve</button>
                            <button onClick={() => handleReject(sub.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'businesses' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Business Management</h2>
              <button onClick={fetchBusinesses} className="btn-secondary text-xs">Refresh</button>
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Category</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">City</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((biz: any) => (
                    <tr key={biz.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">{biz.name}</td>
                      <td className="px-4 py-3 text-muted">{biz.category?.name}</td>
                      <td className="px-4 py-3 text-muted">{biz.city?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${biz.status === 'active' ? 'bg-green-50 text-green-600' : biz.status === 'pending_review' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                          {biz.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{biz.rating}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={biz.status}
                          onChange={(e) => handleBusinessStatus(biz.id, e.target.value)}
                          className="text-xs border border-border rounded px-2 py-1 bg-white"
                        >
                          <option value="active">Active</option>
                          <option value="pending_review">Pending</option>
                          <option value="inactive">Inactive</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'places' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Google Places Sync</h2>
            </div>
            <PlacesSyncPanel />
          </>
        )}

        {activeTab === 'stages' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Matatu Stage Management</h2>
              <button onClick={fetchStages} className="btn-secondary text-xs">Refresh</button>
            </div>
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">City</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Routes</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage: any) => (
                    <tr key={stage.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-4 py-3 font-medium">{stage.name}</td>
                      <td className="px-4 py-3 text-muted">{stage.city?.name}</td>
                      <td className="px-4 py-3 text-muted capitalize">{stage.stageType}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${stage.isActive ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                          {stage.isActive ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{stage._count?.routes || 0}</td>
                      <td className="px-4 py-3">
                        {!stage.isActive && (
                          <button onClick={() => handleStageActivate(stage.id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100">
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PlacesSyncPanel() {
  const [query, setQuery] = useState('');
  const [lat, setLat] = useState('-1.2921');
  const [lng, setLng] = useState('36.8219');
  const [radius, setRadius] = useState('5000');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('shop');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const searchPlaces = async () => {
    if (!query) return;
    setLoading(true);
    setSyncStatus(null);
    try {
      const params = new URLSearchParams({ q: query, lat, lng, radius });
      const res = await fetch(`${API_URL}/api/v1/places/search?${params}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      setSyncStatus('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const syncPlace = async (placeId: string) => {
    setSyncStatus('Syncing...');
    try {
      const res = await fetch(`${API_URL}/api/v1/places/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: placeId, category: selectedCategory }),
      });
      const data = await res.json();
      setSyncStatus(`${data.action === 'created' ? 'Synced' : 'Already exists'}: ${data.business?.name || data.name}`);
    } catch (err) {
      setSyncStatus('Sync failed');
    }
  };

  const syncAll = async () => {
    if (results.length === 0) return;
    setSyncStatus(`Syncing ${results.length} places...`);
    for (const place of results) {
      await syncPlace(place.place_id);
    }
    setSyncStatus('Bulk sync complete');
  };

  const bulkSyncNearby = async () => {
    setLoading(true);
    setSyncStatus('Running bulk sync...');
    try {
      const res = await fetch(`${API_URL}/api/v1/places/sync-nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: parseFloat(lat), lng: parseFloat(lng), radius: parseInt(radius), category: selectedCategory, keyword: query || undefined }),
      });
      const data = await res.json();
      setSyncStatus(`Found ${data.total} places, synced ${data.synced} new businesses`);
      const placeIds = data.results?.filter((r: any) => r.action === 'created').map((r: any) => ({ place_id: r.placeId, name: r.name })) || [];
      setResults(placeIds);
    } catch (err) {
      setSyncStatus('Bulk sync failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {syncStatus && (
        <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg">{syncStatus}</div>
      )}

      <div className="bg-white p-6 rounded-xl border border-border">
        <h3 className="font-bold mb-4">Search & Import from Google Places</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted block mb-1">Search Query</label>
            <input value={query} onChange={e => setQuery(e.target.value)}
              className="input" placeholder="e.g., supermarkets in Nairobi" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Latitude</label>
            <input value={lat} onChange={e => setLat(e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Longitude</label>
            <input value={lng} onChange={e => setLng(e.target.value)} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Radius (m)</label>
            <input value={radius} onChange={e => setRadius(e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">Category</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input">
              <option value="market">Market</option>
              <option value="shop">Shop</option>
              <option value="food">Food</option>
              <option value="service">Service</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="hardware">Hardware</option>
              <option value="electronics">Electronics</option>
              <option value="beauty">Beauty</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={searchPlaces} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
            <button onClick={bulkSyncNearby} disabled={loading} className="btn-secondary flex items-center justify-center gap-2" title="Sync nearby places automatically">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
            <span className="font-semibold text-sm">{results.length} places found</span>
            <button onClick={syncAll} className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90">Sync All</button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Address</th>
                <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Rating</th>
                <th className="text-left px-4 py-3 font-semibold text-muted text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((place: any) => (
                <tr key={place.place_id} className="border-b border-border last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium">{place.name}</td>
                  <td className="px-4 py-3 text-muted text-xs">{place.formatted_address || place.vicinity || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{place.rating || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => syncPlace(place.place_id)} className="text-xs bg-primary text-white px-2 py-1 rounded hover:opacity-90">
                      Import
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
