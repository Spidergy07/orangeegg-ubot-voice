import { tts, limited } from '../lib/core.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'x';
  if (limited('tts:' + ip)) return res.status(204).end();
  const { text, lang } = req.body || {};
  const audio = await tts(text, lang);
  if (!audio) return res.status(204).end();
  res.setHeader('Content-Type', 'audio/mpeg');
  res.status(200).send(audio);
}
