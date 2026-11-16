import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const required = ['ADMIN_PASSWORD','R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME','R2_PUBLIC_BASE_URL'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}
const app = express();
const port = Number(process.env.PORT || 8787);
const bucket = process.env.R2_BUCKET_NAME;
const publicBase = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('video/');
    cb(ok ? null : new Error('Only PDF and video files are allowed.'), ok);
  }
});

function auth(req, res, next) {
  const password = req.headers['x-admin-password'] || req.body?.password || req.query.password;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }
  next();
}
function safeName(name) {
  const ext = path.extname(name).toLowerCase();
  const stem = path.basename(name, ext)
    .normalize('NFKD').replace(/[^\w-]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '').toLowerCase().slice(0, 70) || 'media';
  return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${stem}${ext}`;
}
async function getCatalog() {
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: 'catalog.json' }));
    return JSON.parse(await result.Body.transformToString());
  } catch (e) {
    if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return [];
    throw e;
  }
}
async function saveCatalog(items) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket, Key: 'catalog.json',
    Body: JSON.stringify(items, null, 2),
    ContentType: 'application/json; charset=utf-8',
    CacheControl: 'public, max-age=60'
  }));
}
app.use(express.static('public'));
app.get('/api/items', auth, async (_req, res) => {
  try { res.json(await getCatalog()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/upload', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a PDF or video first.' });
    const title = (req.body.title || path.parse(req.file.originalname).name).trim().slice(0, 120);
    const category = (req.body.category || 'General').trim().slice(0, 60);
    const description = (req.body.description || '').trim().slice(0, 500);
    const key = `media/${safeName(req.file.originalname)}`;
    const task = new Upload({
      client: s3,
      params: {
        Bucket: bucket, Key: key, Body: req.file.buffer,
        ContentType: req.file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable'
      },
      queueSize: 2,
      partSize: 8 * 1024 * 1024
    });
    await task.done();
    const item = {
      id: crypto.randomUUID(),
      title, category, description,
      type: req.file.mimetype === 'application/pdf' ? 'pdf' : 'video',
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      key,
      url: `${publicBase}/${key}`,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };
    const catalog = await getCatalog();
    catalog.unshift(item);
    await saveCatalog(catalog);
    res.json({ ok: true, item });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Upload failed.' });
  }
});
app.delete('/api/items/:id', auth, async (req, res) => {
  try {
    const catalog = await getCatalog();
    const item = catalog.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: item.key }));
    await saveCatalog(catalog.filter(x => x.id !== req.params.id));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message }));
app.listen(port, '127.0.0.1', () => {
  console.log(`Admin panel running at http://localhost:${port}`);
  console.log('This server is private to this PC (127.0.0.1). Keep this terminal open.');
});
