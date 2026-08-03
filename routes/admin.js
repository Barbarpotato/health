const express = require('express');
const supabase = require('../lib/supabase');
const VALID_CATEGORIES = require('../lib/categories');
const POINTS_BY_CATEGORY = require('../lib/points');
const { BONUS_POINT_OPTIONS } = POINTS_BY_CATEGORY;
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
  res.clearCookie('admin_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

router.get('/me', requireAdmin, (req, res) => {
  res.json({ username: process.env.ADMIN_USERNAME });
});

// Admin can see username + password for every user.
router.get('/users', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, password')
    .order('full_name', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Admin can add users (and sets their password), but never delete them.
router.post('/users', requireAdmin, async (req, res) => {
  const { full_name, password } = req.body;
  if (!full_name || !full_name.trim() || !password) {
    return res.status(400).json({ error: 'full_name and password required' });
  }
  const { data, error } = await supabase
    .from('users')
    .insert({ full_name: full_name.trim(), password })
    .select('id, full_name, password')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Admin can (re)set a user's password. Still can't delete users.
router.put('/users/:id/password', requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'password required' });

  const { data, error } = await supabase
    .from('users')
    .update({ password })
    .eq('id', req.params.id)
    .select('id, full_name, password')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Activity report: filter by category/user/date range/caption search, sort, paginate.
router.get('/report', requireAdmin, async (req, res) => {
  const {
    category,
    user_id,
    date_from,
    date_to,
    search,
    points_awarded,
    sort_by = 'created_at',
    sort_dir = 'desc',
    limit = '25',
    offset = '0',
  } = req.query;

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  if (points_awarded && !['true', 'false'].includes(points_awarded)) {
    return res.status(400).json({ error: 'points_awarded must be true or false' });
  }

  const sortableColumns = ['created_at', 'category'];
  const sortColumn = sortableColumns.includes(sort_by) ? sort_by : 'created_at';
  const ascending = sort_dir === 'asc';

  const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 200);
  const pageOffset = Math.max(Number(offset) || 0, 0);

  let query = supabase
    .from('activities')
    .select('*, photos(*), users(full_name), children:activities!parent_id(*, photos(*))', {
      count: 'exact',
    })
    .is('parent_id', null)
    .order(sortColumn, { ascending })
    .range(pageOffset, pageOffset + pageSize - 1);

  if (category) query = query.eq('category', category);
  if (user_id) query = query.eq('user_id', user_id);
  if (date_from) query = query.gte('created_at', date_from);
  if (date_to) query = query.lte('created_at', date_to);
  if (search) query = query.ilike('caption', `%${search}%`);
  if (points_awarded === 'true') query = query.gt('points', 0);
  if (points_awarded === 'false') query = query.eq('points', 0);

  const { data, error, count } = await query;
  if (error) return res.status(400).json({ error: error.message });

  res.json({ data, count, limit: pageSize, offset: pageOffset });
});

// Admin awards/revokes points on an activity. Value is fixed per category
// (see lib/points.js), except "bonus" where admin picks 5 or 10.
router.put('/activities/:id/points', requireAdmin, async (req, res) => {
  const { points } = req.body;
  if (!Number.isInteger(points) || points < 0) {
    return res.status(400).json({ error: 'points must be a non-negative integer' });
  }

  const { data: activity, error: findError } = await supabase
    .from('activities')
    .select('category')
    .eq('id', req.params.id)
    .single();
  if (findError) return res.status(404).json({ error: findError.message });

  const valid =
    points === 0 ||
    (activity.category === 'bonus'
      ? BONUS_POINT_OPTIONS.includes(points)
      : points === (POINTS_BY_CATEGORY[activity.category] ?? 0));
  if (!valid) return res.status(400).json({ error: 'points value not allowed for this category' });

  const { data, error } = await supabase
    .from('activities')
    .update({ points })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Leaderboard: total points per user, across every activity (anchor + children).
router.get('/leaderboard', requireAdmin, async (req, res) => {
  const [{ data: users, error: usersError }, { data: activities, error: activitiesError }] = await Promise.all([
    supabase.from('users').select('id, full_name'),
    supabase.from('activities').select('user_id, points'),
  ]);
  if (usersError) return res.status(400).json({ error: usersError.message });
  if (activitiesError) return res.status(400).json({ error: activitiesError.message });

  const totals = new Map(users.map((u) => [u.id, { user_id: u.id, full_name: u.full_name, points: 0 }]));
  for (const a of activities) {
    const row = totals.get(a.user_id);
    if (row) row.points += a.points || 0;
  }

  res.json([...totals.values()].sort((a, b) => b.points - a.points));
});

module.exports = router;
