# Project Tribes

This repository contains a collection of static HTML pages for the community around **Tribes 3: Rivals**. Each page focuses on tournament information, team rosters, or related utilities. Because all files are static, you can simply open them in a web browser—no web server or build step is required.

## Pages

- **TribesRivalsTeamsDashboard.html** – Main dashboard linking to individual team pages, streaming links, and historical information.
- **TournamentManager.html** – React-based page for managing tournaments and importing sign-up data.
- **TribesScrimWatcher.html** – Utility for previewing scrimmage matchups and team rosters. Includes a chat box powered by Twitch embeds that appears alongside the match streams.
- **TwitchFeedDisplays.html** – Layout for watching multiple Twitch streams at once.
- **TwitchFeedMobile.html** – Mobile-friendly version of the Twitch feeds display.
- **FatboysofSummerDashBoard.html** – Score-per-minute chart for a draft tournament.
- **Team*.html** – Individual team pages with logos, rosters, streams, and contact links. Teams include Avalanche, ePidemic, DPRK, Zen, TXM, Flag Pole Smokers, Flying Tractors, Hegemony of Euros, KTL, Magic, null, Tribal Therapy, Toxic Aimers, and Unhandled Exception.

## Usage

Open `TribesRivalsTeamsDashboard.html` in your browser to access the main dashboard. External team or stream links on each page open in new tabs.
Each team page provides roster info and may link to Twitch or YouTube streams.

The project is purely static—clone or download the repository and open the HTML files locally or host them via any static file hosting service.
## Shared Navigation

The main navigation menu is stored in `nav.html`. Each page dynamically loads this file using JavaScript so the links stay consistent across the site.

## Twitch Authentication

Certain pages include a "Sign in with Twitch" button. Logging in stores your access token in `localStorage` so the site can personalize Twitch feeds. The login uses the [Twitch OAuth implicit flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#implicit-code-flow).
When signed in, the main dashboard shows your Twitch username.

In the navigation bar a **Live Teams** button appears after you sign in with Twitch. Clicking the button toggles a side menu that slides in from the left. On the teams dashboard the menu is positioned just below the "Tribes Rivals Dashboard" heading and above the "Select a Team" section. Clicking anywhere outside the menu closes it. Because the site queries the Twitch API using your token, being logged in is required for this list to populate.


The teams dashboard also checks each roster's streamers against Twitch and highlights teams that are currently live.

## Credits

© 2025 Tribes Rivals community. Individual team pages contain their respective credits.
