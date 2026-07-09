const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { query, body, validationResult } = require('express-validator');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/matatu/stages/nearby
router.get('/stages/nearby', [
  query('lat').isFloat(),
  query('lng').isFloat(),
  query('radius').optional().isInt({ min: 100, max: 50000 }).default(5000),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { lat, lng, radius } = req.query;
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    const radiusM = parseInt(radius);

    const rawQuery = `
      SELECT s.*, 
        (6371000 * acos(
          cos(radians(${latF})) * cos(radians(s.lat)) * 
          cos(radians(s.lng) - radians(${lngF})) + 
          sin(radians(${latF})) * sin(radians(s.lat))
        )) as distance
      FROM "MatatuStage" s
      WHERE s."isActive" = true
      HAVING distance <= ${radiusM}
      ORDER BY distance ASC
    `;

    const stages = await prisma.$queryRawUnsafe(rawQuery);

    // Get routes for each stage
    const stageIds = stages.map(s => `'${s.id}'`).join(',');
    let routes = [];
    if (stageIds.length > 0) {
      routes = await prisma.$queryRawUnsafe(`
        SELECT * FROM "MatatuRoute" 
        WHERE "originStageId" IN (${stageIds})
        AND "isActive" = true
      `);
    }

    const stagesWithRoutes = stages.map(s => ({
      ...s,
      distance: Math.round(s.distance),
      routes: routes.filter(r => r.originStageId === s.id).map(r => ({
        id: r.id,
        routeNumber: r.routeNumber,
        saccoName: r.saccoName,
        destination: r.destination,
        estimatedFare: r.estimatedFare,
        estimatedDuration: r.estimatedDuration,
        frequency: r.frequency,
      })),
    }));

    res.json({ results: stagesWithRoutes });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/matatu/stages/:id
router.get('/stages/:id', async (req, res, next) => {
  try {
    const stage = await prisma.matatuStage.findUnique({
      where: { id: req.params.id },
      include: {
        routes: { where: { isActive: true } },
        city: true,
      }
    });

    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    res.json({
      ...stage,
      facilities: typeof stage.facilities === 'string' ? JSON.parse(stage.facilities) : stage.facilities,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/matatu/routes
router.get('/routes', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from) return res.status(400).json({ error: 'from (originStageId) is required' });

    const where = { originStageId: from, isActive: true };
    if (to) where.destination = { contains: to, mode: 'insensitive' };

    const routes = await prisma.matatuRoute.findMany({
      where,
      include: { originStage: { select: { name: true, lat: true, lng: true } } },
      orderBy: { estimatedFare: 'asc' },
    });

    res.json({ results: routes });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/matatu/stages (crowdsourced submission)
router.post('/stages', [
  body('name').trim().isLength({ min: 2, max: 200 }),
  body('lat').isFloat(),
  body('lng').isFloat(),
  body('address').optional().trim(),
  body('county').trim(),
  body('stageType').optional().isIn(['terminal', 'stage', 'stop']),
  body('commonNames').optional().isArray(),
  body('facilities').optional().isObject(),
  body('operatingHours').optional().trim(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { submittedById, ...stageData } = req.body;

    // Create stage as pending
    const stage = await prisma.matatuStage.create({
      data: {
        ...stageData,
        isActive: false, // Requires admin approval
      }
    });

    // Create user submission record
    await prisma.userSubmission.create({
      data: {
        submissionType: 'matatu_stage',
        status: 'pending',
        submittedById,
        matatuStageId: stage.id,
        data: JSON.stringify(stageData),
      }
    });

    res.status(201).json({
      message: 'Matatu stage submitted for review. Thank you for contributing!',
      stage: { id: stage.id, name: stage.name, status: 'pending' }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/matatu/routes
router.post('/routes', [
  body('routeNumber').trim().isLength({ min: 1, max: 20 }),
  body('originStageId').isUUID(),
  body('destination').trim().isLength({ min: 2 }),
  body('saccoName').optional().trim(),
  body('estimatedFare').optional().isFloat(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const route = await prisma.matatuRoute.create({ data: req.body });
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
