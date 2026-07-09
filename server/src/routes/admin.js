const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check admin role (simplified - in production use JWT)
const requireAdmin = (req, res, next) => {
  // In production: verify JWT token and check role === 'admin'
  // For now, pass through with a warning header
  res.setHeader('X-Admin-Check', 'bypassed-in-dev');
  next();
};

// GET /api/v1/admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res, next) => {
  try {
    const [
      totalBusinesses,
      pendingBusinesses,
      totalStages,
      pendingStages,
      totalSubmissions,
      pendingSubmissions,
      totalUsers,
      totalReviews,
      recentSubmissions,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { status: 'pending_review' } }),
      prisma.matatuStage.count(),
      prisma.matatuStage.count({ where: { isActive: false } }),
      prisma.userSubmission.count(),
      prisma.userSubmission.count({ where: { status: 'pending' } }),
      prisma.user.count(),
      prisma.review.count(),
      prisma.userSubmission.findMany({
        where: { status: 'pending' },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          submittedBy: { select: { displayName: true, phoneNumber: true } },
          business: { select: { name: true } },
          matatuStage: { select: { name: true } },
        }
      }),
    ]);

    res.json({
      stats: {
        totalBusinesses,
        pendingBusinesses,
        totalStages,
        pendingStages,
        totalSubmissions,
        pendingSubmissions,
        totalUsers,
        totalReviews,
      },
      recentSubmissions: recentSubmissions.map(s => ({
        id: s.id,
        type: s.submissionType,
        status: s.status,
        submittedBy: s.submittedBy?.displayName || s.submittedBy?.phoneNumber,
        targetName: s.business?.name || s.matatuStage?.name || 'N/A',
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/submissions
router.get('/submissions', requireAdmin, async (req, res, next) => {
  try {
    const { status = 'pending', type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status !== 'all') where.status = status;
    if (type) where.submissionType = type;

    const [submissions, total] = await Promise.all([
      prisma.userSubmission.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          submittedBy: { select: { displayName: true, phoneNumber: true } },
          business: { select: { name: true, status: true } },
          matatuStage: { select: { name: true, isActive: true } },
        }
      }),
      prisma.userSubmission.count({ where }),
    ]);

    res.json({
      submissions: submissions.map(s => ({
        ...s,
        data: typeof s.data === 'string' ? JSON.parse(s.data) : s.data,
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/submissions/:id/approve
router.post('/submissions/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const { adminNotes } = req.body;

    const submission = await prisma.userSubmission.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        adminNotes,
        reviewedAt: new Date(),
      },
      include: {
        business: true,
        matatuStage: true,
      }
    });

    // Activate the related resource
    if (submission.businessId) {
      await prisma.business.update({
        where: { id: submission.businessId },
        data: { status: 'active', isVerified: true }
      });
    }
    if (submission.matatuStageId) {
      await prisma.matatuStage.update({
        where: { id: submission.matatuStageId },
        data: { isActive: true }
      });
    }

    res.json({ message: 'Submission approved', submission });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/admin/submissions/:id/reject
router.post('/submissions/:id/reject', requireAdmin, async (req, res, next) => {
  try {
    const { adminNotes } = req.body;

    const submission = await prisma.userSubmission.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        adminNotes,
        reviewedAt: new Date(),
      }
    });

    res.json({ message: 'Submission rejected', submission });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/businesses
router.get('/businesses', requireAdmin, async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status !== 'all') where.status = status;

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          city: { select: { name: true } },
          claimedBy: { select: { displayName: true, phoneNumber: true } },
          _count: { select: { reviews: true } }
        }
      }),
      prisma.business.count({ where }),
    ]);

    res.json({ businesses, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/admin/businesses/:id/status
router.put('/businesses/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const business = await prisma.business.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ message: `Business status updated to ${status}`, business });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/admin/stages
router.get('/stages', requireAdmin, async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status === 'pending') where.isActive = false;
    if (status === 'active') where.isActive = true;

    const [stages, total] = await Promise.all([
      prisma.matatuStage.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          city: { select: { name: true } },
          _count: { select: { routes: true } }
        }
      }),
      prisma.matatuStage.count({ where }),
    ]);

    res.json({ stages, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/admin/stages/:id/activate
router.put('/stages/:id/activate', requireAdmin, async (req, res, next) => {
  try {
    const stage = await prisma.matatuStage.update({
      where: { id: req.params.id },
      data: { isActive: true }
    });
    res.json({ message: 'Stage activated', stage });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
