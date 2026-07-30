const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// Public listing — never select password here.
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('users').select('id, full_name');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// Total points across every activity (anchor + children) for one user.
router.get('/:id/points', async (req, res) => {
  const { data, error } = await supabase.from('activities').select('points').eq('user_id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  const total = data.reduce((sum, a) => sum + (a.points || 0), 0);
  res.json({ points: total });
});

// Login: full_name + password must match exactly. No auto-create —
// only an admin can add new users (and set their password).
router.post('/login', async (req, res) => {
  const { full_name, password } = req.body;
  if (!full_name || !full_name.trim() || !password) {
    return res.status(400).json({ error: 'full_name and password required' });
  }
  const name = full_name.trim();

  const { data: existing, error } = await supabase
    .from('users')
    .select('id, full_name, password')
    .eq('full_name', name)
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  if (!existing || existing.password !== password) {
    return res.status(401).json({ error: 'Nama atau kata sandi salah.' });
  }

  res.json({ id: existing.id, full_name: existing.full_name });
});

module.exports = router;
