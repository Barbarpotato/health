import { supabase } from './supabaseClient';
import { api } from './api';

const VIDEO_EXT_RE = /\.(mp4|webm|mov|ogg|m4v)$/i;
const MAX_EDGE = 1600;

// Videos go straight from the browser to Supabase Storage via a signed URL,
// bypassing our Express API — needed since Vercel serverless functions cap
// request bodies at ~4.5MB, too small for videos.
async function uploadVideo(activityId, file) {
  const { path, token, publicUrl } = await api('/photos/sign-upload', {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId, filename: file.name }),
  });

  const { error } = await supabase.storage.from('photos').uploadToSignedUrl(path, token, file);
  if (error) throw new Error(`Gagal mengunggah ${file.name}: ${error.message}`);

  return publicUrl;
}

// Images are compressed client-side (to comfortably clear Vercel's ~4.5MB
// body cap) then proxied through our API to the image_ricola service, which
// keeps Supabase Storage egress off the free-tier quota for new uploads.
async function uploadImage(file) {
  const compressed = await compressImage(file);

  const form = new FormData();
  form.append('file', compressed, file.name);

  const { url } = await api('/photos/image-upload', { method: 'POST', body: form });
  return url;
}

async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
}

export async function uploadFiles(activityId, files) {
  for (const file of files) {
    const url = isVideoFile(file) ? await uploadVideo(activityId, file) : await uploadImage(file);

    await api('/photos', {
      method: 'POST',
      body: JSON.stringify({ activity_id: activityId, url }),
    });
  }
}

function isVideoFile(file) {
  return file.type.startsWith('video/') || VIDEO_EXT_RE.test(file.name);
}

export function isVideo(url) {
  return VIDEO_EXT_RE.test(url);
}

// Some photo rows point at the external image_ricola resize proxy, which
// crops/stretches to whatever fixed width+height it's given. Dropping both
// params makes it serve the original, undistorted image.
export function photoSrc(url) {
  if (!url || !url.includes('image_ricola')) return url;
  const u = new URL(url);
  u.searchParams.delete('width');
  u.searchParams.delete('height');
  return u.toString();
}
