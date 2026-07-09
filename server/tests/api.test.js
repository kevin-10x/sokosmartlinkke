const request = require('supertest');
const app = require('../src/index');

describe('Search API', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/v1/search without params returns results', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  test('GET /api/v1/search with lat/lng returns nearby results', async () => {
    const res = await request(app)
      .get('/api/v1/search?lat=-1.2921&lng=36.8219&radius=10000');
    expect(res.status).toBe(200);
    expect(res.body.results).toBeDefined();
    expect(res.body.total).toBeDefined();
  });

  test('GET /api/v1/search with keyword filter', async () => {
    const res = await request(app).get('/api/v1/search?q=market');
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/search/autocomplete requires q param', async () => {
    const res = await request(app).get('/api/v1/search/autocomplete?q=na');
    expect(res.status).toBe(200);
    expect(res.body.businesses).toBeDefined();
  });
});

describe('Business API', () => {
  test('GET /api/v1/businesses/nearby requires lat/lng', async () => {
    const res = await request(app).get('/api/v1/businesses/nearby');
    expect(res.status).toBe(400);
  });

  test('GET /api/v1/businesses/nearby with coordinates', async () => {
    const res = await request(app)
      .get('/api/v1/businesses/nearby?lat=-1.2921&lng=36.8219');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});

describe('Matatu API', () => {
  test('GET /api/v1/matatu/stages/nearby', async () => {
    const res = await request(app)
      .get('/api/v1/matatu/stages/nearby?lat=-1.2921&lng=36.8219');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});

describe('Admin API', () => {
  test('GET /api/v1/admin/dashboard', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.recentSubmissions).toBeDefined();
  });
});
