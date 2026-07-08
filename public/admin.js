const whoamiEl = document.getElementById('admin-whoami');
const logoutBtn = document.getElementById('admin-logout-btn');

const addUserForm = document.getElementById('add-user-form');
const newUserName = document.getElementById('new-user-name');
const addUserMsg = document.getElementById('add-user-msg');

const filterForm = document.getElementById('filter-form');
const fCategory = document.getElementById('f-category');
const fUser = document.getElementById('f-user');
const fDateFrom = document.getElementById('f-date-from');
const fDateTo = document.getElementById('f-date-to');
const fSearch = document.getElementById('f-search');
const fSortBy = document.getElementById('f-sort-by');
const fSortDir = document.getElementById('f-sort-dir');
const fPageSize = document.getElementById('f-page-size');
const resetBtn = document.getElementById('f-reset');

const reportBody = document.getElementById('report-body');
const reportCount = document.getElementById('report-count');
const pageInfo = document.getElementById('page-info');
const pagePrev = document.getElementById('page-prev');
const pageNext = document.getElementById('page-next');

let offset = 0;
let totalCount = 0;

async function requireAuth() {
  const res = await fetch('/api/admin/me');
  if (!res.ok) {
    window.location.href = 'admin-login.html';
    return;
  }
  const data = await res.json();
  whoamiEl.textContent = data.username;
}

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = 'admin-login.html';
});

async function loadUserOptions() {
  const res = await fetch('/api/users');
  const users = await res.json();
  fUser.innerHTML = '<option value="">All users</option>';
  users.forEach((u) => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.full_name;
    fUser.appendChild(opt);
  });
}

addUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  addUserMsg.hidden = true;
  const full_name = newUserName.value.trim();
  if (!full_name) return;

  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name }),
  });
  const data = await res.json();

  addUserMsg.hidden = false;
  if (!res.ok) {
    addUserMsg.textContent = data.error || 'failed to add user';
  } else {
    addUserMsg.textContent = `Added "${data.full_name}"`;
    newUserName.value = '';
    loadUserOptions();
  }
});

function buildQuery() {
  const params = new URLSearchParams();
  if (fCategory.value) params.set('category', fCategory.value);
  if (fUser.value) params.set('user_id', fUser.value);
  if (fDateFrom.value) params.set('date_from', fDateFrom.value);
  if (fDateTo.value) params.set('date_to', fDateTo.value);
  if (fSearch.value.trim()) params.set('search', fSearch.value.trim());
  params.set('sort_by', fSortBy.value);
  params.set('sort_dir', fSortDir.value);
  params.set('limit', fPageSize.value);
  params.set('offset', String(offset));
  return params.toString();
}

async function loadReport() {
  const res = await fetch(`/api/admin/report?${buildQuery()}`);
  if (res.status === 401) {
    window.location.href = 'admin-login.html';
    return;
  }
  const { data, count, limit } = await res.json();
  totalCount = count;

  reportBody.innerHTML = '';
  if (data.length === 0) {
    reportBody.innerHTML = '<tr><td colspan="5" class="meta">No activities match these filters.</td></tr>';
  }

  data.forEach((a) => {
    const tr = document.createElement('tr');

    const date = document.createElement('td');
    date.textContent = new Date(a.created_at).toLocaleString();

    const user = document.createElement('td');
    user.textContent = a.users ? a.users.full_name : '—';

    const category = document.createElement('td');
    category.textContent = a.category;

    const caption = document.createElement('td');
    caption.className = 'caption-cell';
    caption.textContent = a.caption || '';

    const photos = document.createElement('td');
    const thumbRow = document.createElement('div');
    thumbRow.className = 'thumb-row';
    (a.photos || []).forEach((p) => {
      const img = document.createElement('img');
      img.src = p.url;
      img.alt = 'photo';
      thumbRow.appendChild(img);
    });
    photos.appendChild(thumbRow);

    tr.appendChild(date);
    tr.appendChild(user);
    tr.appendChild(category);
    tr.appendChild(caption);
    tr.appendChild(photos);
    reportBody.appendChild(tr);
  });

  const shownFrom = totalCount === 0 ? 0 : offset + 1;
  const shownTo = Math.min(offset + limit, totalCount);
  reportCount.textContent = `${totalCount} activities`;
  pageInfo.textContent = `${shownFrom}–${shownTo} of ${totalCount}`;
  pagePrev.disabled = offset === 0;
  pageNext.disabled = offset + limit >= totalCount;
}

filterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  offset = 0;
  loadReport();
});

resetBtn.addEventListener('click', () => {
  filterForm.reset();
  offset = 0;
  loadReport();
});

pagePrev.addEventListener('click', () => {
  offset = Math.max(0, offset - Number(fPageSize.value));
  loadReport();
});

pageNext.addEventListener('click', () => {
  offset = offset + Number(fPageSize.value);
  loadReport();
});

(async function init() {
  await requireAuth();
  await loadUserOptions();
  await loadReport();
})();
