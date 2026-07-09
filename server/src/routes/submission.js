const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/submissions
router.post('/', [
  body('submissionType').isIn(['new_business', 'correction', 'photo', 'review', 'matatu_stage']),
  body('submittedById').isUUID(),
  body('data').isObject(),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { submissionType, submittedById, businessId, matatuStageId, data } = req.body;

    const submission = await prisma.userSubmission.create({
      data: {
        submissionType,
        status: 'pending',
        submittedById,
        businessId,
        matatuStageId,
        data: JSON.stringify(data),
      }
    });

    res.status(201).json({
      message: 'Submission received and is pending review.',
      submission: {
        id: submission.id,
        type: submission.submissionType,
        status: submission.status,
        createdAt: submission.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/submissions/me
router.get('/me', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const submissions = await prisma.userSubmission.findMany({
      where: { submittedById: userId },
      include: {
        business: { select: { name: true } },
        matatuStage: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(submissions.map(s => ({
      ...s,
      data: typeof s.data === 'string' ? JSON.parse(s.data) : s.data,
    })));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/submissions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const submission = await prisma.userSubmission.findUnique({
      where: { id: req.params.id },
      include: {
        submittedBy: { select: { displayName: true, phoneNumber: true } },
        business: true,
        matatuStage: true,
      }
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    res.json({
      ...submission,
      data: typeof submission.data === 'string' ? JSON.parse(submission.data) : submission.data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
