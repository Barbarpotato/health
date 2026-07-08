const form = document.getElementById('admin-login-form');
const errorEl = document.getElementById('admin-login-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value;

  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    errorEl.textContent = data.error || 'Login failed';
    errorEl.hidden = false;
    return;
  }

  window.location.href = 'admin.html';
});
