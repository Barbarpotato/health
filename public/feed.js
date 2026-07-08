const feedList = document.getElementById('feed-list');

async function loadFeed() {
  const res = await fetch('/api/activities');
  const activities = await res.json();

  feedList.innerHTML = '';
  if (activities.length === 0) {
    feedList.innerHTML = '<p class="meta">No activity yet.</p>';
    return;
  }

  activities.forEach((a) => {
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
    const author = a.users ? a.users.full_name : 'Unknown';
    meta.textContent = `${author} · ${new Date(a.created_at).toLocaleString()}`;

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
    card.appendChild(meta);
    feedList.appendChild(card);
  });
}

loadFeed();
