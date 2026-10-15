import { services } from '../lib/core.mjs';

export default function handler(req, res) {
  res.status(200).json({ services: services() });
}
