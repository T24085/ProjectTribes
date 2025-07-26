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


  async function fetchUser() {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Client-Id': CLIENT_ID,
        }
      });
      const json = await res.json();
      return json.data && json.data.length ? json.data[0] : null;
    } catch (err) {
      console.error('Failed to fetch Twitch user', err);
      return null;
    }
  }

  async function fetchFollowedStreams() {
    const user = await fetchUser();
    if (!user) return [];
    const token = getToken();
    try {
      const res = await fetch(`https://api.twitch.tv/helix/streams/followed?user_id=${user.id}`, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Client-Id': CLIENT_ID,
        }
      });
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error('Failed to fetch followed streams', err);
      return [];
    }
  }

  function updateFollowedStreamsPanel() {
    const panel = document.getElementById('followed-streams-panel');
    if (!panel) return;
    panel.innerHTML = 'Loading...';
    fetchFollowedStreams().then(streams => {
      if (!streams || streams.length === 0) {
        panel.innerHTML = '<p class="text-sm">No followed streams live.</p>';
        return;
      }
      panel.innerHTML = '';
      streams.forEach(stream => {
        const a = document.createElement('a');
        a.href = `https://www.twitch.tv/${stream.user_login}`;
        a.textContent = stream.user_name;
        a.target = '_blank';
        a.className = 'block hover:underline mb-2';
        panel.appendChild(a);
      });
    });
  }

  function initFollowedStreamsHover() {
    const toggle = document.getElementById('followed-streams-toggle');
    const panel = document.getElementById('followed-streams-panel');
    if (!toggle || !panel) return;

    const show = () => panel.classList.replace('hidden', 'visible');
    const hide = () => panel.classList.replace('visible', 'hidden');

    toggle.addEventListener('mouseenter', show);
    toggle.addEventListener('mouseleave', hide);
    panel.addEventListener('mouseenter', show);
    panel.addEventListener('mouseleave', hide);
  }

  function loginWithTwitch() {
    const scope = 'user:read:email user:read:follows';

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
    const userSpan = document.getElementById('twitch-user');

    if (!btn) return;
    const panel = document.getElementById('followed-streams-panel');
    if (getToken()) {
      btn.textContent = 'Sign out';
      btn.onclick = logoutTwitch;
      if (userSpan) {
        fetchUser().then(u => {
          if (u) {
            userSpan.textContent = `Signed in as ${u.display_name}`;
            userSpan.style.display = 'inline';
          }
        });
      }
      updateFollowedStreamsPanel();
    } else {
      btn.textContent = 'Sign in with Twitch';
      btn.onclick = loginWithTwitch;
      if (userSpan) userSpan.style.display = 'none';
      if (panel) panel.innerHTML = '';

    }
  }

  window.twitchOAuth = {
    login: loginWithTwitch,
    logout: logoutTwitch,
    getToken,
    fetchUser,
    fetchFollowedStreams,
    updateFollowedStreamsPanel,
    initFollowedStreamsHover,
    updateNav,
  };

handleRedirect();
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  initFollowedStreamsHover();
});
})();
