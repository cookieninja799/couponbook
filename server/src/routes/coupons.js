const router = require('express').Router();
const prisma = require('../prisma');

// GET /api/v1/coupons
router.get('/', async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { deletedAt: null },
      orderBy: { validFrom: 'desc' }
    });
    res.json(coupons);
  } catch (e) { next(e) }
});

// POST /api/v1/coupons
router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    const created = await prisma.coupon.create({ data });
    res.status(201).json(created);
  } catch (e) { next(e) }
});

module.exports = router;
