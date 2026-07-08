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

// Login: find existing user by full_name, or create one. No password.
router.post('/login', async (req, res) => {
  const { full_name } = req.body;
  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: 'full_name required' });
  }
  const name = full_name.trim();

  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('full_name', name)
    .maybeSingle();
  if (findError) return res.status(400).json({ error: findError.message });
  if (existing) return res.json(existing);

  const { data, error } = await supabase
    .from('users')
    .insert({ full_name: name })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
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
