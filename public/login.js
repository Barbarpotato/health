const form = document.getElementById('login-form');
const nameInput = document.getElementById('login-name');

if (localStorage.getItem('wellness_user')) {
  window.location.href = 'index.html';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const full_name = nameInput.value.trim();
  if (!full_name) return;

  const res = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name }),
  });
  const user = await res.json();
  if (!res.ok) {
    alert(user.error || 'login failed');
    return;
  }

  localStorage.setItem('wellness_user', JSON.stringify(user));
  window.location.href = 'index.html';
});
