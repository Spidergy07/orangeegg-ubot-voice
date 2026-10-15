import { chat, limited } from '../lib/core.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'x';
  if (limited(ip)) return res.status(429).json({ reply: 'Too many requests, please wait a few minutes.' });
  const { messages = [], state = {} } = req.body || {};
  res.status(200).json(await chat(messages, state));
}
