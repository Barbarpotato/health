const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  const { activity_id } = req.query;
  let query = supabase.from('photos').select('*');
  if (activity_id) query = query.eq('activity_id', activity_id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Issue a signed upload URL so the browser can upload the file straight to
// Supabase Storage — bypassing this server entirely. Needed because Vercel's
// serverless functions cap request bodies at ~4.5MB, too small for videos
// (and some photos).
router.post('/sign-upload', async (req, res) => {
  const { activity_id, filename } = req.body;
  if (!activity_id || !filename) {
    return res.status(400).json({ error: 'activity_id and filename required' });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${activity_id}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage.from('photos').createSignedUploadUrl(path);
  if (error) return res.status(400).json({ error: error.message });

  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);
  res.json({ path, token: data.token, signedUrl: data.signedUrl, publicUrl });
});

// Create a photo/video record from an already-uploaded URL
router.post('/', async (req, res) => {
  const { activity_id, url } = req.body;
  if (!activity_id || !url) {
    return res.status(400).json({ error: 'activity_id and url required' });
  }

  const { data: activity, error: findError } = await supabase
    .from('activities')
    .select('points')
    .eq('id', activity_id)
    .single();
  if (findError) return res.status(404).json({ error: findError.message });
  // Same rule as editing the activity itself — once scored, it's locked.
  if (activity.points > 0) {
    return res.status(400).json({ error: 'Aktivitas ini sudah diberi poin dan tidak bisa diubah.' });
  }

  const { data, error } = await supabase
    .from('photos')
    .insert({ activity_id, url })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/:id', async (req, res) => {
  const { data: photo, error: findError } = await supabase
    .from('photos')
    .select('activity_id, activities(points)')
    .eq('id', req.params.id)
    .single();
  if (findError) return res.status(404).json({ error: findError.message });
  if (photo.activities?.points > 0) {
    return res.status(400).json({ error: 'Aktivitas ini sudah diberi poin dan tidak bisa diubah.' });
  }

  const { error } = await supabase.from('photos').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
