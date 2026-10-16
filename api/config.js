import { services } from '../lib/core.mjs';

export default async function handler(req, res) {
  res.status(200).json({ services: await services() });
}
