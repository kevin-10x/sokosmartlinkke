const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { query, body, validationResult } = require('express-validator');
const router = express.Router();
const prisma = new PrismaClient();
const googlePlaces = require('../services/googlePlaces');

function handleErrors(err, res) {
  console.error('Places API error:', err.message);
  const status = err.status || 500;
  const message = err.status === 503 ? err.message : 'Google Places API error: ' + err.message;
  res.status(status).json({ error: message });
}

async function resolveCategory(slug) {
  if (!slug) return null;
  const cat = await prisma.category.findUnique({ where: { slug } });
  return cat ? cat.id : null;
}

router.get('/search', [
  query('q').trim().isLength({ min: 2 }),
  query('lat').optional().isFloat(),
  query('lng').optional().isFloat(),
  query('radius').optional().isInt({ min: 100, max: 50000 }),
  query('type').optional().trim(),
  query('maxResults').optional().isInt({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { q, lat, lng, radius, type, maxResults } = req.query;
    const options = {};
    if (lat && lng) options.location = `${lat},${lng}`;
    if (radius) options.radius = parseInt(radius);
    if (type) options.type = type;
    if (maxResults) options.maxResults = parseInt(maxResults);
    const places = await googlePlaces.textSearch(q, options);
    res.json({ results: places, total: places.length });
  } catch (err) {
    handleErrors(err, res);
  }
});

router.get('/nearby', [
  query('lat').isFloat(),
  query('lng').isFloat(),
  query('radius').optional().isInt({ min: 100, max: 50000 }),
  query('type').optional().trim(),
  query('keyword').optional().trim(),
  query('maxResults').optional().isInt({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { lat, lng, radius, type, keyword, maxResults } = req.query;
    const places = await googlePlaces.nearbySearch(parseFloat(lat), parseFloat(lng), {
      radius: radius ? parseInt(radius) : 5000,
      type,
      keyword,
      maxResults: maxResults ? parseInt(maxResults) : 20,
    });
    res.json({ results: places, total: places.length });
  } catch (err) {
    handleErrors(err, res);
  }
});

router.get('/details', [
  query('place_id').trim().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const place = await googlePlaces.getPlaceDetails(req.query.place_id);
    res.json(place);
  } catch (err) {
    handleErrors(err, res);
  }
});

router.get('/autocomplete', [
  query('input').trim().isLength({ min: 2 }),
  query('types').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { input, types } = req.query;
    const options = {};
    if (types) options.types = types;
    const predictions = await googlePlaces.autocomplete(input, options);
    res.json({ predictions });
  } catch (err) {
    handleErrors(err, res);
  }
});

router.post('/sync', [
  body('place_id').trim().isLength({ min: 1 }),
  body('category').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { place_id, category } = req.body;
    let categoryId = category ? await resolveCategory(category) : null;
    if (!categoryId) {
      const def = await prisma.category.findFirst({ where: { slug: 'shop' } });
      categoryId = def?.id;
    }
    if (!categoryId) return res.status(400).json({ error: 'No valid category found. Seed categories first.' });
    const result = await googlePlaces.syncPlaceAsBusiness(place_id, categoryId);
    res.json(result);
  } catch (err) {
    handleErrors(err, res);
  }
});

router.post('/sync-nearby', [
  body('lat').isFloat(),
  body('lng').isFloat(),
  body('category').optional().trim(),
  body('radius').optional().isInt({ min: 100, max: 50000 }),
  body('type').optional().trim(),
  body('keyword').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { lat, lng, category, radius, type, keyword } = req.body;
    let categoryId = category ? await resolveCategory(category) : null;
    if (!categoryId) {
      const def = await prisma.category.findFirst({ where: { slug: 'shop' } });
      categoryId = def?.id;
    }
    if (!categoryId) return res.status(400).json({ error: 'No valid category found. Seed categories first.' });
    const result = await googlePlaces.bulkSyncNearby(parseFloat(lat), parseFloat(lng), categoryId, {
      radius: radius ? parseInt(radius) : 5000,
      type,
      keyword,
    });
    res.json(result);
  } catch (err) {
    handleErrors(err, res);
  }
});

router.get('/status', async (req, res) => {
  try {
    googlePlaces.requireKey();
    const keyPreview = (process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '').slice(0, 6);
    res.json({
      configured: true,
      keyPrefix: keyPreview + '...',
      source: process.env.GOOGLE_PLACES_API_KEY ? 'GOOGLE_PLACES_API_KEY' : 'GOOGLE_MAPS_API_KEY',
    });
  } catch (err) {
    res.json({ configured: false, error: err.message });
  }
});

module.exports = router;
