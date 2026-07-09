const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { query, validationResult } = require('express-validator');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/search?q=&lat=&lng=&radius=&category=&page=&limit
router.get('/', [
  query('q').optional().trim().escape(),
  query('lat').optional().isFloat(),
  query('lng').optional().isFloat(),
  query('radius').optional().isInt({ min: 100, max: 50000 }).default(5000),
  query('category').optional().trim(),
  query('page').optional().isInt({ min: 1 }).default(1),
  query('limit').optional().isInt({ min: 1, max: 50 }).default(20),
  query('openNow').optional().isBoolean(),
  query('county').optional().trim(),
  query('city').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, lat, lng, radius, category, page, limit, openNow, county, city } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = { status: 'active' };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { keywords: { has: q.toLowerCase() } },
        { address: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }

    if (county) where.county = { equals: county, mode: 'insensitive' };
    if (city) {
      const cityRecord = await prisma.city.findFirst({ where: { name: { equals: city, mode: 'insensitive' } } });
      if (cityRecord) where.cityId = cityRecord.id;
    }
    if (openNow === 'true') where.isOpenNow = true;

    // Distance filter using raw query if lat/lng provided
    let businesses = [];
    let total = 0;

    if (lat && lng) {
      const latF = parseFloat(lat);
      const lngF = parseFloat(lng);
      const radiusM = parseInt(radius);

      // Use raw query for geospatial distance calculation
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
        ${q ? `AND (
          b.name ILIKE '%${q}%' OR 
          b.address ILIKE '%${q}%' OR 
          b.description ILIKE '%${q}%'
        )` : ''}
        ${category ? `AND c.slug = '${category}'` : ''}
        ${county ? `AND b.county ILIKE '%${county}%'` : ''}
        HAVING distance <= ${radiusM}
        ORDER BY distance ASC
        LIMIT ${take} OFFSET ${skip}
      `;

      businesses = await prisma.$queryRawUnsafe(rawQuery);

      // Count total
      const countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT b.id,
            (6371000 * acos(
              cos(radians(${latF})) * cos(radians(b.lat)) * 
              cos(radians(b.lng) - radians(${lngF})) + 
              sin(radians(${latF})) * sin(radians(b.lat))
            )) as distance
          FROM "Business" b
          LEFT JOIN "Category" c ON b."categoryId" = c.id
          WHERE b.status = 'active'
          ${q ? `AND (b.name ILIKE '%${q}%' OR b.address ILIKE '%${q}%' OR b.description ILIKE '%${q}%')` : ''}
          ${category ? `AND c.slug = '${category}'` : ''}
          ${county ? `AND b.county ILIKE '%${county}%'` : ''}
          HAVING distance <= ${radiusM}
        ) sub
      `;
      const countResult = await prisma.$queryRawUnsafe(countQuery);
      total = parseInt(countResult[0]?.total || 0);
    } else {
      // Regular query without geospatial
      [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where,
          include: { category: true, city: true },
          skip,
          take,
          orderBy: { rating: 'desc' }
        }),
        prisma.business.count({ where })
      ]);
    }

    res.json({
      results: businesses.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category_name || b.category?.name,
        categorySlug: b.category_slug || b.category?.slug,
        categoryColor: b.category_color || b.category?.color,
        distance: b.distance ? Math.round(b.distance) : null,
        rating: b.rating,
        reviewCount: b.reviewCount,
        isOpenNow: b.isOpenNow,
        isVerified: b.isVerified,
        lat: b.lat,
        lng: b.lng,
        address: b.address,
        phone: b.phonePrimary,
        photos: typeof b.photos === 'string' ? JSON.parse(b.photos) : b.photos,
        coverPhoto: b.coverPhoto,
        businessHours: typeof b.businessHours === 'string' ? JSON.parse(b.businessHours) : b.businessHours,
      })),
      total,
      page: parseInt(page),
      perPage: take,
      totalPages: Math.ceil(total / take),
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/v1/search/autocomplete?q=
router.get('/autocomplete', [
  query('q').trim().isLength({ min: 2 }).escape(),
], async (req, res, next) => {
  try {
    const { q } = req.query;

    const [businesses, cities, stages] = await Promise.all([
      prisma.business.findMany({
        where: {
          status: 'active',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { keywords: { has: q.toLowerCase() } },
          ]
        },
        select: { id: true, name: true, slug: true, category: { select: { name: true, slug: true } } },
        take: 5,
      }),
      prisma.city.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, county: true },
        take: 3,
      }),
      prisma.matatuStage.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { commonNames: { has: q } },
          ]
        },
        select: { id: true, name: true, address: true },
        take: 3,
      }),
    ]);

    res.json({
      businesses: businesses.map(b => ({ ...b, type: 'business' })),
      cities: cities.map(c => ({ ...c, type: 'city' })),
      stages: stages.map(s => ({ ...s, type: 'matatu_stage' })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
