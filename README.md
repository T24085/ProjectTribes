# Tribes Professional League

This repository hosts the static website for the **Tribes 3: Rivals** community.  Every page is plain HTML/JS and can be opened directly in a browser—no backend server is required.

## Features

- **Live dashboard** – `index.html`/`TPLTeamsDashboard.html` lists every team, highlights who is live on Twitch and exposes additional links after Twitch sign‑in.
- **Tournament utilities** – includes a draft sign‑up loader, a full tournament manager, and an interactive bracket system.
- **Match tracking** – standings, schedules, upcoming events and a scrim watcher to preview matchups.
- **Streaming tools** – multi‑stream Twitch layouts, a mobile stream viewer, streamer directory and downloadable streamer kits.
- **News & announcements** – Firestore‑powered news feed with an admin interface for league staff.
- **Admin panels** – pages for managing leagues, teams, streamers and news entries.
- **Team pages** – dedicated pages for each squad with logos, rosters and contact links.

## Pages

### General tools
- [Dashboard](index.html)
- [Tournament Manager](TournamentManager.html)
- [Tournament Brackets](TournamentBrackets.html)
- [Draft Sign-Up](DraftSignUp.html)
- [Tribes Scrim Watcher](TribesScrimWatcher.html)
- [Standings and Matches](StandingsAndMatches.html)
- [League Manager](LeagueManager.html)
- [Team Sign-Up](TeamSignUp.html)
- [Twins Tournament Data Center](TwinsTournamentDataCenter.html)
- [Upcoming Events](UpcomingEvents.html)
- [News](News.html)
- [News Admin](NewsAdmin.html)
- [Streamer Kits](StreamerKits.html)
- [TPL Live Hub](index.html)
- [Twitch Feed Mobile](TwitchFeedMobile.html)
- [Streamers Directory](Streamers.html)
- [Submit a Streamer](StreamersSubmit.html)
- [Streamers Admin](StreamersAdmin.html)

### Team pages
- [Avalanche](TeamAV.html)
- [DPRK](TeamDPRK.html)
- [DeadStop](TeamDS.html)
- [ePidemic](TeamEPI.html)
- [Flag Pole Smokers](TeamFPS.html)
- [Flying Tractors](TeamFT.html)
- [Hegemony of Euros](TeamHoE.html)
- [KTL](TeamKTL.html)
- [Magic](TeamMagic.html)
- [null](TeamNull.html)
- [TXM](TeamTXM.html)
- [Toxic Aimers](TeamToxicAimers.html)
- [Unhandled Exception](TeamUE.html)
- [Zen](TeamZen.html)

## Usage

Open `index.html` in your browser to access the main dashboard. External team or stream links on each page open in new tabs. Team pages provide roster info and may link to Twitch or YouTube streams.

All pages can be opened locally. Some utilities store data in `localStorage`, while others read and write to Firebase.

## Shared Navigation

The navigation menu is defined in `nav.html` and dynamically injected into every page via JavaScript so links remain consistent across the site.

## Twitch Authentication

Certain pages include a "Sign in with Twitch" button. Logging in stores your access token in `localStorage` so the site can personalize Twitch feeds. The login uses the [Twitch OAuth implicit flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#implicit-code-flow). When signed in, the dashboard shows your Twitch username and reveals a **Live Teams** toggle that lists currently live rosters.

## Firebase Setup for Team Sign-Up

The `TeamSignUp.html` page uses [Firebase Firestore](https://firebase.google.com/docs/firestore) to store team data.

1. Create a project at <https://console.firebase.google.com> and add a **Web App**. Copy the configuration snippet it provides.
2. Enable **Cloud Firestore** in your Firebase project.
3. Replace the placeholder values in `TeamSignUp.html` under `firebaseConfig` with your project credentials (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
4. Deploy the site or run a local server (e.g. `python3 -m http.server`) before opening the page. Submitting the form stores teams under a `teams` collection in Firestore.
5. Returning to the page lists existing teams and lets you edit or delete them.

## Credits

© 2025 Tribes Professional League community. Individual team pages contain their respective credits.
