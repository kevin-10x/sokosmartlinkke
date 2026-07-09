const axios = require('axios');

jest.mock('axios');

const mockPrismaInstance = {
  business: { findUnique: jest.fn(), create: jest.fn() },
  category: { findUnique: jest.fn(), findFirst: jest.fn() },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaInstance),
}));

const googlePlaces = require('../src/services/googlePlaces');

describe('Google Places Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_PLACES_API_KEY;
  });

  test('requireKey throws if no API key configured', () => {
    delete process.env.GOOGLE_PLACES_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;
    expect(() => googlePlaces.requireKey()).toThrow('Google API key not configured');
  });

  test('textSearch returns results from Google Places API', async () => {
    const mockResponse = {
      data: {
        status: 'OK',
        results: [
          { place_id: 'abc123', name: 'Test Market', formatted_address: 'Nairobi, Kenya' },
          { place_id: 'def456', name: 'Test Shop', formatted_address: 'Mombasa, Kenya' },
        ],
      },
    };
    axios.get.mockResolvedValue(mockResponse);

    const results = await googlePlaces.textSearch('markets in Nairobi');
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Test Market');
    expect(axios.get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      expect.objectContaining({
        params: expect.objectContaining({
          query: 'markets in Nairobi',
          key: 'test-api-key',
        }),
      })
    );
  });

  test('textSearch handles ZERO_RESULTS', async () => {
    axios.get.mockResolvedValue({ data: { status: 'ZERO_RESULTS', results: [] } });
    const results = await googlePlaces.textSearch('xyznonexistent');
    expect(results).toEqual([]);
  });

  test('textSearch throws on API error', async () => {
    axios.get.mockResolvedValue({ data: { status: 'INVALID_REQUEST', error_message: 'Invalid' } });
    await expect(googlePlaces.textSearch('test')).rejects.toThrow('Google Places API error');
  });

  test('nearbySearch returns results with location params', async () => {
    axios.get.mockResolvedValue({
      data: { status: 'OK', results: [{ place_id: '1', name: 'Nearby Place' }] },
    });
    const results = await googlePlaces.nearbySearch(-1.2921, 36.8219, { radius: 5000, type: 'market' });
    expect(results).toHaveLength(1);
    expect(axios.get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      expect.objectContaining({
        params: expect.objectContaining({
          location: '-1.2921,36.8219',
          radius: 5000,
          type: 'market',
        }),
      })
    );
  });

  test('getPlaceDetails fetches and returns place details', async () => {
    const mockPlace = {
      place_id: 'abc123',
      name: 'Nairobi Market',
      formatted_address: 'Nairobi, Kenya',
      geometry: { location: { lat: -1.2921, lng: 36.8219 } },
      rating: 4.2,
      user_ratings_total: 150,
      types: ['market', 'food'],
    };
    axios.get.mockResolvedValue({ data: { status: 'OK', result: mockPlace } });

    const result = await googlePlaces.getPlaceDetails('abc123');
    expect(result.name).toBe('Nairobi Market');
    expect(result.rating).toBe(4.2);
  });

  test('autocomplete returns predictions', async () => {
    axios.get.mockResolvedValue({
      data: {
        status: 'OK',
        predictions: [
          {
            place_id: 'pred1',
            description: 'Nairobi, Kenya',
            structured_formatting: { main_text: 'Nairobi', secondary_text: 'Kenya' },
            types: ['locality'],
          },
        ],
      },
    });

    const predictions = await googlePlaces.autocomplete('Nairo');
    expect(predictions).toHaveLength(1);
    expect(predictions[0].mainText).toBe('Nairobi');
  });

  test('findPlaceFromText returns candidate or null', async () => {
    axios.get.mockResolvedValue({
      data: { status: 'OK', candidates: [{ place_id: 'cand1', name: 'Nairobi' }] },
    });
    const result = await googlePlaces.findPlaceFromText('Nairobi');
    expect(result.place_id).toBe('cand1');

    axios.get.mockResolvedValue({ data: { status: 'ZERO_RESULTS', candidates: [] } });
    const noResult = await googlePlaces.findPlaceFromText('xyz123nonexistent');
    expect(noResult).toBeNull();
  });

  test('mapPlaceTypeToCategory maps correctly', () => {
    expect(googlePlaces.mapPlaceTypeToCategory(['supermarket', 'store'])).toBe('shop');
    expect(googlePlaces.mapPlaceTypeToCategory(['restaurant', 'food'])).toBe('food');
    expect(googlePlaces.mapPlaceTypeToCategory(['hospital', 'health'])).toBe('health');
    expect(googlePlaces.mapPlaceTypeToCategory(['bus_station', 'transit_station'])).toBe('matatu-stage');
    expect(googlePlaces.mapPlaceTypeToCategory(['unknown_type'])).toBe('shop');
    expect(googlePlaces.mapPlaceTypeToCategory(null)).toBe('shop');
  });
});

describe('syncPlaceAsBusiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_PLACES_API_KEY;
  });

  test('creates a new business from a place', async () => {
    const mockPlace = {
      place_id: 'new_place_1',
      name: 'Test Business',
      formatted_address: '123 Test St, Nairobi',
      geometry: { location: { lat: -1.2921, lng: 36.8219 } },
      rating: 4.0,
      user_ratings_total: 50,
      opening_hours: { open_now: true, weekday_text: ['Monday: 8am-6pm'] },
      photos: [{ photo_reference: 'photo1' }],
      types: ['store'],
    };
    axios.get.mockResolvedValue({ data: { status: 'OK', result: mockPlace } });

    mockPrismaInstance.business.findUnique.mockResolvedValue(null);
    mockPrismaInstance.business.create.mockResolvedValue({ id: 'new_biz_id', name: 'Test Business', googlePlaceId: 'new_place_1' });

    const result = await googlePlaces.syncPlaceAsBusiness('new_place_1', 'category-uuid');
    expect(result.action).toBe('created');
    expect(result.business.name).toBe('Test Business');
    expect(mockPrismaInstance.business.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          googlePlaceId: 'new_place_1',
          source: 'google_places',
        }),
      })
    );
  });

  test('returns existing business if already synced', async () => {
    mockPrismaInstance.business.findUnique.mockResolvedValue({ id: 'existing_id', name: 'Existing Biz' });

    const result = await googlePlaces.syncPlaceAsBusiness('existing_place', 'cat-id');
    expect(result.action).toBe('exists');
    expect(result.business.name).toBe('Existing Biz');
    expect(mockPrismaInstance.business.create).not.toHaveBeenCalled();
  });
});

describe('Places Routes', () => {
  const express = require('express');
  const request = require('supertest');

  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';

    app = express();
    app.use(express.json());
    const placesRoutes = require('../src/routes/places');
    app.use('/api/v1/places', placesRoutes);
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ error: err.message });
    });
  });

  afterEach(() => {
    delete process.env.GOOGLE_PLACES_API_KEY;
  });

  test('GET /api/v1/places/status returns configured status', async () => {
    const res = await request(app).get('/api/v1/places/status');
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(true);
    expect(res.body.keyPrefix).toBeTruthy();
  });

  test('GET /api/v1/places/autocomplete requires input param', async () => {
    const res = await request(app).get('/api/v1/places/autocomplete');
    expect(res.status).toBe(400);
  });

  test('GET /api/v1/places/search requires q param', async () => {
    const res = await request(app).get('/api/v1/places/search');
    expect(res.status).toBe(400);
  });

  test('GET /api/v1/places/search returns places from API', async () => {
    axios.get.mockResolvedValue({
      data: {
        status: 'OK',
        results: [
          { place_id: 'p1', name: 'Place 1', formatted_address: 'Addr 1' },
          { place_id: 'p2', name: 'Place 2', formatted_address: 'Addr 2' },
        ],
      },
    });

    const res = await request(app).get('/api/v1/places/search?q=markets+nairobi');
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  test('GET /api/v1/places/nearby requires lat/lng', async () => {
    const res = await request(app).get('/api/v1/places/nearby');
    expect(res.status).toBe(400);
  });

  test('GET /api/v1/places/nearby with coordinates returns results', async () => {
    axios.get.mockResolvedValue({
      data: {
        status: 'OK',
        results: [{ place_id: 'n1', name: 'Nearby', vicinity: 'Near here' }],
      },
    });

    const res = await request(app).get('/api/v1/places/nearby?lat=-1.2921&lng=36.8219');
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
  });

  test('GET /api/v1/places/details requires place_id', async () => {
    const res = await request(app).get('/api/v1/places/details');
    expect(res.status).toBe(400);
  });

  test('GET /api/v1/places/details returns place details', async () => {
    axios.get.mockResolvedValue({
      data: {
        status: 'OK',
        result: { place_id: 'd1', name: 'Details Place', rating: 4.5 },
      },
    });

    const res = await request(app).get('/api/v1/places/details?place_id=d1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Details Place');
  });

  test('POST /api/v1/places/sync creates business from place', async () => {
    axios.get.mockResolvedValue({
      data: {
        status: 'OK',
        result: {
          place_id: 'sync1',
          name: 'Synced Business',
          formatted_address: 'Addr',
          geometry: { location: { lat: -1.29, lng: 36.82 } },
          rating: 4.0,
          user_ratings_total: 10,
          types: ['store'],
        },
      },
    });
    mockPrismaInstance.business.findUnique.mockResolvedValue(null);
    mockPrismaInstance.business.create.mockResolvedValue({ id: 'new_biz', name: 'Synced Business', googlePlaceId: 'sync1' });
    mockPrismaInstance.category.findFirst.mockResolvedValue({ id: 'cat_shop' });

    const res = await request(app)
      .post('/api/v1/places/sync')
      .send({ place_id: 'sync1' });

    expect(res.status).toBe(200);
    expect(res.body.action).toBe('created');
  });

  test('POST /api/v1/places/sync requires place_id', async () => {
    const res = await request(app).post('/api/v1/places/sync').send({});
    expect(res.status).toBe(400);
  });
});
