import React, { useEffect, useState } from 'react';

export default function LiveAnnouncementBanner() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    let active = true;

    const buildLoginMap = () => {
      const roster = window.twitchOAuth?.TEAM_STREAMS || {};
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
      if (!window.twitchOAuth?.fetchLiveStreams) return;
      const loginMap = buildLoginMap();
      const logins = Object.keys(loginMap);
      if (!logins.length) return setMessages([]);
      try {
        const streams = await window.twitchOAuth.fetchLiveStreams(logins);
        const liveTeams = Array.from(
          new Set(
            streams
              .map(s => loginMap[s.user_login.toLowerCase()])
              .filter(Boolean)
          )
        );
        if (!active) return;
        if (liveTeams.length >= 2) {
          setMessages([`${liveTeams[0]} vs ${liveTeams[1]} is live!`]);
        } else if (liveTeams.length === 1) {
          setMessages([`${liveTeams[0]} is live!`]);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Unable to check live teams', err);
      }
    };

    checkTeams();
    const id = setInterval(checkTeams, 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!messages.length) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
      {messages.map((msg, i) => (
        <div key={i} className="lab-banner">
          {msg}

        </div>
      ))}
      <style>{`
        .lab-banner {
          background: #111;
          color: #fff;
          padding: 10px;
          text-align: center;
          font-size: 1rem;
          animation: lab-glow 2s ease-in-out infinite alternate;
        }

        @keyframes lab-glow {
          from {
            text-shadow: 0 0 5px #fff, 0 0 10px #fff;
          }
          to {
            text-shadow: 0 0 20px #fff, 0 0 30px #fff;
          }
        }
      `}</style>
    </div>
  );
}
