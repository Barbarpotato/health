const express = require('express');
const supabase = require('../lib/supabase');
const VALID_CATEGORIES = require('../lib/categories');
const { adminToken, requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.cookie('admin_token', adminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: process.env.ADMIN_USERNAME });
});

// Admin can add users, but never delete them.
router.post('/users', requireAdmin, async (req, res) => {
  const { full_name } = req.body;
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'full_name required' });
  }
  const { data, error } = await supabase
    .from('users')
    .insert({ full_name: full_name.trim() })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Activity report: filter by category/user/date range/caption search, sort, paginate.
router.get('/report', requireAdmin, async (req, res) => {
  const {
    category,
    user_id,
    date_from,
    date_to,
    search,
    sort_by = 'created_at',
    sort_dir = 'desc',
    limit = '25',
    offset = '0',
  } = req.query;

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const sortableColumns = ['created_at', 'category'];
  const sortColumn = sortableColumns.includes(sort_by) ? sort_by : 'created_at';
  const ascending = sort_dir === 'asc';

  const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 200);
  const pageOffset = Math.max(Number(offset) || 0, 0);

  let query = supabase
    .from('activities')
    .select('*, photos(*), users(full_name)', { count: 'exact' })
    .order(sortColumn, { ascending })
    .range(pageOffset, pageOffset + pageSize - 1);

  if (category) query = query.eq('category', category);
  if (user_id) query = query.eq('user_id', user_id);
  if (date_from) query = query.gte('created_at', date_from);
  if (date_to) query = query.lte('created_at', date_to);
  if (search) query = query.ilike('caption', `%${search}%`);

  const { data, error, count } = await query;
  if (error) return res.status(400).json({ error: error.message });

  res.json({ data, count, limit: pageSize, offset: pageOffset });
});

module.exports = router;
