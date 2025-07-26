(function(){
  const CLIENT_ID = 'meabi1n42pccff5rz9ujpno7ky9vlt';
  const REDIRECT_URI = 'https://t24085.github.io/ProjectTribes/TribesRivalsTeamsDashboard.html';
  const STORAGE_KEY = 'twitch_token';

  function getToken() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function setToken(token) {
    localStorage.setItem(STORAGE_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function loginWithTwitch() {
    const scope = 'user:read:email';
    const url =
      'https://id.twitch.tv/oauth2/authorize' +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      '&response_type=token' +
      `&scope=${encodeURIComponent(scope)}`;
    window.location.href = url;
  }

  function logoutTwitch() {
    clearToken();
    location.reload();
  }

  function handleRedirect() {
    if (window.location.hash.includes('access_token')) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get('access_token');
      if (token) {
        setToken(token);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    }
  }

  function updateNav() {
    const btn = document.getElementById('twitch-login-btn');
    if (!btn) return;
    if (getToken()) {
      btn.textContent = 'Sign out';
      btn.onclick = logoutTwitch;
    } else {
      btn.textContent = 'Sign in with Twitch';
      btn.onclick = loginWithTwitch;
    }
  }

  window.twitchOAuth = {
    login: loginWithTwitch,
    logout: logoutTwitch,
    getToken,
    updateNav,
  };

  handleRedirect();
  document.addEventListener('DOMContentLoaded', updateNav);
})();
