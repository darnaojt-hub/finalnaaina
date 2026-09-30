/**
 * theme.js
 * Light / dark theme handling. Light (warm ivory + sage) is the default
 * look; dark is a warm charcoal version of the same palette. A manual
 * toggle always overrides the default and is remembered in localStorage.
 * The <head> of index.html also applies the saved (or default-light)
 * theme inline before paint to avoid a flash of the wrong theme.
 */
const Theme = (() => {
  const KEY = 'tindarhan_theme';

  function apply(mode) {
    document.documentElement.setAttribute('data-theme', mode === 'light' ? 'light' : 'dark');
  }

  function init() {
    const saved = localStorage.getItem(KEY);
    apply(saved || 'light');
    updateIcon();

    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.addEventListener('click', toggle);
  }

  function isDark() {
    const saved = localStorage.getItem(KEY);
    return saved === 'dark';
  }

  function toggle() {
    const next = isDark() ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
    updateIcon();
  }

  function updateIcon() {
    const iconEl = document.getElementById('themeToggleIcon');
    const labelEl = document.getElementById('themeToggleLabel');
    const btn = document.getElementById('themeToggleBtn');
    const dark = isDark();
    if (iconEl) iconEl.innerHTML = dark ? Icons.sun : Icons.moon;
    if (labelEl) labelEl.textContent = dark ? 'Light Mode' : 'Dark Mode';
    if (btn) {
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
  }

  return { init, isDark, toggle, updateIcon };
})();
