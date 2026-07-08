const express = require('express');
const multer = require('multer');
const supabase = require('../lib/supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  const { activity_id } = req.query;
  let query = supabase.from('photos').select('*');
  if (activity_id) query = query.eq('activity_id', activity_id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Upload a file directly to Supabase storage, then create the photo record
router.post('/upload', upload.single('file'), async (req, res) => {
  const { activity_id } = req.body;
  if (!activity_id || !req.file) {
    return res.status(400).json({ error: 'activity_id and file required' });
  }

  const ext = req.file.originalname.split('.').pop();
  const path = `${activity_id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype });
  if (uploadError) return res.status(400).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path);

  const { data, error } = await supabase
    .from('photos')
    .insert({ activity_id, url: publicUrl })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// Create a photo record from an existing URL
router.post('/', async (req, res) => {
  const { activity_id, url } = req.body;
  if (!activity_id || !url) {
    return res.status(400).json({ error: 'activity_id and url required' });
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
  const { error } = await supabase.from('photos').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;
