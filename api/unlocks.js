import { getUnlocks } from '../lib/core.mjs';

export default async function handler(req, res) {
  const slug = String(req.query.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  res.status(200).json(await getUnlocks(slug));
}
