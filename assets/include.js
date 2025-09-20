// Simple HTML include loader
// Replaces elements with a data-include attribute with the referenced HTML
// and executes any scripts within the included fragment.
document.addEventListener('DOMContentLoaded', () => {
  const includeElements = document.querySelectorAll('[data-include]');
  includeElements.forEach(async el => {
    const file = el.getAttribute('data-include');
    if (!file) return;
    const trimmed = file.trim();
    const isAbsoluteHttp = /^https?:\/\//i.test(trimmed);
    const normalizedPath = (!isAbsoluteHttp && trimmed.startsWith('/') && !trimmed.startsWith('//'))
      ? `.${trimmed}`
      : trimmed;
    try {
      const res = await fetch(normalizedPath);
      if (!res.ok) throw new Error(`Failed to fetch ${file}`);
      const html = await res.text();
      el.innerHTML = html;
      el.removeAttribute('data-include');
      // Execute scripts from the included fragment
      el.querySelectorAll('script').forEach(oldScript => {
        const script = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
        script.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(script, oldScript);
      });
      // Update Twitch OAuth navigation state and live teams menu if available
      if (window.twitchOAuth) {
        window.twitchOAuth.updateNav();
        window.twitchOAuth.initLiveTeamsMenu();
      }
    } catch (err) {
      console.error(err);
    }
  });
});
