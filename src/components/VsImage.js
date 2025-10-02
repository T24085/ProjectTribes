const DEFAULT_CLASS = 'vs-image';
const DEFAULT_FALLBACK_CLASS = 'vs-image__fallback';

function createTextFallback(label, fallbackClass) {
  const span = document.createElement('span');
  span.className = fallbackClass || DEFAULT_FALLBACK_CLASS;
  span.textContent = label;
  return span;
}

function buildImageSrc(basePath, teamASlug, teamBSlug) {
  const trimmedBase = String(basePath || '').replace(/\/$/, '');
  return `${trimmedBase}/${teamASlug}vs${teamBSlug}.png`;
}

export function createVsImage(options = {}) {
  const {
    teamAName = 'Team A',
    teamBName = 'Team B',
    teamASlug,
    teamBSlug,
    basePath = "TribesLeagueLogo's/TeamMatchUps",
    fallbackSrc = '',
    className = DEFAULT_CLASS,
    fallbackClass = DEFAULT_FALLBACK_CLASS,
    imageClass = '',
    onImageError
  } = options;

  const label = `${teamAName} vs ${teamBName}`;
  const container = document.createElement('div');
  container.className = className || DEFAULT_CLASS;
  container.dataset.state = 'init';
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', label);

  const normalizedTeamASlug = typeof teamASlug === 'string' ? teamASlug.trim() : '';
  const normalizedTeamBSlug = typeof teamBSlug === 'string' ? teamBSlug.trim() : '';
  const haveSlugs = normalizedTeamASlug && normalizedTeamBSlug;

  if (!haveSlugs) {
    container.dataset.state = 'text';
    container.appendChild(createTextFallback(label, fallbackClass));
    return container;
  }

  const image = document.createElement('img');
  image.src = buildImageSrc(basePath, normalizedTeamASlug, normalizedTeamBSlug);
  image.alt = label;
  image.loading = 'lazy';
  image.decoding = 'async';
  if (imageClass) {
    image.className = imageClass;
  }

  let triedFallbackSrc = false;
  const applyTextFallback = () => {
    container.dataset.state = 'text';
    container.innerHTML = '';
    container.appendChild(createTextFallback(label, fallbackClass));
  };

  image.addEventListener('error', () => {
    if (fallbackSrc && !triedFallbackSrc) {
      triedFallbackSrc = true;
      image.src = fallbackSrc;
      return;
    }
    if (typeof onImageError === 'function') {
      try {
        onImageError({ label, attemptedSrc: image.currentSrc || image.src });
      } catch (err) {
        // Ignore handler errors to keep this component presentational.
      }
    }
    applyTextFallback();
  });

  image.addEventListener('load', () => {
    container.dataset.state = 'image';
  });

  container.dataset.state = 'loading';
  container.appendChild(image);
  return container;
}

export default createVsImage;
