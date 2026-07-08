const KEY = 'wellness_theme';

export function getTheme() {
  return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(KEY, theme);
}
