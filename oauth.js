(function(){
  // Twitch application client ID
  const CLIENT_ID = 'meabi1n42pccff5rz9ujpno7ky9vlt';
  // Always return to the new TPL dashboard after Twitch auth.
  // Build the redirect path relative to the current directory so GitHub Pages
  // deployments (which include the repo name in the URL) are handled
  // correctly.
  const basePath =
    window.location.origin +
    window.location.pathname.replace(/\/[^/]*$/, '/');
  const REDIRECT_URI = `${basePath}TPLTeamsDashboard.html`;
  const STORAGE_KEY = 'twitch_token';

  const TEAM_STREAMS = {
    'Avalanche': [
      { name: 'Wriggles', url: 'https://www.twitch.tv/wrigglespk' },
      { name: 'TritiumJones', url: 'https://www.twitch.tv/tritiumjones' },
      { name: 'Dean', url: 'https://www.twitch.tv/wholuvsdean' },
      { name: 'PROJ', url: 'https://www.twitch.tv/prj_tv' },
      { name: 'Ggglygy', url: 'https://www.twitch.tv/ggglygy' },
      { name: 'BakaToma', url: 'https://www.twitch.tv/bakatoma1' }
    ],
    'ePidemic': [
      { name: 'Kenxai', url: 'https://www.twitch.tv/kenxai' },
      { name: 'Makasuro', url: 'https://www.twitch.tv/makasuro' }
    ],
    'DPRK': [
      { name: 'CheezeCaek', url: 'https://www.twitch.tv/cheezecaek' },
      { name: 'silynn', url: 'https://www.twitch.tv/cheddox' },
      { name: 'ColonelFatso', url: 'https://www.twitch.tv/colonelfatso' },
      { name: 'Pandora', url: 'https://www.twitch.tv/pandoracast' },
      { name: 'Nemesis', url: 'https://www.twitch.tv/seansguitarworldbang' }
    ],
    'Zen': [
      { name: 'Mikesters', url: 'https://www.twitch.tv/mikesters17' },
      { name: 'Nikebeamz', url: 'https://www.twitch.tv/nikebeamz' }
    ],
    'TXM': [
      { name: 'Prizzo', url: 'https://www.twitch.tv/prizzo4real' },
      { name: 'OperationCats', url: 'https://www.twitch.tv/operationcats' },
      { name: 'Goshawk', url: 'https://www.twitch.tv/g0shawk' },
      { name: 'Visis', url: 'https://www.twitch.tv/visisgaming' },
      { name: 'Cryof', url: 'https://www.twitch.tv/cryofzshooter' },
      { name: 'Jive', url: 'https://www.twitch.tv/heavenlyjive' },
      { name: 'freefood', url: 'https://www.twitch.tv/freefoodd' },
      { name: 'Howsya', url: 'https://www.twitch.tv/howsya' }
    ],
    'FPS': [
      { name: 'SulliedSoc', url: 'https://www.twitch.tv/SulliedSoc' },
      { name: 'Beldark', url: 'https://www.twitch.tv/beldarkk' }
    ],
    'FT': [
      { name: 'Mikeax2', url: 'https://www.twitch.tv/mikeax2' },
      { name: 'nato', url: 'https://www.twitch.tv/natopotato262' },
      { name: 'playb0x', url: 'https://www.twitch.tv/playb0x' }
    ],
    'HoE': [
      { name: 'Katar', url: 'https://www.twitch.tv/karolk10' },
      { name: 'gwej', url: 'https://www.twitch.tv/gwej' },
      { name: 'cym3', url: 'https://www.twitch.tv/cymm3' }
    ],
    'Magic': [
      { name: 'XRY', url: 'https://www.twitch.tv/xry_tv' },
      { name: 'Splitsecond', url: 'https://www.twitch.tv/splitsecondta' },
      { name: 'Howsya', url: 'https://www.twitch.tv/howsya' }
    ],
    'DeadStop': [
      { name: 'iinferno', url: 'https://www.twitch.tv/bschrift' },
      { name: 'Blitz', url: 'https://www.twitch.tv/slohp0k3' },
      { name: 'apc', url: 'https://www.twitch.tv/apcizzle' },
      { name: 'Makasuro', url: 'https://www.twitch.tv/makasuro' }
    ],
    'UE': [
      { name: 'PabloSexcrobar', url: 'https://www.twitch.tv/eltimablo' },
      { name: 'RoamenCota', url: 'https://www.twitch.tv/roamencota' },
      { name: 'Simmons', url: 'https://www.twitch.tv/simmons572' },
      { name: 'Ghost_Loot', url: 'https://www.twitch.tv/ghost_loot' }
    ]
  };

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
          'Client-ID': CLIENT_ID,
        }
      });
      if (!res.ok) {
        if (res.status === 401) clearToken();
        return null;
      }
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
          'Client-ID': CLIENT_ID,
        }
      });
      if (!res.ok) {
        if (res.status === 401) clearToken();
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error('Failed to fetch followed streams', err);
      return [];
    }
  }

  async function fetchLiveStreams(logins) {
    const token = getToken();
    if (!token || !Array.isArray(logins) || logins.length === 0) return [];
    const query = logins.map(l => 'user_login=' + encodeURIComponent(l)).join('&');
    try {
      const res = await fetch('https://api.twitch.tv/helix/streams?' + query, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': 'Bearer ' + token
        }
      });
      if (!res.ok) {
        if (res.status === 401) clearToken();
        return [];
      }
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (err) {
      console.error('Failed to fetch live streams', err);
      return [];
    }
  }


  async function fetchLiveTeamStreams() {
    const logins = Object.values(TEAM_STREAMS).flat()
      .map(s => {
        const m = s.url.match(/twitch\.tv\/([^/?]+)/i);
        return m ? m[1].toLowerCase() : null;
      })
      .filter(Boolean);
    return fetchLiveStreams(logins);
  }

  function updateLiveTeamsPanel() {
    const panel = document.getElementById('live-teams-panel');
    if (!panel) return;
    panel.innerHTML = 'Loading...';
    fetchLiveTeamStreams().then(streams => {
      if (!streams || streams.length === 0) {
        panel.innerHTML = '<p class="text-sm">No team streams live.</p>';
        return;
      }
      panel.innerHTML = '';
      streams.forEach(stream => {
        const div = document.createElement('div');
        div.className = 'live-box';
        div.innerHTML = `
          <span class="live-dot">\u25CF</span>
          <a href="https://www.twitch.tv/${stream.user_login}" target="_blank" class="hover:underline">${stream.user_name}</a>
        `;
        panel.appendChild(div);
      });
    });
  }

  function initLiveTeamsMenu() {
    const toggle = document.getElementById('live-teams-toggle');
    const panel = document.getElementById('live-teams-panel');
    if (!toggle || !panel) return;

    const togglePanel = (e) => {
      e.stopPropagation();
      if (panel.classList.contains('visible')) {
        panel.classList.replace('visible', 'hidden');
      } else {
        updateLiveTeamsPanel();
        panel.classList.replace('hidden', 'visible');
      }
    };

    const handleClickOutside = (e) => {
      if (!panel.contains(e.target) && !toggle.contains(e.target)) {
        if (panel.classList.contains('visible')) {
          panel.classList.replace('visible', 'hidden');
        }
      }
    };

    toggle.addEventListener('click', togglePanel);
    document.addEventListener('click', handleClickOutside);
  }

  function initLiveAnnouncementBanner() {
    const banner = document.getElementById("live-announcement-banner");
    const nav = document.querySelector("nav");
    const panel = document.getElementById("live-teams-panel");
    if (!banner || !nav) return;

    const BANNER_GAP = 12;
    const iconMarkup = "<span class='banner-icon' aria-hidden='true'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'><path fill='currentColor' d='M1.45 7.88a.75.75 0 0 1 1.06-.03A11.94 11.94 0 0 1 10 5c2.99 0 5.73 1.12 7.49 2.85a.75.75 0 0 1-1.03 1.09A10.44 10.44 0 0 0 10 6.5c-2.62 0-5 1-6.46 2.44a.75.75 0 0 1-1.06-.03zm2.94 3a.75.75 0 0 1 1.06-.05A7.45 7.45 0 0 1 10 9c2.09 0 3.99.86 5.55 2.3a.75.75 0 1 1-1 1.12A5.95 5.95 0 0 0 10 10.5a5.95 5.95 0 0 0-4.55 1.92.75.75 0 0 1-1.06-.03zM10 13.25a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5z'/></svg></span>";
    const htmlEscapes = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "\u0027": "&#39;" };
    const escapeHtml = (str = "") => String(str).replace(/[&<>\"\u0027]/g, ch => htmlEscapes[ch] || ch);
    const highlight = (team) => `<strong>${escapeHtml(team)}</strong>`;
    const formatMessage = (teams) => {
      if (!teams.length) return "";
      if (teams.length === 1) return `${highlight(teams[0])} is live!`;
      if (teams.length === 2) return `${highlight(teams[0])} vs ${highlight(teams[1])} is live!`;
      const extra = teams.length - 2;
      return `${highlight(teams[0])} vs ${highlight(teams[1])} + ${extra} more live!`;
    };
    const syncLayout = () => {
      const navHeight = nav.offsetHeight;
      const isVisible = banner.classList.contains("is-visible");
      const bannerHeight = isVisible ? banner.offsetHeight : 0;
      banner.style.top = `${navHeight + BANNER_GAP}px`;
      if (panel) {
        panel.style.top = `${navHeight + (isVisible ? bannerHeight + BANNER_GAP : 0)}px`;
      }
    };
    const hideBanner = () => {
      banner.classList.remove("is-visible");
      banner.innerHTML = "";
      syncLayout();
    };
    const showBanner = (teams) => {
      const message = formatMessage(teams);
      if (!message) {
        hideBanner();
        return;
      }
      banner.innerHTML = `${iconMarkup}<span>${message}</span>`;
      if (!banner.classList.contains("is-visible")) {
        requestAnimationFrame(() => {
          banner.classList.add("is-visible");
          requestAnimationFrame(syncLayout);
        });
      } else {
        syncLayout();
      }
    };

    const buildLoginMap = () => {
      const roster = TEAM_STREAMS || {};
      const loginToTeam = {};
      Object.entries(roster).forEach(([team, players]) => {
        players.forEach(p => {
          const m = p.url.match(/twitch\.tv\/([^/?]+)/i);
          if (m) loginToTeam[m[1].toLowerCase()] = team;
        });
      });
      return loginToTeam;
    };

    const checkTeams = async () => {
      const loginMap = buildLoginMap();
      const logins = Object.keys(loginMap);
      if (!getToken() || !logins.length) {
        hideBanner();
        return;
      }
      try {
        const streams = await fetchLiveStreams(logins);
        const liveTeams = Array.from(new Set(
          streams.map(s => loginMap[s.user_login.toLowerCase()]).filter(Boolean)
        ));
        if (liveTeams.length) {
          showBanner(liveTeams);
        } else {
          hideBanner();
        }
      } catch (err) {
        console.error("Unable to check live teams", err);
      }
    };

    if (!banner.dataset.init) {
      banner.dataset.init = "1";
      setInterval(checkTeams, 60 * 1000);
    }

    syncLayout();
    checkTeams();
  }

  function loginWithTwitch() {
    const scope = 'user:read:email user:read:follows';

    const url =
      'https://id.twitch.tv/oauth2/authorize' +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      '&response_type=token' +
      `&scope=${encodeURIComponent(scope)}` +
      '&force_verify=true';
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
    const panel = document.getElementById('live-teams-panel');
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
        updateLiveTeamsPanel();
    } else {
      btn.textContent = 'Sign in with Twitch';
      btn.onclick = loginWithTwitch;
      if (userSpan) userSpan.style.display = 'none';
      if (panel) panel.innerHTML = '';

    }
    initLiveAnnouncementBanner();
  }

  window.twitchOAuth = {
    login: loginWithTwitch,
    logout: logoutTwitch,
    getToken,
    fetchUser,
    fetchFollowedStreams,
    fetchLiveStreams,
    fetchLiveTeamStreams,
    TEAM_STREAMS,
    updateLiveTeamsPanel,
    initLiveTeamsMenu,
    updateNav,
    initLiveAnnouncementBanner,
  };

handleRedirect();
document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  initLiveTeamsMenu();
  initLiveAnnouncementBanner();
});
})();
