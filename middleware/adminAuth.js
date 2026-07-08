const crypto = require('crypto');

function adminToken() {
  return crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD || '')
    .update(process.env.ADMIN_USERNAME || '')
    .digest('hex');
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    cookies[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return cookies;
}

function requireAdmin(req, res, next) {
  const token = parseCookies(req.headers.cookie).admin_token;
  const expected = adminToken();
  const valid =
    !!token &&
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  if (!valid) return res.status(401).json({ error: 'unauthorized' });
  next();
}

module.exports = { adminToken, parseCookies, requireAdmin };
