# Project Tribes

This repository contains a collection of static HTML pages for the community around **Tribes 3: Rivals**. Each page focuses on tournament information, team rosters, or related utilities. All files are static—no backend server is required.

## Pages

- **TribesRivalsTeamsDashboard.html** – Main dashboard linking to individual team pages, streaming links, and historical information.
- **TournamentManager.html** – React-based page for managing tournaments and importing sign-up data.
- **TribesScrimWatcher.html** – Utility for previewing scrimmage matchups and team rosters. Includes a chat box powered by Twitch embeds that appears alongside the match streams.
- **TwitchFeedDisplays.html** – Layout for watching multiple Twitch streams at once.
- **TwitchFeedMobile.html** – Mobile-friendly version of the Twitch feeds display.
- **TwinsTournamentDataCenter.html** – Score-per-minute chart and documents for the tournament.
- **UpcomingEvents.html** – Schedule of upcoming events with the Twins image.
- **TeamSignUp.html** – Register new teams and edit their rosters using Firebase.
- **TeamBuilder.html** – Simple form for creating your own team with a logo and banner stored in your browser.
- **MontageBay.html** – Submit montage video links and view them all in one place.
- **Team*.html** – Individual team pages with logos, rosters, streams, and contact links. Teams include Avalanche, ePidemic, DPRK, Zen, TXM, Flag Pole Smokers, Flying Tractors, Hegemony of Euros, KTL, Magic, null, DeadStop, Toxic Aimers, and Unhandled Exception.

## Quick Links

You can open these pages directly:

- [Tribes Rivals Dashboard](TribesRivalsTeamsDashboard.html)
- [Scrim Watcher](TribesScrimWatcher.html)
- [Tournament Manager](TournamentManager.html)
- [Twitch Feeds](TwitchFeedDisplays.html)
- [Mobile Twitch Feeds](TwitchFeedMobile.html)
- [Twins Tournament Data Center](TwinsTournamentDataCenter.html)
- [Upcoming Events](UpcomingEvents.html)
- [Team Sign-Up](TeamSignUp.html)


## Usage

Open `TribesRivalsTeamsDashboard.html` in your browser to access the main dashboard. External team or stream links on each page open in new tabs. Each team page provides roster info and may link to Twitch or YouTube streams.

All pages can be opened locally in your browser. The **Create Team** and **Montage Bay** pages save data using `localStorage`.
## Shared Navigation

The main navigation menu is stored in `nav.html`. Each page dynamically loads this file using JavaScript so the links stay consistent across the site.

## Twitch Authentication

Certain pages include a "Sign in with Twitch" button. Logging in stores your access token in `localStorage` so the site can personalize Twitch feeds. The login uses the [Twitch OAuth implicit flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#implicit-code-flow).
When signed in, the main dashboard shows your Twitch username.

In the navigation bar a **Live Teams** button appears after you sign in with Twitch. Clicking the button toggles a side menu that slides in from the left. On the teams dashboard the menu is positioned just below the "Tribes Rivals Dashboard" heading and above the "Select a Team" section. Clicking anywhere outside the menu closes it. Because the site queries the Twitch API using your token, being logged in is required for this list to populate.

The teams dashboard also checks each roster's streamers against Twitch and highlights teams that are currently live.

## Firebase Setup for Team Sign-Up

The `TeamSignUp.html` page uses [Firebase Firestore](https://firebase.google.com/docs/firestore) to store team data. To use it:

1. Create a project at <https://console.firebase.google.com> and add a **Web App**. Copy the configuration snippet it provides.
2. Enable **Cloud Firestore** in your Firebase project. Start in test mode unless you have security rules prepared.

3. Replace the placeholder values in `TeamSignUp.html` under `firebaseConfig` with your project credentials. All keys, including `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`, must match the values from Firebase.
   The `storageBucket` entry should end with `.appspot.com` (for example `your-project.appspot.com`).
4. Deploy the site or run a local server (e.g. `python3 -m http.server`) before opening the page. Submitting the form stores teams under a `teams` collection in Firestore.

5. Returning to the page will list existing teams and let you edit or delete them.

## Credits

© 2025 Tribes Rivals community. Individual team pages contain their respective credits.
