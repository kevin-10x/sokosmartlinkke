const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  search: (params: string) => fetchAPI(`/api/v1/search?${params}`),
  autocomplete: (q: string) => fetchAPI(`/api/v1/search/autocomplete?q=${encodeURIComponent(q)}`),
  nearbyBusinesses: (lat: number, lng: number, radius?: number) =>
    fetchAPI(`/api/v1/businesses/nearby?lat=${lat}&lng=${lng}&radius=${radius || 5000}`),
  getBusiness: (id: string) => fetchAPI(`/api/v1/businesses/${id}`),
  nearbyStages: (lat: number, lng: number, radius?: number) =>
    fetchAPI(`/api/v1/matatu/stages/nearby?lat=${lat}&lng=${lng}&radius=${radius || 5000}`),
  getStage: (id: string) => fetchAPI(`/api/v1/matatu/stages/${id}`),
  getCities: () => fetchAPI('/api/v1/cities'),
  submitStage: (data: any) => fetchAPI('/api/v1/matatu/stages', { method: 'POST', body: JSON.stringify(data) }),
  submitData: (data: any) => fetchAPI('/api/v1/submissions', { method: 'POST', body: JSON.stringify(data) }),
};
