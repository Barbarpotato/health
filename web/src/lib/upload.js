import { supabase } from './supabaseClient';
import { api } from './api';

// Uploads go straight from the browser to Supabase Storage via a signed URL,
// bypassing our Express API — needed since Vercel serverless functions cap
// request bodies at ~4.5MB, too small for videos (and some photos).
export async function uploadFiles(activityId, files) {
  for (const file of files) {
    const { path, token, publicUrl } = await api('/photos/sign-upload', {
      method: 'POST',
      body: JSON.stringify({ activity_id: activityId, filename: file.name }),
    });

    const { error } = await supabase.storage.from('photos').uploadToSignedUrl(path, token, file);
    if (error) throw new Error(`Gagal mengunggah ${file.name}: ${error.message}`);

    await api('/photos', {
      method: 'POST',
      body: JSON.stringify({ activity_id: activityId, url: publicUrl }),
    });
  }
}

export function isVideo(url) {
  return /\.(mp4|webm|mov|ogg|m4v)$/i.test(url);
}
