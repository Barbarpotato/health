const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// Login: find existing user by full_name. No password, no auto-create —
// only an admin can add new users.
router.post('/login', async (req, res) => {
  const { full_name } = req.body;
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'full_name required' });
  }
  const name = full_name.trim();

  const { data: existing, error } = await supabase
    .from('users')
    .select('*')
    .eq('full_name', name)
    .maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  if (!existing) return res.status(404).json({ error: 'Nama tidak ditemukan. Hubungi admin untuk didaftarkan.' });

  res.json(existing);
});

router.post('/', async (req, res) => {
  const { full_name } = req.body;
  if (!full_name) return res.status(400).json({ error: 'full_name required' });

  const { data, error } = await supabase
    .from('users')
    .insert({ full_name })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { full_name } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ full_name })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
