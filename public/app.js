const userJson = localStorage.getItem('wellness_user');
if (!userJson) window.location.href = 'login.html';
const currentUser = JSON.parse(userJson);

document.getElementById('whoami').textContent = currentUser.full_name;
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('wellness_user');
  window.location.href = 'login.html';
});

const activityForm = document.getElementById('activity-form');
const activityCategory = document.getElementById('activity-category');
const activityCaption = document.getElementById('activity-caption');
const activityPhotos = document.getElementById('activity-photos');
const activityList = document.getElementById('activity-list');
const activitySubmitBtn = activityForm.querySelector('button[type="submit"]');

async function api(path, options) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || res.statusText);
  return data;
}

async function loadActivities() {
  const activities = await api(`/activities?user_id=${currentUser.id}`);
  activityList.innerHTML = '';

  if (activities.length === 0) {
    activityList.innerHTML = '<p class="meta">No activities yet.</p>';
    return;
  }

  activities.forEach((a) => activityList.appendChild(renderActivityCard(a, { deletable: true })));
}

function renderActivityCard(a, { deletable = false, showAuthor = false } = {}) {
  const card = document.createElement('div');
  card.className = 'activity-card';

  const cat = document.createElement('span');
  cat.className = 'category';
  cat.textContent = a.category;

  const caption = document.createElement('p');
  caption.className = 'caption';
  caption.textContent = a.caption || '';

  const meta = document.createElement('div');
  meta.className = 'meta';
  const author = showAuthor && a.users ? `${a.users.full_name} · ` : '';
  meta.textContent = `${author}${new Date(a.created_at).toLocaleString()}`;

  const photos = document.createElement('div');
  photos.className = 'photos';
  (a.photos || []).forEach((p) => {
    const img = document.createElement('img');
    img.src = p.url;
    img.alt = 'photo';
    photos.appendChild(img);
  });

  card.appendChild(cat);
  card.appendChild(caption);
  card.appendChild(photos);

  if (deletable) {
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete activity';
    delBtn.addEventListener('click', async () => {
      await api(`/activities/${a.id}`, { method: 'DELETE' });
      loadActivities();
    });
    card.appendChild(delBtn);
  }

  card.appendChild(meta);
  return card;
}

activityForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = Array.from(activityPhotos.files);
  if (files.length === 0) {
    alert('Add at least 1 photo before posting.');
    return;
  }

  activitySubmitBtn.disabled = true;
  try {
    const activity = await api('/activities', {
      method: 'POST',
      body: JSON.stringify({
        user_id: currentUser.id,
        category: activityCategory.value,
        caption: activityCaption.value.trim(),
      }),
    });

    for (const file of files) {
      const fd = new FormData();
      fd.append('activity_id', activity.id);
      fd.append('file', file);
      await fetch('/api/photos/upload', { method: 'POST', body: fd });
    }

    activityCaption.value = '';
    activityPhotos.value = '';
    loadActivities();
  } finally {
    activitySubmitBtn.disabled = false;
  }
});

loadActivities();
