// server/src/routes/merchants.js
import express from 'express';
import { db } from '../db.js';
import { merchant, user } from '../schema.js';
import { eq } from 'drizzle-orm';

// 🔐 Auth middleware (default export is verifyJwt → auth())
import auth from '../middleware/auth.js';
import { resolveLocalUser, canManageMerchant } from '../authz/index.js';

// 📦 File upload & S3
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

console.log('📦  merchant router loaded');

// ────────────────────────────────────────────────────────────────
// Multer setup: in-memory storage (we pipe buffer into S3)
// ────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ────────────────────────────────────────────────────────────────
// S3 client setup
// ────────────────────────────────────────────────────────────────
const REGION = (process.env.AWS_REGION || "us-east-1").trim();
const LOGO_BUCKET = process.env.AWS_S3_MERCHANT_LOGO_BUCKET;

const LOGO_BASE_URL =
  process.env.AWS_S3_MERCHANT_LOGO_BASE_URL ||
  (LOGO_BUCKET ? `https://${LOGO_BUCKET}.s3.${REGION}.amazonaws.com` : null);

const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

if (!accessKeyId || !secretAccessKey) {
  console.error("❌ Missing AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY");
}

// ✅ DO NOT pass session token at all
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// helper to map mimetype → extension
function getExtensionFromMime(mime) {
  if (!mime) return 'bin';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/svg+xml') return 'svg';
  return 'bin';
}

// ────────────────────────────────────────────────────────────────
// GET all merchants
// ────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  console.log('📦  GET /api/merchant hit');
  try {
    const allMerchant = await db.select().from(merchant);
    console.log(`📦  returning ${allMerchant.length} merchant`);
    res.json(allMerchant);
  } catch (err) {
    console.error('📦  error in GET /merchant', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// GET merchants owned by the current user (admin sees all)
// ────────────────────────────────────────────────────────────────
router.get('/mine', auth(), resolveLocalUser, async (req, res, next) => {
  console.log('📦  GET /api/v1/merchants/mine hit');
  try {
    const dbUser = req.dbUser;

    if (dbUser.role === 'admin') {
      const all = await db.select().from(merchant);
      return res.json(all);
    }

    const owned = await db
      .select()
      .from(merchant)
      .where(eq(merchant.ownerId, dbUser.id));

    return res.json(owned);
  } catch (err) {
    console.error('📦  error in GET /merchants/mine', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// GET a single merchant by ID
// ────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  console.log('📦  GET /api/merchant/' + req.params.id);
  try {
    const [row] = await db
      .select()
      .from(merchant)
      .where(eq(merchant.id, req.params.id));

    if (!row) {
      console.log('📦  merchant not found');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    res.json(row);
  } catch (err) {
    console.error('📦  error in GET /merchant/:id', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// POST create a new merchant
// ────────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/merchant', req.body);
  try {
    const { name, logo_url, owner_id } = req.body;

    const [newMerchant] = await db
      .insert(merchant)
      .values({
        name,
        logoUrl: logo_url, // maps incoming snake_case to Drizzle field
        ownerId: owner_id,
      })
      .returning();

    res.status(201).json(newMerchant);
  } catch (err) {
    console.error('📦  error in POST /merchant', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// PUT update an existing merchant
// ────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  console.log('📦  PUT /api/merchant/' + req.params.id, req.body);
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.logo_url !== undefined) updates.logoUrl = req.body.logo_url;
    if (req.body.owner_id !== undefined) updates.ownerId = req.body.owner_id;

    const [updated] = await db
      .update(merchant)
      .set(updates)
      .where(eq(merchant.id, req.params.id))
      .returning();

    if (!updated) {
      console.log('📦  merchant not found for update');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    console.log('📦  updated merchant id:', updated.id);
    res.json(updated);
  } catch (err) {
    console.error('📦  error in PUT /merchant/:id', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// DELETE a merchant
// ────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  console.log('📦  DELETE /api/merchant/' + req.params.id);
  try {
    const result = await db
      .delete(merchant)
      .where(eq(merchant.id, req.params.id));

    if (!result.count) {
      console.log('📦  merchant not found for delete');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    console.log('📦  deleted merchant count:', result.count);
    res.json({ message: 'Merchant deleted' });
  } catch (err) {
    console.error('📦  error in DELETE /merchant/:id', err);
    next(err);
  }
});

// ────────────────────────────────────────────────────────────────
// Multer error handler middleware
// Catches MulterError instances and converts them to user-friendly JSON responses
// ────────────────────────────────────────────────────────────────
function handleMulterError(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5 MB.' });
  }
  if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field. Use "file" as the field name.' });
  }
  // If it's a multer error or any other file upload error, handle it
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  // If no error, pass to next middleware
  next();
}

// ────────────────────────────────────────────────────────────────
// POST /api/v1/merchants/:id/logo
// Upload/update logo for a merchant (owner only)
// Field name: "file" in multipart/form-data
// ────────────────────────────────────────────────────────────────
router.post(
  '/:id/logo',
  auth(),               // ⬅️ verify Cognito JWT → sets req.user
  resolveLocalUser,
  upload.single('file'),
  handleMulterError,    // ⬅️ handle multer errors (file size, etc.)
  async (req, res, next) => {
    const merchantId = req.params.id;
    console.log('📦  POST /api/v1/merchants/' + merchantId + '/logo');

    try {
      console.log(
        '📦  req.file?', !!req.file,
        'bucket=', LOGO_BUCKET,
        'baseUrl=', LOGO_BASE_URL
      );

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const dbUser = req.dbUser;

      // 3) Ownership check (admin OR merchant owner)
      const allowed = await canManageMerchant(dbUser, merchantId);
      if (!allowed) {
        return res.status(403).json({ error: 'Forbidden: You do not own this merchant' });
      }

      // 4) Validate file type (must be done before S3 check to ensure validation always runs)
      const { mimetype, buffer, originalname } = req.file;
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(mimetype)) {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      // 5) If S3 is not configured in dev, just fake a URL so the UI works
      if (!LOGO_BUCKET || !LOGO_BASE_URL) {
        console.warn('📦  Logo bucket/base URL not configured – skipping S3, dev fake URL only');
        const ext = getExtensionFromMime(mimetype);
        const fakeUrl = `/dev-merchant-logo/${merchantId}.${ext}`;

        const [updatedDev] = await db
          .update(merchant)
          .set({ logoUrl: fakeUrl })
          .where(eq(merchant.id, merchantId))
          .returning();

        console.log('📦  updated merchant logo (dev fake) id:', updatedDev.id);
        return res.json({
          id: updatedDev.id,
          name: updatedDev.name,
          logo_url: updatedDev.logoUrl,
          owner_id: updatedDev.ownerId,
        });
      }

      // 6) Real S3 upload path

      const ext = getExtensionFromMime(mimetype);
      const safeName = originalname
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9.\-]/g, '');
      const randomSuffix = Math.random().toString(36).slice(2);
      const key = `logos/merchants/${merchantId}/logo-${randomSuffix}.${ext}`;

      const putParams = {
        Bucket: LOGO_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      };      
      
      console.log("AWS key prefix", {
        accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID?.slice(0, 4),
        sessionTokenPrefix: process.env.AWS_SESSION_TOKEN?.slice(0, 4),
      });
      
      console.time('s3:putObject');
      await s3.send(new PutObjectCommand(putParams));
      console.timeEnd('s3:putObject');

      const logoUrl = `${LOGO_BASE_URL}/${key}`;

      console.time('db:updateMerchantLogo');
      const [updated] = await db
        .update(merchant)
        .set({ logoUrl })
        .where(eq(merchant.id, merchantId))
        .returning();
      console.timeEnd('db:updateMerchantLogo');

      console.log('📦  updated merchant logo id:', updated.id);

      return res.json({
        id: updated.id,
        name: updated.name,
        logo_url: updated.logoUrl,
        owner_id: updated.ownerId,
      });
    } catch (err) {
      console.error('📦  error in POST /merchant/:id/logo', err);
      return next(err);
    }
  },
);

export default router;
