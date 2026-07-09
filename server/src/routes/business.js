const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/businesses/nearby
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, limit = 20 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    const radiusM = parseInt(radius);

    const rawQuery = `
      SELECT b.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
        (6371000 * acos(
          cos(radians(${latF})) * cos(radians(b.lat)) * 
          cos(radians(b.lng) - radians(${lngF})) + 
          sin(radians(${latF})) * sin(radians(b.lat))
        )) as distance
      FROM "Business" b
      LEFT JOIN "Category" c ON b."categoryId" = c.id
      WHERE b.status = 'active'
      HAVING distance <= ${radiusM}
      ORDER BY distance ASC
      LIMIT ${parseInt(limit)}
    `;

    const businesses = await prisma.$queryRawUnsafe(rawQuery);

    res.json({
      results: businesses.map(b => ({
        id: b.id,
        name: b.name,
        category: b.category_name,
        distance: Math.round(b.distance),
        rating: b.rating,
        reviewCount: b.reviewCount,
        isOpenNow: b.isOpenNow,
        lat: b.lat,
        lng: b.lng,
        address: b.address,
        phone: b.phonePrimary,
        photos: typeof b.photos === 'string' ? JSON.parse(b.photos) : b.photos,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/businesses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        city: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { displayName: true, avatarUrl: true } } }
        },
        _count: { select: { reviews: true } }
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json({
      ...business,
      photos: typeof business.photos === 'string' ? JSON.parse(business.photos) : business.photos,
      businessHours: typeof business.businessHours === 'string' ? JSON.parse(business.businessHours) : business.businessHours,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/businesses (create)
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 200 }),
  body('lat').isFloat(),
  body('lng').isFloat(),
  body('address').trim().isLength({ min: 5 }),
  body('categoryId').isUUID(),
  body('phonePrimary').optional().isMobilePhone('any'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const data = req.body;
    data.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    data.status = 'pending';
    data.source = 'user_submitted';

    const business = await prisma.business.create({ data });
    res.status(201).json(business);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/businesses/:id
router.put('/:id', async (req, res, next) => {
  try {
    const business = await prisma.business.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(business);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/businesses/:id/claim
router.post('/:id/claim', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const business = await prisma.business.update({
      where: { id: req.params.id },
      data: { isClaimed: true, claimedById: userId, status: 'pending_review' }
    });
    res.json({ message: 'Claim submitted for review', business });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/businesses/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { businessId: req.params.id },
      include: { user: { select: { displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/businesses/:id/reviews
router.post('/:id/reviews', [
  body('rating').isInt({ min: 1, max: 5 }),
  body('text').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const review = await prisma.review.create({
      data: {
        ...req.body,
        businessId: req.params.id,
      }
    });

    // Update business rating
    const avg = await prisma.review.aggregate({
      where: { businessId: req.params.id },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await prisma.business.update({
      where: { id: req.params.id },
      data: { rating: avg._avg.rating || 0, reviewCount: avg._count.rating }
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
