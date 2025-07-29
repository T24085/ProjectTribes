# Project Tribes

This repository contains a collection of static HTML pages for the community around **Tribes 3: Rivals**. Each page focuses on tournament information, team rosters, or related utilities. Most pages remain fully static, but the repo now includes a small Node.js server that stores custom teams and montage links.

## Pages

- **TribesRivalsTeamsDashboard.html** – Main dashboard linking to individual team pages, streaming links, and historical information.
- **TournamentManager.html** – React-based page for managing tournaments and importing sign-up data.
- **TribesScrimWatcher.html** – Utility for previewing scrimmage matchups and team rosters. Includes a chat box powered by Twitch embeds that appears alongside the match streams.
- **TwitchFeedDisplays.html** – Layout for watching multiple Twitch streams at once.
- **TwitchFeedMobile.html** – Mobile-friendly version of the Twitch feeds display.
- **FatboysofSummerDashBoard.html** – Score-per-minute chart for a draft tournament.
- **TeamBuilder.html** – Simple form for creating your own team with a logo and banner stored in your browser.
- **MontageBay.html** – Submit montage video links and view them all in one place.
- **Team*.html** – Individual team pages with logos, rosters, streams, and contact links. Teams include Avalanche, ePidemic, DPRK, Zen, TXM, Flag Pole Smokers, Flying Tractors, Hegemony of Euros, KTL, Magic, null, DeadStop, Toxic Aimers, and Unhandled Exception.

## Quick Links

You can open these pages directly after starting the server:

- [Tribes Rivals Dashboard](TribesRivalsTeamsDashboard.html)
- [Scrim Watcher](TribesScrimWatcher.html)
- [Tournament Manager](TournamentManager.html)
- [Twitch Feeds](TwitchFeedDisplays.html)
- [Mobile Twitch Feeds](TwitchFeedMobile.html)
- [Fatboys Dashboard](https://t24085.github.io/FatBoysofSummerDraft/dashboard)

## Quick Links

You can open these pages directly after starting the server:

- [Tribes Rivals Dashboard](TribesRivalsTeamsDashboard.html)
- [Scrim Watcher](TribesScrimWatcher.html)
- [Tournament Manager](TournamentManager.html)
- [Twitch Feeds](TwitchFeedDisplays.html)
- [Mobile Twitch Feeds](TwitchFeedMobile.html)
- [Create Team](TeamBuilder.html)
- [Montage Bay](MontageBay.html)
- [Fatboys Dashboard](https://t24085.github.io/FatBoysofSummerDraft/dashboard)

## Usage

Open `TribesRivalsTeamsDashboard.html` in your browser to access the main dashboard. External team or stream links on each page open in new tabs. Each team page provides roster info and may link to Twitch or YouTube streams.

Install dependencies with `npm install` and start the backend using `node server.js`. The server serves these static files and exposes two REST endpoints:

- `GET /api/teams` and `POST /api/teams` – store custom team info in `data/teams.json`.
- `GET /api/montages` and `POST /api/montages` – store montage links in `data/montages.json`.

The **Create Team** and **Montage Bay** pages call these endpoints instead of relying on `localStorage`.
## Shared Navigation

The main navigation menu is stored in `nav.html`. Each page dynamically loads this file using JavaScript so the links stay consistent across the site.

## Twitch Authentication

Certain pages include a "Sign in with Twitch" button. Logging in stores your access token in `localStorage` so the site can personalize Twitch feeds. The login uses the [Twitch OAuth implicit flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#implicit-code-flow).
When signed in, the main dashboard shows your Twitch username.

In the navigation bar a **Live Teams** button appears after you sign in with Twitch. Clicking the button toggles a side menu that slides in from the left. On the teams dashboard the menu is positioned just below the "Tribes Rivals Dashboard" heading and above the "Select a Team" section. Clicking anywhere outside the menu closes it. Because the site queries the Twitch API using your token, being logged in is required for this list to populate.

The teams dashboard also checks each roster's streamers against Twitch and highlights teams that are currently live.

## Credits

© 2025 Tribes Rivals community. Individual team pages contain their respective credits.
