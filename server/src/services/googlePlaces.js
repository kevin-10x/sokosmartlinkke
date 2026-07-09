const axios = require('axios');

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

function getApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
}

function requireKey() {
  const key = getApiKey();
  if (!key) {
    const err = new Error('Google API key not configured. Set GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY in .env');
    err.status = 503;
    throw err;
  }
}

function mapPlaceTypeToCategory(placeTypes) {
  const typeMap = {
    supermarket: 'shop', grocery_or_supermarket: 'shop', convenience_store: 'shop',
    restaurant: 'food', food: 'food', cafe: 'food', bakery: 'food', meal_takeaway: 'food',
    hardware_store: 'hardware', home_goods_store: 'hardware', electronics_store: 'electronics',
    beauty_salon: 'beauty', hair_care: 'beauty', spa: 'beauty',
    health: 'health', hospital: 'health', pharmacy: 'health', doctor: 'health', dentist: 'health',
    school: 'education', university: 'education', library: 'education',
    market: 'market', shopping_mall: 'market', department_store: 'market',
    car_repair: 'service', gas_station: 'service', bank: 'service', laundry: 'service',
    bus_station: 'matatu-stage', transit_station: 'matatu-stage',
  };
  if (!placeTypes) return 'shop';
  for (const t of placeTypes) {
    if (typeMap[t]) return typeMap[t];
  }
  return 'shop';
}

function mapPlaceToBusinessData(place, categoryId) {
  const slug = place.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + place.place_id.slice(-8);
  return {
    googlePlaceId: place.place_id,
    name: place.name,
    slug,
    description: place.editorial_summary?.overview || null,
    lat: place.geometry?.location?.lat || place.lat,
    lng: place.geometry?.location?.lng || place.lng,
    address: place.formatted_address || place.vicinity || '',
    county: '',
    phonePrimary: place.formatted_phone_number || null,
    website: place.website || null,
    rating: place.rating || 0,
    reviewCount: place.user_ratings_total || 0,
    isOpenNow: place.opening_hours?.open_now ?? null,
    businessHours: place.opening_hours?.weekday_text ? JSON.stringify(place.opening_hours.weekday_text) : null,
    photos: place.photos ? JSON.stringify(place.photos.slice(0, 5).map((p, i) => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${getApiKey()}`,
      caption: `${place.name} photo ${i + 1}`
    }))) : null,
    source: 'google_places',
    status: 'active',
    isVerified: true,
    categoryId,
  };
}

async function textSearch(query, options = {}) {
  requireKey();
  const { location, radius, type, maxResults = 20 } = options;
  const params = { query, key: getApiKey() };
  if (location) params.location = location;
  if (radius) params.radius = radius;
  if (type) params.type = type;
  try {
    const { data } = await axios.get(`${PLACES_API_BASE}/textsearch/json`, { params });
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }
    return (data.results || []).slice(0, maxResults);
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Google Places text search failed: ${err.message}`);
  }
}

async function nearbySearch(lat, lng, options = {}) {
  requireKey();
  const { radius = 5000, type, keyword, maxResults = 20 } = options;
  const params = { location: `${lat},${lng}`, radius, key: getApiKey() };
  if (type) params.type = type;
  if (keyword) params.keyword = keyword;
  try {
    const { data } = await axios.get(`${PLACES_API_BASE}/nearbysearch/json`, { params });
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }
    return (data.results || []).slice(0, maxResults);
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Google Places nearby search failed: ${err.message}`);
  }
}

async function getPlaceDetails(placeId) {
  requireKey();
  const params = {
    place_id: placeId,
    fields: 'place_id,name,formatted_address,formatted_phone_number,geometry,rating,user_ratings_total,opening_hours,website,editorial_summary,photos,types,vicinity,price_level',
    key: getApiKey(),
  };
  try {
    const { data } = await axios.get(`${PLACES_API_BASE}/details/json`, { params });
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }
    return data.result;
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Google Places details failed: ${err.message}`);
  }
}

async function findPlaceFromText(query) {
  requireKey();
  const params = {
    input: query,
    inputtype: 'textquery',
    fields: 'place_id,name,formatted_address,geometry,types',
    key: getApiKey(),
  };
  try {
    const { data } = await axios.get(`${PLACES_API_BASE}/findplacefromtext/json`, { params });
    if (data.status !== 'OK') {
      return null;
    }
    return data.candidates[0] || null;
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Google Places find place failed: ${err.message}`);
  }
}

async function autocomplete(input, options = {}) {
  requireKey();
  const params = {
    input,
    key: getApiKey(),
    components: 'country:ke',
  };
  if (options.types) params.types = options.types;
  if (options.location) params.location = options.location;
  if (options.radius) params.radius = options.radius;
  try {
    const { data } = await axios.get(`${PLACES_API_BASE}/autocomplete/json`, { params });
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }
    return (data.predictions || []).map(p => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
      types: p.types,
    }));
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Google Places autocomplete failed: ${err.message}`);
  }
}

async function syncPlaceAsBusiness(placeId, categoryId) {
  requireKey();
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.business.findUnique({ where: { googlePlaceId: placeId } });
    if (existing) return { action: 'exists', business: existing };

    const place = await getPlaceDetails(placeId);
    const data = mapPlaceToBusinessData(place, categoryId);
    const business = await prisma.business.create({ data });
    return { action: 'created', business };
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Failed to sync place ${placeId}: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function bulkSyncNearby(lat, lng, categoryId, options = {}) {
  requireKey();
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const places = await nearbySearch(lat, lng, { ...options, maxResults: 20 });
    const results = [];
    for (const place of places) {
      const existing = await prisma.business.findUnique({ where: { googlePlaceId: place.place_id } });
      if (existing) {
        results.push({ action: 'exists', placeId: place.place_id, name: place.name });
        continue;
      }
      const businessData = mapPlaceToBusinessData(place, categoryId);
      const business = await prisma.business.create({ data: businessData });
      results.push({ action: 'created', placeId: place.place_id, name: place.name, id: business.id });
    }
    return { total: places.length, synced: results.filter(r => r.action === 'created').length, results };
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Bulk sync failed: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  textSearch,
  nearbySearch,
  getPlaceDetails,
  findPlaceFromText,
  autocomplete,
  syncPlaceAsBusiness,
  bulkSyncNearby,
  mapPlaceTypeToCategory,
  requireKey,
};
