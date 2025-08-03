import React, { useEffect, useState } from 'react';

export default function LiveAnnouncementBanner() {
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      try {
        const res = await fetch('/announcements.json');
        const data = await res.json();
        const now = new Date();
        const active = data.filter(({ startTime, endTime }) => {
          const start = new Date(startTime);
          const end = new Date(endTime);
          return now >= start && now <= end;
        });
        if (isMounted) {
          setActiveAnnouncements(active);
        }
      } catch (err) {
        console.error('Unable to load announcements', err);
      }
    };

    loadAnnouncements();
    const intervalId = setInterval(loadAnnouncements, 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (!activeAnnouncements.length) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
      {activeAnnouncements.map((announcement, index) => (
        <div key={index} className="lab-banner">
          {announcement.message}
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
