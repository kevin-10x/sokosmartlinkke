const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/cities
router.get('/', async (req, res, next) => {
  try {
    const { county, search, limit = 100 } = req.query;
    const where = {};
    if (county) where.county = { equals: county, mode: 'insensitive' };
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const cities = await prisma.city.findMany({
      where,
      take: parseInt(limit),
      orderBy: { population: 'desc' },
    });

    res.json({ cities, total: cities.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cities/:id
router.get('/:id', async (req, res, next) => {
  try {
    const city = await prisma.city.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { businesses: true, matatuStages: true }
        }
      }
    });

    if (!city) return res.status(404).json({ error: 'City not found' });

    res.json(city);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cities/:id/businesses
router.get('/:id/businesses', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { cityId: req.params.id, status: 'active' };
    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { category: true },
        orderBy: { rating: 'desc' },
      }),
      prisma.business.count({ where }),
    ]);

    res.json({ businesses, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/cities/:id/stages
router.get('/:id/stages', async (req, res, next) => {
  try {
    const stages = await prisma.matatuStage.findMany({
      where: { cityId: req.params.id, isActive: true },
      include: { routes: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ stages });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
