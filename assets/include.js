/**
 * include.js
 * Loads HTML snippets into elements marked with [data-include]
 * Example usage in your page:
 *   <div data-include="/nav.html"></div>
 *   <script src="/assets/include.js" defer></script>
 */
(async () => {
  const targets = document.querySelectorAll('[data-include]');
  for (const t of targets) {
    const url = t.getAttribute('data-include');
    if (!url) continue;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const container = document.createElement('div');
      container.innerHTML = html;
      t.replaceWith(container);
    } catch (e) {
      console.error('Include failed for', url, e);
    }
  }
  document.dispatchEvent(new Event('includes-loaded'));
})();
