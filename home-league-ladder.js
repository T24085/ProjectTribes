// Home League Ladder - Complete JavaScript Implementation
// Combines: LadderBoard.html, ScoreboardUpload.html, PlayerStats.html functionality
// Uses Firebase collections: homeLeagueTeams, homeLeagueMatches, homeLeagueReports, homeLeagueStats

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, serverTimestamp, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_ksHlcP2P9cT5jbo2IAGxbQ4zgEODkyM",
  authDomain: "team-sign-up-b5646.firebaseapp.com",
  projectId: "team-sign-up-b5646",
  storageBucket: "team-sign-up-b5646.firebasestorage.app",
  messagingSenderId: "951471144681",
  appId: "1:951471144681:web:a2458675ce73ce9ad9ba78"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const ADMIN_UIDS = [
  'DkBHsCzLK5a9KiX50g0pHJrEqGq2',
  'A2ZV8vziNsXqZkyqHzAB266B9pP2'
];

// Home League Ladder - Unified Class
class HomeLeagueLadder {
  constructor() {
    this.teams = [];
    this.matches = [];
    this.adminMatches = [];
    this.currentWeek = 1;
    this.mapPool = [
      'Dry Dock', 'Raindance', 'Hollow', 'Dangerous Crossing', 
      'Torment', 'Katabatic', 'Wave Mist', 'Moonrise'
    ];
    this.lastRefresh = null;
    this.nextRefresh = null;
    this.sortColumn = 'rank';
    this.sortDirection = 'asc';
    this.currentUser = null;
    this.currentReportMatch = null;
    this.currentConfirmReport = null;
    this.isAdmin = false;
    this.currentEditMatch = null;
    this.currentEditScore = null;
    this.isRegenerating = false;
    this.ocrWorker = null;
    this.team1Entries = [];
    this.team2Entries = [];
    this.ocrResults = { team1: [], team2: [] };
    this.chartInstances = new Map();
    this.rules = {
      weeklySchedule: 'The ladder refreshes every <strong>Saturday at 11:00 PM America/New_York</strong> (10:00 PM America/Chicago). At this time, Elo ratings are updated and new weekly pairings are generated.',
      matchReporting: 'Team captains can report match results by uploading scoreboard images and entering map scores. Both teams must confirm the results for the match to be finalized. Disputed matches require admin review.',
      eloSystem: 'Teams start with 1500 Elo. Wins and losses adjust Elo based on opponent strength. Elo changes are applied during the weekly refresh, not immediately after matches.',
      rankings: 'Teams are ranked by Elo rating. Ties are broken by win percentage, then map differential.'
    };
    
    this.init();
  }

  async init() {
    this.setupAuth();
    await this.loadData();
    this.setupEventListeners();
    this.setupAdminLogin();
    this.createTeamModal(); // Create modal early so it's available
    this.startCountdown();
    this.renderRankings();
    this.renderMatches();
    this.renderTeams();
    this.renderMapPool();
    this.renderRules();
    this.renderPlayerStats();
    this.renderAdminContent();
    
    // Setup form submissions
    const reportForm = document.getElementById('reportForm');
    const adminEditMatchForm = document.getElementById('adminEditMatchForm');
    const adminEditScoreForm = document.getElementById('adminEditScoreForm');
    const createTeamForm = document.getElementById('createTeamForm');
    
    if (reportForm) reportForm.addEventListener('submit', (e) => this.submitReport(e));
    if (adminEditMatchForm) adminEditMatchForm.addEventListener('submit', (e) => this.submitAdminEditMatch(e));
    if (adminEditScoreForm) adminEditScoreForm.addEventListener('submit', (e) => this.submitAdminEditScore(e));
    if (createTeamForm) createTeamForm.addEventListener('submit', (e) => this.submitCreateTeam(e));
  }

  setupAuth() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      console.log('Auth state changed:', user ? user.email : 'Not logged in');
      this.isAdmin = user && ADMIN_UIDS.includes(user.uid);
      this.updateAdminUI();
    });
  }

  updateAdminUI() {
    const adminTab = document.getElementById('adminTab');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminPanelContent = document.getElementById('adminPanelContent');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    
    if (adminTab) adminTab.style.display = this.isAdmin ? 'block' : 'none';
    if (this.isAdmin) {
      if (adminLoginForm) adminLoginForm.style.display = 'none';
      if (adminPanelContent) adminPanelContent.style.display = 'block';
      if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-block';
    } else {
      if (adminLoginForm) adminLoginForm.style.display = 'block';
      if (adminPanelContent) adminPanelContent.style.display = 'none';
      if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';
    }
  }

  setupAdminLogin() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        if (!email || !password) {
          alert('Please enter both email and password.');
          return;
        }
        signInWithEmailAndPassword(auth, email, password)
          .then(() => console.log('Admin login successful'))
          .catch((error) => {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
          });
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
          console.log('Admin logged out');
          document.getElementById('adminEmail').value = '';
          document.getElementById('adminPassword').value = '';
        }).catch((error) => console.error('Logout error:', error));
      });
    }
  }

  async loadData() {
    // Load teams from Firebase
    await this.loadTeamsFromFirebase();
    
    // Load map pool and rules
    await this.loadFromFirebase();
    
    // Generate weekly matches if none exist
    if (this.matches.length === 0) {
      this.generateWeeklyMatches();
    } else {
      this.syncAdminMatches();
    }
    
    this.lastRefresh = new Date();
    this.nextRefresh = this.getNextRefreshTime();
  }

  async loadTeamsFromFirebase() {
    try {
      const teamsSnap = await getDocs(collection(db, 'homeLeagueTeams'));
      this.teams = [];
      teamsSnap.forEach(doc => {
        const data = doc.data();
        this.teams.push({
          id: doc.id,
          name: data.teamName || data.name,
          tag: data.teamTag || data.tag,
          logo: data.logoUrl || data.logo || 'images/NullLogo.png',
          elo: data.elo || 1500,
          wins: data.wins || 0,
          losses: data.losses || 0,
          mapsWon: data.mapsWon || 0,
          mapsLost: data.mapsLost || 0,
          last5: data.last5 || '',
          players: data.players || [],
          benchPlayers: data.benchPlayers || []
        });
      });
      console.log('Loaded', this.teams.length, 'teams from Firebase');
    } catch (error) {
      console.error('Error loading teams:', error);
      if (error.code === 'permission-denied') {
        console.warn('Firebase permission denied. Please check security rules. Continuing with empty teams list.');
        this.teams = [];
      }
    }
  }

  async loadFromFirebase() {
    try {
      const ladderRef = doc(db, 'homeLeague', 'data');
      const ladderSnap = await getDoc(ladderRef);
      
      if (ladderSnap.exists()) {
        const data = ladderSnap.data();
        // Update teams with Firebase data (merge with loaded teams)
        if (data.teams) {
          data.teams.forEach(fbTeam => {
            const existingTeam = this.teams.find(t => t.id === fbTeam.id);
            if (existingTeam) {
              Object.assign(existingTeam, fbTeam);
            }
          });
        }
        this.currentWeek = data.currentWeek || 1;
        this.lastRefresh = data.lastRefresh ? data.lastRefresh.toDate() : new Date();
        this.mapPool = data.mapPool || this.mapPool;
        this.rules = data.rules || this.rules;
      }

      // Load matches for current week
      const matchesQuery = query(
        collection(db, 'homeLeagueMatches'),
        where('weekNumber', '==', this.currentWeek)
      );
      const matchesSnap = await getDocs(matchesQuery);
      
      this.matches = [];
      matchesSnap.forEach(doc => {
        const matchData = doc.data();
        matchData.id = doc.id;
        matchData.homeTeam = this.teams.find(t => t.id === matchData.homeTeamId);
        matchData.awayTeam = this.teams.find(t => t.id === matchData.awayTeamId);
        this.matches.push(matchData);
      });

      // Load reports for matches
      for (let match of this.matches) {
        if (match.reportId) {
          const reportRef = doc(db, 'homeLeagueReports', match.reportId);
          const reportSnap = await getDoc(reportRef);
          if (reportSnap.exists()) {
            match.report = { id: reportSnap.id, ...reportSnap.data() };
          }
        }
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
      if (error.code === 'permission-denied') {
        console.warn('Firebase permission denied. Please check security rules. Continuing with local data.');
      }
    }
  }

  async saveToFirebase() {
    try {
      // Save ladder data
      const ladderRef = doc(db, 'homeLeague', 'data');
      await setDoc(ladderRef, {
        teams: this.teams,
        currentWeek: this.currentWeek,
        lastRefresh: serverTimestamp(),
        mapPool: this.mapPool,
        rules: this.rules
      });

      // Save teams separately
      for (const team of this.teams) {
        const teamRef = doc(db, 'homeLeagueTeams', team.id);
        await setDoc(teamRef, {
          teamName: team.name,
          teamTag: team.tag,
          logoUrl: team.logo,
          elo: team.elo,
          wins: team.wins,
          losses: team.losses,
          mapsWon: team.mapsWon,
          mapsLost: team.mapsLost,
          last5: team.last5,
          players: team.players || [],
          benchPlayers: team.benchPlayers || []
        }, { merge: true });
      }

      // Save matches
      const existingMatchesQuery = query(
        collection(db, 'homeLeagueMatches'),
        where('weekNumber', '==', this.currentWeek)
      );
      const existingMatchesSnap = await getDocs(existingMatchesQuery);
      
      if (existingMatchesSnap.docs.length > 0) {
        const deletePromises = existingMatchesSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }

      for (const match of this.matches) {
        const matchData = {
          weekNumber: match.weekNumber,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          status: match.status,
          mapSet: match.mapSet,
          scheduledAt: match.scheduledAt,
          reportId: match.reportId || null
        };
        const matchRef = await addDoc(collection(db, 'homeLeagueMatches'), matchData);
        match.id = matchRef.id;
      }
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      if (error.code === 'permission-denied') {
        console.warn('Firebase permission denied. Please check security rules. Changes not saved to Firebase.');
      }
    }
  }

  // Continue with remaining methods...
  // Due to length, I'll add the rest in subsequent edits

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Table sorting
    document.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', (e) => {
        const column = e.target.dataset.sort;
        this.sortTable(column);
      });
    });
  }

  // Team Management Methods
  openCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) {
      modal.style.display = 'block';
    } else {
      // Create modal if it doesn't exist
      this.createTeamModal();
    }
  }

  closeCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) {
      modal.style.display = 'none';
      const form = document.getElementById('createTeamForm');
      if (form) form.reset();
    }
  }

  createTeamModal() {
    // Create the modal HTML if it doesn't exist
    let modal = document.getElementById('createTeamModal');
    if (modal) return;

    modal = document.createElement('div');
    modal.id = 'createTeamModal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Create New Team</h2>
          <button class="modal-close" onclick="closeCreateTeamModal()">&times;</button>
        </div>
        <form id="createTeamForm">
          <div class="form-group">
            <label class="form-label">Team Name *</label>
            <input type="text" class="form-input" name="teamName" required placeholder="Enter team name">
          </div>
          <div class="form-group">
            <label class="form-label">Team Tag *</label>
            <input type="text" class="form-input" name="teamTag" required placeholder="Enter team tag (e.g., AV!)" maxlength="10">
          </div>
          <div class="form-group">
            <label class="form-label">Logo URL</label>
            <input type="url" class="form-input" name="logoUrl" placeholder="https://example.com/logo.png">
            <small style="color: var(--text-muted);">Leave empty to use default logo</small>
          </div>
          <div class="form-group">
            <label class="form-label">Players (one per line) *</label>
            <textarea class="form-textarea" name="players" required placeholder="Player1&#10;Player2&#10;Player3" rows="5"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Bench Players (one per line, optional)</label>
            <textarea class="form-textarea" name="benchPlayers" placeholder="Sub1&#10;Sub2" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeCreateTeamModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Team</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    // Setup form submission
    const form = document.getElementById('createTeamForm');
    if (form) {
      form.addEventListener('submit', (e) => this.submitCreateTeam(e));
    }
  }

  async submitCreateTeam(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const teamName = formData.get('teamName');
    const teamTag = formData.get('teamTag');
    const logoUrl = formData.get('logoUrl') || 'images/NullLogo.png';
    const players = formData.get('players').split('\n').filter(p => p.trim()).map(p => p.trim());
    const benchPlayers = formData.get('benchPlayers') ? formData.get('benchPlayers').split('\n').filter(p => p.trim()).map(p => p.trim()) : [];
    
    if (!teamName || !teamTag || players.length === 0) {
      alert('Please fill in all required fields (Team Name, Team Tag, and at least one player).');
      return;
    }

    try {
      const teamRef = await addDoc(collection(db, 'homeLeagueTeams'), {
        teamName,
        teamTag,
        logoUrl,
        players,
        benchPlayers,
        elo: 1500,
        wins: 0,
        losses: 0,
        mapsWon: 0,
        mapsLost: 0,
        last5: '',
        createdAt: serverTimestamp()
      });
      
      const newTeam = {
        id: teamRef.id,
        name: teamName,
        tag: teamTag,
        logo: logoUrl,
        elo: 1500,
        wins: 0,
        losses: 0,
        mapsWon: 0,
        mapsLost: 0,
        last5: '',
        players,
        benchPlayers
      };
      
      this.teams.push(newTeam);
      this.closeCreateTeamModal();
      this.renderTeams();
      this.renderRankings();
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check Firebase security rules or contact an admin.');
      } else {
        alert('Error creating team. Please try again.');
      }
    }
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName)?.classList.add('active');
    
    // Load content for specific tabs
    if (tabName === 'teams') this.renderTeams();
    if (tabName === 'scoreboard') this.renderScoreboardUpload();
    if (tabName === 'stats') this.renderPlayerStats();
  }

  getNextRefreshTime() {
    const now = new Date();
    const nextSaturday = new Date(now);
    const daysUntilSaturday = (6 - now.getDay()) % 7;
    if (daysUntilSaturday === 0 && now.getHours() >= 23) {
      nextSaturday.setDate(now.getDate() + 7);
    } else {
      nextSaturday.setDate(now.getDate() + (daysUntilSaturday || 7));
    }
    nextSaturday.setHours(23, 0, 0, 0);
    return nextSaturday;
  }

  startCountdown() {
    const updateCountdown = () => {
      const now = new Date();
      const timeLeft = this.nextRefresh - now;
      if (timeLeft <= 0) {
        document.getElementById('countdownTimer').textContent = 'Refreshing...';
        return;
      }
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      const timerText = `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      document.getElementById('countdownTimer').textContent = timerText;
      const banner = document.getElementById('countdownBanner');
      if (timeLeft < 60 * 60 * 1000) {
        banner.classList.add('warning');
      } else {
        banner.classList.remove('warning');
      }
    };
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  renderRankings() {
    const tbody = document.getElementById('rankingsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sortedTeams = [...this.teams].sort((a, b) => {
      if (b.elo !== a.elo) return b.elo - a.elo;
      const aWinPct = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
      const bWinPct = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
      if (bWinPct !== aWinPct) return bWinPct - aWinPct;
      return (b.mapsWon - b.mapsLost) - (a.mapsWon - a.mapsLost);
    });

    sortedTeams.forEach((team, index) => {
      const row = document.createElement('tr');
      const winPct = team.wins + team.losses > 0 ? (team.wins / (team.wins + team.losses) * 100).toFixed(1) : '0.0';
      const last5Html = this.renderLastFive(team.last5);
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>
          <div class="team-cell">
            <img src="${team.logo}" alt="${team.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
            <div class="team-info">
              <div class="team-name">${team.name}</div>
              <div class="team-tag">[${team.tag}]</div>
            </div>
          </div>
        </td>
        <td><span class="elo-value">${Math.round(team.elo)}</span></td>
        <td><span class="record">${team.wins}-${team.losses}</span></td>
        <td><span class="win-percentage">${winPct}%</span></td>
        <td><span class="record">${team.mapsWon}-${team.mapsLost}</span></td>
        <td><div class="last-five">${last5Html}</div></td>
      `;
      tbody.appendChild(row);
    });

    const lastRefreshEl = document.getElementById('lastRefresh');
    if (lastRefreshEl) lastRefreshEl.textContent = this.lastRefresh.toLocaleString();
  }

  renderLastFive(last5String) {
    if (!last5String) return '<span style="color: var(--text-muted);">-</span>';
    return last5String.split('').map(result => {
      const className = result === 'W' ? 'win' : 'loss';
      return `<span class="result-indicator ${className}"></span>`;
    }).join('');
  }

  renderMatches() {
    const grid = document.getElementById('matchesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (this.matches.length === 0) {
      grid.innerHTML = '<div class="loading">No matches scheduled for this week.</div>';
      return;
    }

    this.matches.forEach(match => {
      const card = document.createElement('div');
      card.className = 'match-card';
      const statusClass = `status-${match.status.toLowerCase()}`;
      
      if (match.status === 'BYE') {
        card.innerHTML = `
          <div class="match-header">
            <div class="match-teams">
              <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
              <span class="vs-text">BYE</span>
            </div>
            <span class="status-badge status-bye">BYE</span>
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>${match.homeTeam.name} [${match.homeTeam.tag}]</strong> has a bye this week
          </div>
        `;
      } else {
        const mapListHtml = match.mapSet.map(map => `<div class="map-item"><span class="map-name">${map}</span><span class="map-score">-</span></div>`).join('');
        card.innerHTML = `
          <div class="match-header">
            <div class="match-teams">
              <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
              <span class="vs-text">vs</span>
              <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
            </div>
            <span class="status-badge ${statusClass}">${match.status}</span>
          </div>
          <div style="margin-bottom: 1rem;">
            <strong>${match.homeTeam.name} [${match.homeTeam.tag}]</strong> vs <strong>${match.awayTeam.name} [${match.awayTeam.tag}]</strong>
          </div>
          <div class="match-maps">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-muted);">Maps:</h4>
            ${mapListHtml}
          </div>
          ${match.status === 'PENDING' ? `
            <div style="margin-top: 1rem;">
              <button class="btn btn-primary" onclick="homeLeagueLadder.reportMatch('${match.id}')">Report Result</button>
            </div>
          ` : match.status === 'REPORTED' && match.report ? `
            <div style="margin-top: 1rem;">
              <button class="btn btn-success" onclick="homeLeagueLadder.openConfirmModal('${match.report.id}')">Confirm/Dispute</button>
            </div>
          ` : ''}
        `;
      }
      grid.appendChild(card);
    });
  }

  renderTeams() {
    const container = document.getElementById('teamsList');
    if (!container) return;
    container.innerHTML = '';

    if (this.teams.length === 0) {
      container.innerHTML = '<div class="loading">No teams created yet. Create your first team to get started!</div>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Team</th>
          <th>Tag</th>
          <th>Players</th>
          <th>Elo</th>
          <th>Record</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    this.teams.forEach(team => {
      const row = document.createElement('tr');
      const playerCount = (team.players || []).length + (team.benchPlayers || []).length;
      row.innerHTML = `
        <td>
          <div class="team-cell">
            <img src="${team.logo}" alt="${team.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
            <div class="team-info">
              <div class="team-name">${team.name}</div>
            </div>
          </div>
        </td>
        <td>[${team.tag}]</td>
        <td>${playerCount} players</td>
        <td><span class="elo-value">${Math.round(team.elo)}</span></td>
        <td>${team.wins}-${team.losses}</td>
        <td>
          <button class="btn btn-secondary" onclick="homeLeagueLadder.editTeam('${team.id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Edit</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    container.appendChild(table);
  }

  renderMapPool() {
    const container = document.getElementById('mapPool');
    if (!container) return;
    container.innerHTML = '';

    const mapGrid = document.createElement('div');
    mapGrid.style.display = 'grid';
    mapGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    mapGrid.style.gap = '1rem';

    this.mapPool.forEach(map => {
      const mapCard = document.createElement('div');
      mapCard.style.background = 'var(--surface-glass)';
      mapCard.style.padding = '1rem';
      mapCard.style.borderRadius = '0.5rem';
      mapCard.style.textAlign = 'center';
      mapCard.style.fontWeight = '600';
      mapCard.textContent = map;
      mapGrid.appendChild(mapCard);
    });

    container.appendChild(mapGrid);
  }

  renderRules() {
    const weeklyScheduleEl = document.getElementById('rulesWeeklySchedule');
    const matchReportingEl = document.getElementById('rulesMatchReporting');
    const eloSystemEl = document.getElementById('rulesEloSystem');
    const rankingsEl = document.getElementById('rulesRankings');

    if (weeklyScheduleEl) weeklyScheduleEl.innerHTML = this.rules.weeklySchedule;
    if (matchReportingEl) matchReportingEl.innerHTML = this.rules.matchReporting;
    if (eloSystemEl) eloSystemEl.innerHTML = this.rules.eloSystem;
    if (rankingsEl) rankingsEl.innerHTML = this.rules.rankings;
  }

  renderScoreboardUpload() {
    const container = document.getElementById('scoreboardUploadContent');
    if (!container) return;
    
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <label class="form-label">Select Your Team</label>
          <select id="scoreboardTeamSelect" class="form-select">
            <option value="">Select Your Team</option>
            ${this.teams.map(t => `<option value="${t.id}">${t.name} [${t.tag}]</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Select Opponent Team</label>
          <select id="scoreboardOpponentSelect" class="form-select">
            <option value="">Select Opponent</option>
            ${this.teams.map(t => `<option value="${t.id}">${t.name} [${t.tag}]</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label class="form-label">Map</label>
        <select id="scoreboardMapSelect" class="form-select">
          <option value="">Select Map</option>
          ${this.mapPool.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label class="form-label">Upload Scoreboard Image</label>
        <input type="file" id="scoreboardImageInput" accept="image/*" class="form-input">
      </div>
      <div id="scoreboardPreviewSection" style="display: none; margin-bottom: 1.5rem;">
        <img id="scoreboardImagePreview" style="max-width: 100%; border-radius: 0.5rem; border: 1px solid rgba(148, 163, 184, 0.16);">
      </div>
      <button id="scoreboardProcessBtn" class="btn btn-primary" disabled>Process Image with OCR</button>
      <div id="scoreboardProcessingStatus" style="display: none; margin-top: 1rem;">
        <div class="loading">
          <div class="spinner"></div>
          Processing image with OCR...
        </div>
      </div>
      <div id="scoreboardResultsSection" style="display: none; margin-top: 2rem;">
        <h3 style="margin-bottom: 1rem;">OCR Results - Review & Match Players</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          <div>
            <h4 id="scoreboardTeam1Name" style="margin-bottom: 1rem;">Team 1</h4>
            <div id="scoreboardTeam1Results"></div>
          </div>
          <div>
            <h4 id="scoreboardTeam2Name" style="margin-bottom: 1rem;">Team 2</h4>
            <div id="scoreboardTeam2Results"></div>
          </div>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
          <button id="scoreboardSubmitBtn" class="btn btn-success">Submit for Review</button>
          <button id="scoreboardCancelBtn" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `;

    // Setup event listeners
    const imageInput = document.getElementById('scoreboardImageInput');
    const processBtn = document.getElementById('scoreboardProcessBtn');
    
    if (imageInput) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const preview = document.getElementById('scoreboardImagePreview');
          preview.src = URL.createObjectURL(file);
          document.getElementById('scoreboardPreviewSection').style.display = 'block';
          processBtn.disabled = false;
        }
      });
    }

    if (processBtn) {
      processBtn.addEventListener('click', () => {
        const file = document.getElementById('scoreboardImageInput').files[0];
        if (file) {
          this.processScoreboardImage(file);
        }
      });
    }

    const submitBtn = document.getElementById('scoreboardSubmitBtn');
    const cancelBtn = document.getElementById('scoreboardCancelBtn');
    
    if (submitBtn) submitBtn.addEventListener('click', () => this.submitScoreboard());
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      document.getElementById('scoreboardResultsSection').style.display = 'none';
    });
  }

  renderPlayerStats() {
    const container = document.getElementById('playerStatsContent');
    if (!container) return;
    
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        Loading player statistics...
      </div>
    `;
    
    // Load stats from Firebase
    this.loadPlayerStats();
  }

  async loadPlayerStats() {
    try {
      const statsRef = doc(db, 'homeLeagueStats', 'aggregates');
      const statsSnap = await getDoc(statsRef);
      
      const container = document.getElementById('playerStatsContent');
      if (!container) return;

      if (!statsSnap.exists()) {
        container.innerHTML = '<p style="color: var(--text-muted);">No player statistics available yet. Upload scoreboards to generate stats.</p>';
        return;
      }

      const data = statsSnap.data();
      const playerTotals = data.playerTotals || [];
      
      if (playerTotals.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">No player statistics available yet.</p>';
        return;
      }

      // Render player stats table
      container.innerHTML = `
        <div style="background: var(--card-bg); border-radius: 1rem; overflow: hidden;">
          <div class="table-header">
            <h2 class="table-title">Player Statistics</h2>
            <p class="table-subtitle">Total matches: ${data.totalMatches || 0}</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Teams</th>
                <th>Matches</th>
                <th>Time (min)</th>
                <th>Kills</th>
                <th>Assists</th>
                <th>Score</th>
                <th>Captures</th>
                <th>Returns</th>
                <th>KPM</th>
                <th>APM</th>
                <th>SPM</th>
              </tr>
            </thead>
            <tbody id="playerStatsTableBody"></tbody>
          </table>
        </div>
      `;

      const tbody = document.getElementById('playerStatsTableBody');
      const sortedPlayers = playerTotals.sort((a, b) => (b.kills || 0) - (a.kills || 0));
      
      sortedPlayers.slice(0, 25).forEach(player => {
        const row = document.createElement('tr');
        const time = player.time || 0;
        const kpm = time > 0 ? ((player.kills || 0) / time).toFixed(2) : '0.00';
        const apm = time > 0 ? ((player.assists || 0) / time).toFixed(2) : '0.00';
        const spm = time > 0 ? ((player.score || 0) / time).toFixed(2) : '0.00';
        const teams = Array.isArray(player.teams) ? player.teams.join(', ') : (player.team || '-');
        
        row.innerHTML = `
          <td>${player.name}</td>
          <td>${teams}</td>
          <td>${player.matches || 0}</td>
          <td>${time.toFixed(2)}</td>
          <td>${player.kills || 0}</td>
          <td>${player.assists || 0}</td>
          <td>${player.score || 0}</td>
          <td>${player.captures || 0}</td>
          <td>${player.returns || 0}</td>
          <td>${kpm}</td>
          <td>${apm}</td>
          <td>${spm}</td>
        `;
        tbody.appendChild(row);
      });
    } catch (error) {
      console.error('Error loading player stats:', error);
      const container = document.getElementById('playerStatsContent');
      if (container) {
        if (error.code === 'permission-denied') {
          container.innerHTML = '<p style="color: var(--text-muted);">Firebase permissions required to view player statistics. Please check security rules.</p>';
        } else {
          container.innerHTML = '<p style="color: var(--danger);">Error loading player statistics.</p>';
        }
      }
    }
  }

  generateWeeklyMatches() {
    if (this.isRegenerating) return;
    
    this.matches.length = 0;
    const teamIds = this.teams.map(t => t.id);
    const matches = this.generateRoundRobinPairings(teamIds, this.currentWeek);
    const assignedTeams = new Set();
    
    matches.forEach((match, index) => {
      if (match.awayTeamId === 'BYE') {
        if (!assignedTeams.has(match.homeTeamId)) {
          const byeTeamData = this.teams.find(t => t.id === match.homeTeamId);
          if (byeTeamData) {
            this.matches.push({
              id: `bye-${this.currentWeek}-${match.homeTeamId}`,
              weekNumber: this.currentWeek,
              homeTeamId: match.homeTeamId,
              awayTeamId: 'BYE',
              homeTeam: byeTeamData,
              awayTeam: { id: 'BYE', name: 'BYE', tag: 'BYE', logo: '', elo: 0, wins: 0, losses: 0, mapsWon: 0, mapsLost: 0, last5: '' },
              status: 'BYE',
              mapSet: [],
              scheduledAt: new Date(),
              report: null,
              reportId: null
            });
            assignedTeams.add(match.homeTeamId);
          }
        }
      } else {
        if (!assignedTeams.has(match.homeTeamId) && !assignedTeams.has(match.awayTeamId)) {
          const homeTeam = this.teams.find(t => t.id === match.homeTeamId);
          const awayTeam = this.teams.find(t => t.id === match.awayTeamId);
          if (homeTeam && awayTeam) {
            const matchId = `match-${this.currentWeek}-${index + 1}`;
            this.matches.push({
              id: matchId,
              weekNumber: this.currentWeek,
              homeTeamId: match.homeTeamId,
              awayTeamId: match.awayTeamId,
              homeTeam: homeTeam,
              awayTeam: awayTeam,
              status: 'PENDING',
              mapSet: this.generateMapSet(matchId),
              scheduledAt: new Date(),
              report: null,
              reportId: null
            });
            assignedTeams.add(match.homeTeamId);
            assignedTeams.add(match.awayTeamId);
          }
        }
      }
    });
    
    this.syncAdminMatches();
    this.saveToFirebase();
  }

  generateRoundRobinPairings(teamIds, weekNumber) {
    const teams = [...teamIds];
    const isOdd = teams.length % 2 === 1;
    if (isOdd) teams.push('BYE');
    const numRounds = teams.length - 1;
    const currentRound = (weekNumber - 1) % numRounds;
    const rotatedTeams = [...teams];
    for (let i = 0; i < currentRound; i++) {
      const lastTeam = rotatedTeams.pop();
      rotatedTeams.splice(1, 0, lastTeam);
    }
    const pairings = [];
    for (let i = 0; i < Math.floor(rotatedTeams.length / 2); i++) {
      const homeTeam = rotatedTeams[i];
      const awayTeam = rotatedTeams[rotatedTeams.length - 1 - i];
      if (homeTeam === 'BYE') {
        pairings.push({ homeTeamId: awayTeam, awayTeamId: 'BYE' });
      } else if (awayTeam === 'BYE') {
        pairings.push({ homeTeamId: homeTeam, awayTeamId: 'BYE' });
      } else {
        pairings.push({ homeTeamId: homeTeam, awayTeamId: awayTeam });
      }
    }
    return pairings;
  }

  generateMapSet(matchId) {
    const seed = matchId.split('-').join('').length + matchId.charCodeAt(0);
    const shuffled = [...this.mapPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }

  syncAdminMatches() {
    this.adminMatches = this.matches.map(match => ({
      ...match,
      homeTeam: { ...match.homeTeam },
      awayTeam: { ...match.awayTeam },
      report: match.report ? { ...match.report } : null
    }));
  }

  sortTable(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.teams.sort((a, b) => {
      let aVal, bVal;
      switch (column) {
        case 'rank':
          aVal = this.teams.indexOf(a) + 1;
          bVal = this.teams.indexOf(b) + 1;
          break;
        case 'elo':
          aVal = a.elo;
          bVal = b.elo;
          break;
        case 'record':
          aVal = a.wins - a.losses;
          bVal = b.wins - b.losses;
          break;
        case 'winpct':
          aVal = a.wins + a.losses > 0 ? a.wins / (a.wins + a.losses) : 0;
          bVal = b.wins + b.losses > 0 ? b.wins / (b.wins + b.losses) : 0;
          break;
        case 'maps':
          aVal = a.mapsWon - a.mapsLost;
          bVal = b.mapsWon - b.mapsLost;
          break;
        default:
          return 0;
      }
      return this.sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    this.renderRankings();
  }

  // Scoreboard Upload Methods
  async processScoreboardImage(imageFile) {
    const statusEl = document.getElementById('scoreboardProcessingStatus');
    const resultsEl = document.getElementById('scoreboardResultsSection');
    if (statusEl) statusEl.style.display = 'block';

    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      this.preprocessImage(img, canvas);

      if (!this.ocrWorker) {
        this.ocrWorker = await Tesseract.createWorker('eng');
        await this.ocrWorker.setParameters({
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,- ',
          tessedit_pageseg_mode: '6',
          tessedit_ocr_engine_mode: '1',
        });
      }

      const { data: { text } } = await this.ocrWorker.recognize(canvas);
      const parsed = this.parseOCRText(text);
      this.ocrResults = parsed;
      
      if (statusEl) statusEl.style.display = 'none';
      if (resultsEl) resultsEl.style.display = 'block';
      
      this.displayScoreboardResults(parsed);
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to process image. Please try again.');
      if (statusEl) statusEl.style.display = 'none';
    }
  }

  preprocessImage(img, canvas) {
    const ctx = canvas.getContext('2d');
    const H = img.height;
    const W = img.width;
    const roiTop = 0.27;
    const roiBottom = 0.80;
    const roiLeft = 0.06;
    const roiRight = 0.94;
    const y0 = Math.floor(roiTop * H);
    const y1 = Math.floor(roiBottom * H);
    const x0 = Math.floor(roiLeft * W);
    const x1 = Math.floor(roiRight * W);
    const upscale = 2.0;
    const cropWidth = x1 - x0;
    const cropHeight = y1 - y0;
    canvas.width = cropWidth * upscale;
    canvas.height = cropHeight * upscale;
    ctx.drawImage(img, x0, y0, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.5 + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.5 + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.5 + 128));
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  parseOCRText(text) {
    // Simplified OCR parsing - full implementation from ScoreboardUpload.html
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const team1 = [];
    const team2 = [];
    const statRows = [];
    
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.length < 2) return;
      let processedLine = trimmed.replace(/(\d{1,3}),(\d{3})/g, (match, p1, p2) => {
        return (parseInt(p1) * 1000 + parseInt(p2)).toString();
      });
      const numberMatches = [...processedLine.matchAll(/\d+/g)];
      if (!numberMatches || numberMatches.length < 2) return;
      const numbers = numberMatches.map(m => parseInt(m[0], 10));
      const sortedByValue = [...numbers].sort((a, b) => b - a);
      let score = sortedByValue[0];
      if (score < 50) score = numbers.find(n => n > 50) || numbers[0];
      const scoreIndex = numbers.indexOf(score);
      const stats = this.extractStatsFromNumbers(numbers, score, scoreIndex);
      if (numbers.length >= 2) {
        statRows.push({ score, ...stats, time: 0, lineIndex: idx });
      }
    });
    
    const filteredRows = statRows.filter(row => row.score > 50 || row.score > 0);
    filteredRows.forEach((row, idx) => {
      if (idx < filteredRows.length / 2) {
        team1.push(row);
      } else {
        team2.push(row);
      }
    });
    
    // Ensure we always have 7 entries per team (pad with zeros if needed)
    const requiredPlayers = 7;
    const emptyEntry = { score: 0, kills: 0, assists: 0, captures: 0, returns: 0, time: 0 };
    
    // Pad team1 to 7 entries
    while (team1.length < requiredPlayers) {
      team1.push({ ...emptyEntry });
    }
    // Keep only first 7 entries if more than 7
    team1.splice(requiredPlayers);
    
    // Pad team2 to 7 entries
    while (team2.length < requiredPlayers) {
      team2.push({ ...emptyEntry });
    }
    // Keep only first 7 entries if more than 7
    team2.splice(requiredPlayers);
    
    return { team1, team2 };
  }

  extractStatsFromNumbers(numbers, scoreValue, scoreIndex) {
    let kills = 0, assists = 0, captures = 0, returns = 0;
    if (scoreIndex < numbers.length - 4) {
      const candidateKills = numbers[scoreIndex + 1];
      const candidateAssists = numbers[scoreIndex + 2];
      const candidateCaptures = numbers[scoreIndex + 3];
      const candidateReturns = numbers[scoreIndex + 4];
      if (candidateKills < 500 && candidateAssists < 500 && candidateCaptures < 500 && candidateReturns < 500) {
        kills = candidateKills || 0;
        assists = candidateAssists || 0;
        captures = candidateCaptures || 0;
        returns = candidateReturns || 0;
        return { kills, assists, captures, returns };
      }
    }
    const allButScore = numbers.filter((n, i) => i !== scoreIndex && n < scoreValue);
    if (allButScore.length >= 4) {
      const reasonableStats = allButScore.filter(n => n < 200).sort((a, b) => b - a);
      if (reasonableStats.length >= 4) {
        kills = reasonableStats[0] || 0;
        assists = reasonableStats[1] || 0;
        captures = reasonableStats[2] || 0;
        returns = reasonableStats[3] || 0;
      }
    }
    return { kills, assists, captures, returns };
  }

  getAssignedPlayerCount(teamNum) {
    let count = 0;
    const entries = teamNum === 1 ? this.team1Entries : this.team2Entries;
    entries.forEach((entry, idx) => {
      const select = document.querySelector(`[data-team="${teamNum}"][data-index="${idx}"]`);
      const playerName = select?.value;
      if (playerName && playerName !== '__CUSTOM__' && playerName !== '') {
        count++;
      }
    });
    return count;
  }

  updateScoreboardValidation() {
    const team1Count = this.getAssignedPlayerCount(1);
    const team2Count = this.getAssignedPlayerCount(2);
    const minPlayers = 7;
    const isValid = team1Count >= minPlayers && team2Count >= minPlayers;
    
    // Update player count displays
    const team1CountEl = document.getElementById('scoreboardTeam1Count');
    const team2CountEl = document.getElementById('scoreboardTeam2Count');
    const validationMsg = document.getElementById('scoreboardValidationMsg');
    const submitBtn = document.getElementById('scoreboardSubmitBtn');
    
    if (team1CountEl) {
      team1CountEl.textContent = `Players assigned: ${team1Count}/${minPlayers}`;
      team1CountEl.style.color = team1Count >= minPlayers ? 'var(--success)' : 'var(--danger)';
    }
    
    if (team2CountEl) {
      team2CountEl.textContent = `Players assigned: ${team2Count}/${minPlayers}`;
      team2CountEl.style.color = team2Count >= minPlayers ? 'var(--success)' : 'var(--danger)';
    }
    
    if (validationMsg) {
      if (isValid) {
        validationMsg.innerHTML = '<div style="color: var(--success); padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.5rem; margin-bottom: 1rem;">✓ Both teams have at least 7 players assigned. Ready to submit!</div>';
      } else {
        const missing1 = Math.max(0, minPlayers - team1Count);
        const missing2 = Math.max(0, minPlayers - team2Count);
        validationMsg.innerHTML = `<div style="color: var(--danger); padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-radius: 0.5rem; margin-bottom: 1rem;">
          ⚠ Minimum 7 players required per team.<br>
          Team 1: ${missing1 > 0 ? `Need ${missing1} more player${missing1 > 1 ? 's' : ''}` : 'Complete'}<br>
          Team 2: ${missing2 > 0 ? `Need ${missing2} more player${missing2 > 1 ? 's' : ''}` : 'Complete'}
        </div>`;
      }
    }
    
    if (submitBtn) {
      submitBtn.disabled = !isValid;
      submitBtn.style.opacity = isValid ? '1' : '0.5';
      submitBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
    }
  }

  displayScoreboardResults(results) {
    const team1Div = document.getElementById('scoreboardTeam1Results');
    const team2Div = document.getElementById('scoreboardTeam2Results');
    const team1NameEl = document.getElementById('scoreboardTeam1Name');
    const team2NameEl = document.getElementById('scoreboardTeam2Name');
    
    if (!team1Div || !team2Div) return;

    const team1Id = document.getElementById('scoreboardTeamSelect').value;
    const team2Id = document.getElementById('scoreboardOpponentSelect').value;
    const team1 = this.teams.find(t => t.id === team1Id);
    const team2 = this.teams.find(t => t.id === team2Id);

    if (team1NameEl && team1) {
      team1NameEl.textContent = `${team1.name} (Blue)`;
    }
    if (team2NameEl && team2) {
      team2NameEl.textContent = `${team2.name} (Red)`;
    }

    this.team1Entries = results.team1.map((statRow, idx) => ({
      ...statRow,
      player: '',
      isOCR: true,
      originalIdx: idx
    }));

    this.team2Entries = results.team2.map((statRow, idx) => ({
      ...statRow,
      player: '',
      isOCR: true,
      originalIdx: idx
    }));

    team1Div.innerHTML = '';
    team2Div.innerHTML = '';

    const team1Roster = team1 ? [...(team1.players || []), ...(team1.benchPlayers || [])] : [];
    const team2Roster = team2 ? [...(team2.players || []), ...(team2.benchPlayers || [])] : [];

    this.team1Entries.forEach((entry, idx) => {
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-800 rounded border border-blue-500';
      div.style.cssText = 'padding: 0.75rem; background: var(--surface-glass); border-radius: 0.5rem; border: 1px solid rgba(59, 130, 246, 0.5); margin-bottom: 0.75rem;';
      div.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
          <select class="form-select scoreboard-player-select" style="width: 100%;" data-team="1" data-index="${idx}">
            <option value="">Select player for these stats</option>
            ${team1Roster.map(p => `<option value="${p}">${p}</option>`).join('')}
            <option value="__CUSTOM__">Add Custom Player</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; font-size: 0.8rem; align-items: center;">
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Score:</label>
            <input type="number" class="form-input" data-team="1" data-index="${idx}" data-stat="score" value="${entry.score || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Kills:</label>
            <input type="number" class="form-input" data-team="1" data-index="${idx}" data-stat="kills" value="${entry.kills || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Assists:</label>
            <input type="number" class="form-input" data-team="1" data-index="${idx}" data-stat="assists" value="${entry.assists || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Captures:</label>
            <input type="number" class="form-input" data-team="1" data-index="${idx}" data-stat="captures" value="${entry.captures || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Returns:</label>
            <input type="number" class="form-input" data-team="1" data-index="${idx}" data-stat="returns" value="${entry.returns || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <button class="btn btn-danger" onclick="homeLeagueLadder.removeScoreboardEntry(1, ${idx})" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;">Remove</button>
        </div>
      `;
      team1Div.appendChild(div);
    });

    this.team2Entries.forEach((entry, idx) => {
      const div = document.createElement('div');
      div.className = 'p-3 bg-gray-800 rounded border border-blue-500';
      div.style.cssText = 'padding: 0.75rem; background: var(--surface-glass); border-radius: 0.5rem; border: 1px solid rgba(59, 130, 246, 0.5); margin-bottom: 0.75rem;';
      div.innerHTML = `
        <div style="margin-bottom: 0.5rem;">
          <select class="form-select scoreboard-player-select" style="width: 100%;" data-team="2" data-index="${idx}">
            <option value="">Select player for these stats</option>
            ${team2Roster.map(p => `<option value="${p}">${p}</option>`).join('')}
            <option value="__CUSTOM__">Add Custom Player</option>
          </select>
        </div>
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; font-size: 0.8rem; align-items: center;">
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Score:</label>
            <input type="number" class="form-input" data-team="2" data-index="${idx}" data-stat="score" value="${entry.score || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Kills:</label>
            <input type="number" class="form-input" data-team="2" data-index="${idx}" data-stat="kills" value="${entry.kills || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Assists:</label>
            <input type="number" class="form-input" data-team="2" data-index="${idx}" data-stat="assists" value="${entry.assists || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Captures:</label>
            <input type="number" class="form-input" data-team="2" data-index="${idx}" data-stat="captures" value="${entry.captures || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <div>
            <label style="display: block; font-size: 0.7rem; margin-bottom: 0.25rem;">Returns:</label>
            <input type="number" class="form-input" data-team="2" data-index="${idx}" data-stat="returns" value="${entry.returns || 0}" min="0" style="width: 100%; padding: 0.25rem; font-size: 0.8rem;">
          </div>
          <button class="btn btn-danger" onclick="homeLeagueLadder.removeScoreboardEntry(2, ${idx})" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;">Remove</button>
        </div>
      `;
      team2Div.appendChild(div);
    });

  }

  removeScoreboardEntry(teamNum, index) {
    if (teamNum === 1) {
      this.team1Entries.splice(index, 1);
    } else {
      this.team2Entries.splice(index, 1);
    }
    this.displayScoreboardResults({ team1: this.team1Entries, team2: this.team2Entries });
    // Validation will be updated by displayScoreboardResults
  }

  async submitScoreboard() {
    const team1Id = document.getElementById('scoreboardTeamSelect').value;
    const team2Id = document.getElementById('scoreboardOpponentSelect').value;
    const map = document.getElementById('scoreboardMapSelect').value;

    if (!team1Id || !team2Id || !map) {
      alert('Please fill in all fields (Team, Opponent, and Map)');
      return;
    }

    if (!this.currentUser) {
      alert('Please sign in to submit a scoreboard');
      return;
    }

    const team1 = this.teams.find(t => t.id === team1Id);
    const team2 = this.teams.find(t => t.id === team2Id);

    if (!team1 || !team2) {
      alert('Invalid team selection');
      return;
    }

    // Collect stats from entries (read from input fields)
    const stats = {
      [team1.name]: { players: {}, totals: { kills: 0, assists: 0, score: 0, captures: 0, returns: 0, time: 0 } },
      [team2.name]: { players: {}, totals: { kills: 0, assists: 0, score: 0, captures: 0, returns: 0, time: 0 } }
    };

    // Process team 1 entries - read from input fields
    this.team1Entries.forEach((entry, idx) => {
      const select = document.querySelector(`[data-team="1"][data-index="${idx}"].scoreboard-player-select`);
      const playerName = select?.value;
      if (!playerName || playerName === '__CUSTOM__' || playerName === '') return;
      
      // Read stats from input fields
      const scoreInput = document.querySelector(`[data-team="1"][data-index="${idx}"][data-stat="score"]`);
      const killsInput = document.querySelector(`[data-team="1"][data-index="${idx}"][data-stat="kills"]`);
      const assistsInput = document.querySelector(`[data-team="1"][data-index="${idx}"][data-stat="assists"]`);
      const capturesInput = document.querySelector(`[data-team="1"][data-index="${idx}"][data-stat="captures"]`);
      const returnsInput = document.querySelector(`[data-team="1"][data-index="${idx}"][data-stat="returns"]`);
      
      const score = parseInt(scoreInput?.value || 0);
      const kills = parseInt(killsInput?.value || 0);
      const assists = parseInt(assistsInput?.value || 0);
      const captures = parseInt(capturesInput?.value || 0);
      const returns = parseInt(returnsInput?.value || 0);
      
      if (!stats[team1.name].players[playerName]) {
        stats[team1.name].players[playerName] = { kills: 0, assists: 0, score: 0, captures: 0, returns: 0, time: 0 };
      }
      
      stats[team1.name].players[playerName].score += score;
      stats[team1.name].players[playerName].kills += kills;
      stats[team1.name].players[playerName].assists += assists;
      stats[team1.name].players[playerName].captures += captures;
      stats[team1.name].players[playerName].returns += returns;
      
      stats[team1.name].totals.score += score;
      stats[team1.name].totals.kills += kills;
      stats[team1.name].totals.assists += assists;
      stats[team1.name].totals.captures += captures;
      stats[team1.name].totals.returns += returns;
    });

    // Process team 2 entries - read from input fields
    this.team2Entries.forEach((entry, idx) => {
      const select = document.querySelector(`[data-team="2"][data-index="${idx}"].scoreboard-player-select`);
      const playerName = select?.value;
      if (!playerName || playerName === '__CUSTOM__' || playerName === '') return;
      
      // Read stats from input fields
      const scoreInput = document.querySelector(`[data-team="2"][data-index="${idx}"][data-stat="score"]`);
      const killsInput = document.querySelector(`[data-team="2"][data-index="${idx}"][data-stat="kills"]`);
      const assistsInput = document.querySelector(`[data-team="2"][data-index="${idx}"][data-stat="assists"]`);
      const capturesInput = document.querySelector(`[data-team="2"][data-index="${idx}"][data-stat="captures"]`);
      const returnsInput = document.querySelector(`[data-team="2"][data-index="${idx}"][data-stat="returns"]`);
      
      const score = parseInt(scoreInput?.value || 0);
      const kills = parseInt(killsInput?.value || 0);
      const assists = parseInt(assistsInput?.value || 0);
      const captures = parseInt(capturesInput?.value || 0);
      const returns = parseInt(returnsInput?.value || 0);
      
      if (!stats[team2.name].players[playerName]) {
        stats[team2.name].players[playerName] = { kills: 0, assists: 0, score: 0, captures: 0, returns: 0, time: 0 };
      }
      
      stats[team2.name].players[playerName].score += score;
      stats[team2.name].players[playerName].kills += kills;
      stats[team2.name].players[playerName].assists += assists;
      stats[team2.name].players[playerName].captures += captures;
      stats[team2.name].players[playerName].returns += returns;
      
      stats[team2.name].totals.score += score;
      stats[team2.name].totals.kills += kills;
      stats[team2.name].totals.assists += assists;
      stats[team2.name].totals.captures += captures;
      stats[team2.name].totals.returns += returns;
    });

    try {
      // Submit to pending matches for admin review
      await addDoc(collection(db, 'homeLeaguePendingMatches'), {
        submittedBy: this.currentUser.uid,
        submittedByEmail: this.currentUser.email,
        submittedAt: serverTimestamp(),
        team1: team1.name,
        team2: team2.name,
        team1Id: team1Id,
        team2Id: team2Id,
        map: map,
        stats: stats,
        status: 'pending',
        ocrResults: this.ocrResults
      });

      alert('Scoreboard submitted successfully! Pending admin review.');
      document.getElementById('scoreboardResultsSection').style.display = 'none';
      document.getElementById('scoreboardImageInput').value = '';
      document.getElementById('scoreboardPreviewSection').style.display = 'none';
    } catch (error) {
      console.error('Error submitting scoreboard:', error);
      alert('Failed to submit scoreboard. Please try again.');
    }
  }

  // Match Reporting Methods (from LadderBoard.html)
  reportMatch(matchId) {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) {
      alert('Match not found.');
      return;
    }
    this.currentReportMatch = match;
    this.openReportModal();
  }

  openReportModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('reportModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'reportModal';
      modal.className = 'modal';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Report Match Result</h2>
            <button class="modal-close" onclick="homeLeagueLadder.closeReportModal()">&times;</button>
          </div>
          <form id="reportForm">
            <div class="form-group">
              <label class="form-label">Match</label>
              <div id="matchInfo" class="match-info-display"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Scoreboard Images (Upload URLs)</label>
              <div id="scoreboardInputs">
                <input type="url" class="form-input" placeholder="https://example.com/scoreboard1.png" name="scoreboard1">
              </div>
              <button type="button" class="btn btn-secondary" onclick="homeLeagueLadder.addScoreboardInput()">Add Another Image</button>
            </div>
            <div class="form-group">
              <label class="form-label">Map Results</label>
              <div id="mapResults"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Winner</label>
              <select class="form-select" name="winner" required>
                <option value="">Select Winner</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Additional Notes (Optional)</label>
              <textarea class="form-textarea" name="notes" placeholder="Any additional information about the match..."></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="homeLeagueLadder.closeReportModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Report</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const matchInfo = document.getElementById('matchInfo');
    const mapResults = document.getElementById('mapResults');
    const winnerSelect = modal.querySelector('select[name="winner"]');
    
    if (matchInfo) {
      matchInfo.innerHTML = `
        <div class="match-teams">
          <img src="${this.currentReportMatch.homeTeam.logo}" alt="${this.currentReportMatch.homeTeam.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
          <span class="vs-text">vs</span>
          <img src="${this.currentReportMatch.awayTeam.logo}" alt="${this.currentReportMatch.awayTeam.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
        </div>
        <div style="margin-top: 0.5rem;">
          <strong>${this.currentReportMatch.homeTeam.name} [${this.currentReportMatch.homeTeam.tag}]</strong> vs <strong>${this.currentReportMatch.awayTeam.name} [${this.currentReportMatch.awayTeam.tag}]</strong>
        </div>
      `;
    }
    
    if (mapResults) {
      mapResults.innerHTML = '';
      this.currentReportMatch.mapSet.forEach((map, index) => {
        const mapDiv = document.createElement('div');
        mapDiv.className = 'map-result-input';
        mapDiv.innerHTML = `
          <div style="flex: 1; font-weight: 600;">${map}</div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="number" min="0" max="10" class="form-input" style="width: 60px;" name="map${index}_home" placeholder="0" required>
            <span>-</span>
            <input type="number" min="0" max="10" class="form-input" style="width: 60px;" name="map${index}_away" placeholder="0" required>
          </div>
        `;
        mapResults.appendChild(mapDiv);
      });
    }
    
    if (winnerSelect) {
      winnerSelect.innerHTML = `
        <option value="">Select Winner</option>
        <option value="${this.currentReportMatch.homeTeamId}">${this.currentReportMatch.homeTeam.name} [${this.currentReportMatch.homeTeam.tag}]</option>
        <option value="${this.currentReportMatch.awayTeamId}">${this.currentReportMatch.awayTeam.name} [${this.currentReportMatch.awayTeam.tag}]</option>
      `;
    }
    
    modal.style.display = 'block';
  }

  closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('reportForm');
    if (form) form.reset();
    this.currentReportMatch = null;
  }

  addScoreboardInput() {
    const container = document.getElementById('scoreboardInputs');
    if (!container) return;
    const inputCount = container.children.length;
    const newInput = document.createElement('input');
    newInput.type = 'url';
    newInput.className = 'form-input';
    newInput.name = `scoreboard${inputCount + 1}`;
    newInput.placeholder = `https://example.com/scoreboard${inputCount + 1}.png`;
    container.appendChild(newInput);
  }

  async submitReport(event) {
    event.preventDefault();
    if (!this.currentReportMatch) return;

    const formData = new FormData(event.target);
    const scoreboardUrls = [];
    for (let i = 1; i <= 5; i++) {
      const url = formData.get(`scoreboard${i}`);
      if (url && url.trim()) scoreboardUrls.push(url.trim());
    }

    const perMapScores = [];
    this.currentReportMatch.mapSet.forEach((map, index) => {
      const homeScore = parseInt(formData.get(`map${index}_home`));
      const awayScore = parseInt(formData.get(`map${index}_away`));
      perMapScores.push({ map, home: homeScore, away: awayScore });
    });

    const declaredWinner = formData.get('winner');
    const notes = formData.get('notes') || '';

    try {
      const reportData = {
        matchId: this.currentReportMatch.id,
        submittedByTeamId: this.currentReportMatch.homeTeamId,
        scoreboardUrls: scoreboardUrls,
        perMapScores: perMapScores,
        declaredWinnerTeamId: declaredWinner,
        notes: notes,
        homeTeamConfirm: 'PENDING',
        awayTeamConfirm: 'PENDING',
        createdAt: serverTimestamp(),
        submittedBy: this.currentUser ? this.currentUser.email : 'anonymous@test.com'
      };

      const reportRef = await addDoc(collection(db, 'homeLeagueReports'), reportData);
      const matchRef = doc(db, 'homeLeagueMatches', this.currentReportMatch.id);
      await updateDoc(matchRef, {
        status: 'REPORTED',
        reportId: reportRef.id
      });

      this.currentReportMatch.status = 'REPORTED';
      this.currentReportMatch.reportId = reportRef.id;
      this.currentReportMatch.report = { id: reportRef.id, ...reportData };
      
      this.syncAdminMatches();
      this.closeReportModal();
      this.renderMatches();
      alert('Match report submitted successfully! The opposing team will be notified to confirm.');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Error submitting report. Please try again.');
    }
  }

  openConfirmModal(reportId) {
    const report = this.matches.find(m => m.report && m.report.id === reportId)?.report;
    if (!report) return;
    
    this.currentConfirmReport = report;
    let modal = document.getElementById('confirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirmModal';
      modal.className = 'modal';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>Confirm Match Result</h2>
            <button class="modal-close" onclick="homeLeagueLadder.closeConfirmModal()">&times;</button>
          </div>
          <div id="confirmContent"></div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="homeLeagueLadder.closeConfirmModal()">Cancel</button>
            <button type="button" class="btn btn-danger" onclick="homeLeagueLadder.disputeMatch()">Dispute Result</button>
            <button type="button" class="btn btn-success" onclick="homeLeagueLadder.confirmMatch()">Confirm Result</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const match = this.matches.find(m => m.reportId === reportId);
    const content = document.getElementById('confirmContent');
    if (content && match) {
      content.innerHTML = `
        <div class="match-info-display" style="margin-bottom: 1.5rem;">
          <h3>Match Result to Confirm</h3>
          <div class="match-teams" style="margin: 1rem 0;">
            <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
            <span class="vs-text">vs</span>
            <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" class="team-logo" onerror="this.src='images/NullLogo.png'">
          </div>
          <div><strong>${match.homeTeam.name} [${match.homeTeam.tag}]</strong> vs <strong>${match.awayTeam.name} [${match.awayTeam.tag}]</strong></div>
        </div>
        <div style="margin-bottom: 1.5rem;">
          <h4>Map Results:</h4>
          ${report.perMapScores.map(score => 
            `<div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--surface-glass); margin: 0.25rem 0; border-radius: 0.25rem;">
              <span>${score.map}</span>
              <span><strong>${score.home} - ${score.away}</strong></span>
            </div>`
          ).join('')}
        </div>
        <div style="margin-bottom: 1.5rem;">
          <h4>Declared Winner:</h4>
          <div style="padding: 0.5rem; background: var(--success); color: white; border-radius: 0.25rem; text-align: center;">
            <strong>${match.homeTeamId === report.declaredWinnerTeamId ? match.homeTeam.name : match.awayTeam.name}</strong>
          </div>
        </div>
      `;
    }
    
    modal.style.display = 'block';
  }

  closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.style.display = 'none';
    this.currentConfirmReport = null;
  }

  async confirmMatch() {
    if (!this.currentUser || !this.currentConfirmReport) return;
    
    try {
      const reportRef = doc(db, 'homeLeagueReports', this.currentConfirmReport.id);
      await updateDoc(reportRef, {
        awayTeamConfirm: 'CONFIRMED',
        confirmedAt: serverTimestamp(),
        confirmedBy: this.currentUser.email
      });
      
      const updatedReport = { ...this.currentConfirmReport, awayTeamConfirm: 'CONFIRMED' };
      if (updatedReport.homeTeamConfirm === 'CONFIRMED' && updatedReport.awayTeamConfirm === 'CONFIRMED') {
        const match = this.matches.find(m => m.reportId === this.currentConfirmReport.id);
        const matchRef = doc(db, 'homeLeagueMatches', match.id);
        await updateDoc(matchRef, { status: 'FINAL' });
        await this.updateTeamStats(match, updatedReport);
        match.status = 'FINAL';
        alert('Match confirmed and finalized! Stats have been updated.');
      } else {
        alert('Match confirmed! Waiting for the other team to confirm.');
      }
      
      this.syncAdminMatches();
      this.closeConfirmModal();
      this.renderMatches();
      this.renderRankings();
    } catch (error) {
      console.error('Error confirming match:', error);
      alert('Error confirming match. Please try again.');
    }
  }

  async disputeMatch() {
    if (!this.currentUser || !this.currentConfirmReport) return;
    
    const reason = prompt('Please provide a reason for disputing this match result:');
    if (!reason) return;
    
    try {
      const reportRef = doc(db, 'homeLeagueReports', this.currentConfirmReport.id);
      await updateDoc(reportRef, {
        awayTeamConfirm: 'DISPUTED',
        disputeReason: reason,
        disputedAt: serverTimestamp(),
        disputedBy: this.currentUser.email
      });
      
      const match = this.matches.find(m => m.reportId === this.currentConfirmReport.id);
      const matchRef = doc(db, 'homeLeagueMatches', match.id);
      await updateDoc(matchRef, { status: 'CONTESTED' });
      
      match.status = 'CONTESTED';
      this.syncAdminMatches();
      this.closeConfirmModal();
      this.renderMatches();
      alert('Match disputed. An admin will review the dispute.');
    } catch (error) {
      console.error('Error disputing match:', error);
      alert('Error disputing match. Please try again.');
    }
  }

  async updateTeamStats(match, report) {
    const homeTeam = this.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = this.teams.find(t => t.id === match.awayTeamId);
    const homeWon = report.declaredWinnerTeamId === match.homeTeamId;
    
    if (homeWon) {
      homeTeam.wins++;
      awayTeam.losses++;
    } else {
      awayTeam.wins++;
      homeTeam.losses++;
    }
    
    report.perMapScores.forEach(score => {
      homeTeam.mapsWon += score.home;
      homeTeam.mapsLost += score.away;
      awayTeam.mapsWon += score.away;
      awayTeam.mapsLost += score.home;
    });
    
    homeTeam.last5 = (homeTeam.last5 + (homeWon ? 'W' : 'L')).slice(-5);
    awayTeam.last5 = (awayTeam.last5 + (homeWon ? 'L' : 'W')).slice(-5);
    
    await this.saveToFirebase();
  }

  // Admin Methods
  async renderAdminContent() {
    if (!this.isAdmin) return;
    this.renderAdminMatches();
    this.renderAdminTeams();
    this.renderAdminMapPool();
  }

  renderAdminMatches() {
    const container = document.getElementById('adminMatchesList');
    if (!container) return;
    container.innerHTML = '';

    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = 'background: var(--card-bg); border-radius: 1rem; overflow: hidden; box-shadow: var(--shadow-xl); backdrop-filter: blur(16px);';

    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse;';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background: var(--surface-glass);">
        <th style="padding: 1rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Match</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Status</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Maps</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Actions</th>
      </tr>
    `;

    const tbody = document.createElement('tbody');
    this.adminMatches.forEach((match) => {
      const row = document.createElement('tr');
      const statusClass = `status-${match.status.toLowerCase()}`;
      
      if (match.status === 'BYE') {
        row.innerHTML = `
          <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" style="width: 32px; height: 32px; border-radius: 0.5rem; object-fit: cover;" onerror="this.src='images/NullLogo.png'">
              <div>
                <div style="font-weight: 600;">${match.homeTeam.name} [${match.homeTeam.tag}]</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">BYE Week</div>
              </div>
            </div>
          </td>
          <td style="padding: 1rem; text-align: center;"><span class="status-badge ${statusClass}">${match.status}</span></td>
          <td style="padding: 1rem; text-align: center; color: var(--text-muted);">-</td>
          <td style="padding: 1rem; text-align: center;">
            <button class="btn btn-secondary" onclick="homeLeagueLadder.editMatch('${match.id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Edit</button>
          </td>
        `;
      } else {
        row.innerHTML = `
          <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" style="width: 24px; height: 24px; border-radius: 0.25rem;" onerror="this.src='images/NullLogo.png'">
              <span style="font-weight: 600; font-size: 0.9rem;">${match.homeTeam.tag}</span>
              <span style="color: var(--text-muted); font-weight: 600;">vs</span>
              <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" style="width: 24px; height: 24px; border-radius: 0.25rem;" onerror="this.src='images/NullLogo.png'">
              <span style="font-weight: 600; font-size: 0.9rem;">${match.awayTeam.tag}</span>
            </div>
          </td>
          <td style="padding: 1rem; text-align: center;"><span class="status-badge ${statusClass}">${match.status}</span></td>
          <td style="padding: 1rem; text-align: center; font-size: 0.8rem; color: var(--text-muted);">
            ${match.mapSet.slice(0, 2).join(', ')}${match.mapSet.length > 2 ? '...' : ''}
          </td>
          <td style="padding: 1rem; text-align: center;">
            <div style="display: flex; gap: 0.5rem; justify-content: center;">
              <button class="btn btn-secondary" onclick="homeLeagueLadder.editMatch('${match.id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Edit</button>
              <button class="btn btn-primary" onclick="homeLeagueLadder.editScore('${match.id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Score</button>
            </div>
          </td>
        `;
      }
      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
  }

  renderAdminTeams() {
    const container = document.getElementById('adminTeamsList');
    if (!container) return;
    container.innerHTML = '';

    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = 'background: var(--card-bg); border-radius: 1rem; overflow: hidden; box-shadow: var(--shadow-xl); backdrop-filter: blur(16px);';

    const table = document.createElement('table');
    table.style.cssText = 'width: 100%; border-collapse: collapse;';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background: var(--surface-glass);">
        <th style="padding: 1rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Team</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Elo</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Record</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Maps</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Last 5</th>
        <th style="padding: 1rem; text-align: center; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid rgba(148, 163, 184, 0.16);">Actions</th>
      </tr>
    `;

    const tbody = document.createElement('tbody');
    const sortedTeams = [...this.teams].sort((a, b) => b.elo - a.elo);
    
    sortedTeams.forEach((team) => {
      const row = document.createElement('tr');
      const last5Html = this.renderLastFive(team.last5);
      row.innerHTML = `
        <td style="padding: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${team.logo}" alt="${team.name}" style="width: 32px; height: 32px; border-radius: 0.5rem; object-fit: cover;" onerror="this.src='images/NullLogo.png'">
            <div>
              <div style="font-weight: 600;">${team.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">[${team.tag}]</div>
            </div>
          </div>
        </td>
        <td style="padding: 1rem; text-align: center;"><span style="font-weight: 600; color: var(--accent-strong);">${Math.round(team.elo)}</span></td>
        <td style="padding: 1rem; text-align: center;">${team.wins}-${team.losses}</td>
        <td style="padding: 1rem; text-align: center;">${team.mapsWon}-${team.mapsLost}</td>
        <td style="padding: 1rem; text-align: center;">
          <div style="display: flex; gap: 0.25rem; justify-content: center;">${last5Html}</div>
        </td>
        <td style="padding: 1rem; text-align: center;">
          <button class="btn btn-secondary" onclick="openEditTeamModal('${team.id}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Edit</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
  }

  renderAdminMapPool() {
    const container = document.getElementById('adminMapPool');
    if (!container) return;
    container.innerHTML = '';

    const mapContainer = document.createElement('div');
    mapContainer.style.cssText = 'background: var(--card-bg); border-radius: 1rem; padding: 1.5rem; box-shadow: var(--shadow-xl); backdrop-filter: blur(16px); border: 1px solid rgba(148, 163, 184, 0.16);';

    const mapFlex = document.createElement('div');
    mapFlex.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem;';

    this.mapPool.forEach((map, index) => {
      const mapTag = document.createElement('div');
      mapTag.style.cssText = 'background: var(--surface-glass); padding: 0.5rem 1rem; border-radius: 1rem; border: 1px solid rgba(148, 163, 184, 0.16); display: flex; align-items: center; gap: 0.5rem;';
      mapTag.innerHTML = `
        <span style="font-weight: 600;">${map}</span>
        <button class="btn btn-danger" onclick="homeLeagueLadder.removeMap(${index})" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; border-radius: 0.5rem;">×</button>
      `;
      mapFlex.appendChild(mapTag);
    });

    const addMapDiv = document.createElement('div');
    addMapDiv.style.cssText = 'display: flex; gap: 0.75rem; align-items: center; max-width: 500px;';
    const mapInput = document.createElement('input');
    mapInput.type = 'text';
    mapInput.className = 'form-input';
    mapInput.placeholder = 'Enter new map name';
    mapInput.id = 'newMapInput';
    mapInput.style.flex = '1';
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-primary';
    addButton.textContent = 'Add Map';
    addButton.onclick = () => this.addMap();
    addMapDiv.appendChild(mapInput);
    addMapDiv.appendChild(addButton);

    mapContainer.appendChild(mapFlex);
    mapContainer.appendChild(addMapDiv);
    container.appendChild(mapContainer);
  }

  addMap() {
    const input = document.getElementById('newMapInput');
    const mapName = input.value.trim();
    if (!mapName) {
      alert('Please enter a map name.');
      return;
    }
    if (this.mapPool.includes(mapName)) {
      alert('This map is already in the pool.');
      return;
    }
    this.mapPool.push(mapName);
    this.renderAdminMapPool();
    this.renderMapPool();
    input.value = '';
    this.saveToFirebase();
  }

  removeMap(index) {
    if (confirm(`Are you sure you want to remove "${this.mapPool[index]}" from the map pool?`)) {
      this.mapPool.splice(index, 1);
      this.renderAdminMapPool();
      this.renderMapPool();
      this.saveToFirebase();
    }
  }

  openEditTeamModal(teamId) {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) {
      alert('Team not found.');
      return;
    }

    let modal = document.getElementById('editTeamModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'editTeamModal';
      modal.className = 'modal';
      modal.style.display = 'none';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Team</h2>
          <button class="modal-close" onclick="closeEditTeamModal()">&times;</button>
        </div>
        <form id="editTeamForm">
          <div class="form-group">
            <label class="form-label">Team Name *</label>
            <input type="text" class="form-input" name="teamName" required placeholder="Enter team name">
          </div>
          <div class="form-group">
            <label class="form-label">Team Tag *</label>
            <input type="text" class="form-input" name="teamTag" required placeholder="Enter team tag (e.g., AV!)" maxlength="10">
          </div>
          <div class="form-group">
            <label class="form-label">Logo URL</label>
            <input type="url" class="form-input" name="logoUrl" placeholder="https://example.com/logo.png">
            <small style="color: var(--text-muted);">Leave empty to use default logo</small>
          </div>
          <div class="form-group">
            <label class="form-label">Players (one per line) *</label>
            <textarea class="form-textarea" name="players" required placeholder="Player1&#10;Player2&#10;Player3" rows="5"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Bench Players (one per line, optional)</label>
            <textarea class="form-textarea" name="benchPlayers" placeholder="Sub1&#10;Sub2" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Elo Rating</label>
            <input type="number" class="form-input" name="elo" min="0" placeholder="1500">
          </div>
          <div class="form-group">
            <label class="form-label">Wins</label>
            <input type="number" class="form-input" name="wins" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Losses</label>
            <input type="number" class="form-input" name="losses" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Maps Won</label>
            <input type="number" class="form-input" name="mapsWon" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Maps Lost</label>
            <input type="number" class="form-input" name="mapsLost" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Last 5 Results (e.g., WWLLW)</label>
            <input type="text" class="form-input" name="last5" maxlength="5" placeholder="WWLLW">
            <small style="color: var(--text-muted);">W for win, L for loss</small>
          </div>
          <input type="hidden" name="teamId" value="${teamId}">
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeEditTeamModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    `;

    // Populate form with current team data
    const form = document.getElementById('editTeamForm');
    form.querySelector('[name="teamName"]').value = team.name;
    form.querySelector('[name="teamTag"]').value = team.tag;
    form.querySelector('[name="logoUrl"]').value = team.logo || '';
    form.querySelector('[name="players"]').value = (team.players || []).join('\n');
    form.querySelector('[name="benchPlayers"]').value = (team.benchPlayers || []).join('\n');
    form.querySelector('[name="elo"]').value = team.elo || 1500;
    form.querySelector('[name="wins"]').value = team.wins || 0;
    form.querySelector('[name="losses"]').value = team.losses || 0;
    form.querySelector('[name="mapsWon"]').value = team.mapsWon || 0;
    form.querySelector('[name="mapsLost"]').value = team.mapsLost || 0;
    form.querySelector('[name="last5"]').value = team.last5 || '';

    // Setup form submission
    form.addEventListener('submit', (e) => this.submitEditTeam(e));

    modal.style.display = 'block';
  }

  closeEditTeamModal() {
    const modal = document.getElementById('editTeamModal');
    if (modal) {
      modal.style.display = 'none';
      const form = document.getElementById('editTeamForm');
      if (form) form.reset();
    }
  }

  async submitEditTeam(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const teamId = formData.get('teamId');
    const teamName = formData.get('teamName');
    const teamTag = formData.get('teamTag');
    const logoUrl = formData.get('logoUrl') || 'images/NullLogo.png';
    const players = formData.get('players').split('\n').filter(p => p.trim()).map(p => p.trim());
    const benchPlayers = formData.get('benchPlayers') ? formData.get('benchPlayers').split('\n').filter(p => p.trim()).map(p => p.trim()) : [];
    const elo = parseInt(formData.get('elo') || 1500);
    const wins = parseInt(formData.get('wins') || 0);
    const losses = parseInt(formData.get('losses') || 0);
    const mapsWon = parseInt(formData.get('mapsWon') || 0);
    const mapsLost = parseInt(formData.get('mapsLost') || 0);
    const last5 = formData.get('last5') || '';

    if (!teamName || !teamTag || players.length === 0) {
      alert('Please fill in all required fields (Team Name, Team Tag, and at least one player).');
      return;
    }

    try {
      const teamRef = doc(db, 'homeLeagueTeams', teamId);
      await updateDoc(teamRef, {
        teamName,
        teamTag,
        logoUrl,
        players,
        benchPlayers,
        elo,
        wins,
        losses,
        mapsWon,
        mapsLost,
        last5,
        updatedAt: serverTimestamp()
      });

      // Update local team data
      const team = this.teams.find(t => t.id === teamId);
      if (team) {
        team.name = teamName;
        team.tag = teamTag;
        team.logo = logoUrl;
        team.players = players;
        team.benchPlayers = benchPlayers;
        team.elo = elo;
        team.wins = wins;
        team.losses = losses;
        team.mapsWon = mapsWon;
        team.mapsLost = mapsLost;
        team.last5 = last5;
      }

      this.closeEditTeamModal();
      this.renderAdminTeams();
      this.renderTeams();
      this.renderRankings();
      alert('Team updated successfully!');
    } catch (error) {
      console.error('Error updating team:', error);
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check Firebase security rules or contact an admin.');
      } else {
        alert('Error updating team. Please try again.');
      }
    }
  }

  editMatch(matchId) {
    // Match editing functionality - similar to LadderBoard.html
    alert('Match editing functionality coming soon!');
  }

  editScore(matchId) {
    // Score editing functionality - similar to LadderBoard.html
    alert('Score editing functionality coming soon!');
  }

  async resetLadder() {
    if (confirm('Are you sure you want to reset the ladder? This will reset all team stats and start a new season.')) {
      try {
        this.teams.forEach(team => {
          team.elo = 1500;
          team.wins = 0;
          team.losses = 0;
          team.mapsWon = 0;
          team.mapsLost = 0;
          team.last5 = '';
        });
        this.currentWeek = 1;
        this.matches = [];
        this.generateWeeklyMatches();
        this.renderRankings();
        this.renderMatches();
        this.renderAdminContent();
        alert('Ladder has been reset for the new season!');
      } catch (error) {
        console.error('Error resetting ladder:', error);
        alert('Error resetting ladder. Please try again.');
      }
    }
  }

  async advanceWeek() {
    if (confirm('Are you sure you want to advance to the next week? This will process finalized matches and update Elo ratings.')) {
      try {
        await this.processWeekResults();
        this.currentWeek++;
        this.generateWeeklyMatches();
        this.renderMatches();
        this.renderRankings();
        this.renderAdminContent();
        alert(`Advanced to Week ${this.currentWeek}. Elo ratings have been updated.`);
      } catch (error) {
        console.error('Error advancing week:', error);
        alert('Error advancing week. Please try again.');
      }
    }
  }

  async processWeekResults() {
    const finalizedMatches = this.matches.filter(match => 
      match.status === 'FINAL' && match.report && match.report.declaredWinnerTeamId
    );

    for (const match of finalizedMatches) {
      await this.updateTeamElo(match, match.report);
    }

    this.lastRefresh = new Date();
    this.nextRefresh = this.getNextRefreshTime();
  }

  async updateTeamElo(match, report) {
    const homeTeam = this.teams.find(t => t.id === match.homeTeamId);
    const awayTeam = this.teams.find(t => t.id === match.awayTeamId);
    if (!homeTeam || !awayTeam) return;

    const homeWon = report.declaredWinnerTeamId === match.homeTeamId;
    const kFactor = 32;
    const homeExpected = 1 / (1 + Math.pow(10, (awayTeam.elo - homeTeam.elo) / 400));
    const awayExpected = 1 / (1 + Math.pow(10, (homeTeam.elo - awayTeam.elo) / 400));
    const homeActual = homeWon ? 1 : 0;
    const awayActual = homeWon ? 0 : 1;
    const homeEloChange = Math.round(kFactor * (homeActual - homeExpected));
    const awayEloChange = Math.round(kFactor * (awayActual - awayExpected));
    homeTeam.elo += homeEloChange;
    awayTeam.elo += awayEloChange;
  }

  async refreshElo() {
    if (confirm('Are you sure you want to refresh Elo ratings? This will process all finalized matches.')) {
      try {
        await this.processAllFinalizedMatches();
        await this.saveToFirebase();
        this.renderRankings();
        this.renderAdminContent();
        alert('Elo ratings have been refreshed.');
      } catch (error) {
        console.error('Error refreshing Elo:', error);
        alert('Error refreshing Elo ratings. Please try again.');
      }
    }
  }

  async processAllFinalizedMatches() {
    try {
      const allMatchesQuery = query(collection(db, 'homeLeagueMatches'));
      const allMatchesSnap = await getDocs(allMatchesQuery);
      const allMatches = [];
      allMatchesSnap.forEach(doc => {
        const matchData = doc.data();
        matchData.id = doc.id;
        matchData.homeTeam = this.teams.find(t => t.id === matchData.homeTeamId);
        matchData.awayTeam = this.teams.find(t => t.id === matchData.awayTeamId);
        allMatches.push(matchData);
      });

      for (let match of allMatches) {
        if (match.reportId) {
          const reportRef = doc(db, 'homeLeagueReports', match.reportId);
          const reportSnap = await getDoc(reportRef);
          if (reportSnap.exists()) {
            match.report = { id: reportSnap.id, ...reportSnap.data() };
          }
        }
      }

      this.teams.forEach(team => {
        team.elo = 1500;
        team.wins = 0;
        team.losses = 0;
        team.mapsWon = 0;
        team.mapsLost = 0;
        team.last5 = '';
      });

      const finalizedMatches = allMatches.filter(match => 
        match.status === 'FINAL' && match.report && match.report.declaredWinnerTeamId
      );

      finalizedMatches.sort((a, b) => {
        if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber;
        return a.scheduledAt - b.scheduledAt;
      });

      for (const match of finalizedMatches) {
        await this.updateTeamElo(match, match.report);
        await this.updateTeamStats(match, match.report);
      }

      return true;
    } catch (error) {
      console.error('Error processing all finalized matches:', error);
      return false;
    }
  }

  async regenerateMatches() {
    if (this.isRegenerating) {
      alert('Match regeneration is already in progress. Please wait...');
      return;
    }
    
    if (confirm('Are you sure you want to regenerate the current week\'s matches? This will overwrite existing matches.')) {
      this.isRegenerating = true;
      try {
        const allMatchesQuery = query(collection(db, 'homeLeagueMatches'));
        const allMatchesSnap = await getDocs(allMatchesQuery);
        const deletePromises = allMatchesSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        this.matches = [];
        this.generateWeeklyMatches();
        this.renderMatches();
        this.renderAdminContent();
        alert(`Match regeneration complete! Generated ${this.matches.length} matches.`);
      } catch (error) {
        console.error('Error regenerating matches:', error);
        alert('Error regenerating matches. Please try again.');
      } finally {
        this.isRegenerating = false;
      }
    }
  }

  async nuclearReset() {
    if (confirm('⚠️ NUCLEAR RESET ⚠️\n\nThis will delete ALL data. Are you absolutely sure?')) {
      const confirmation = prompt('Type "NUCLEAR" to confirm:');
      if (confirmation !== 'NUCLEAR') {
        alert('Nuclear reset cancelled.');
        return;
      }
      
      try {
        // Delete all matches
        const allMatchesQuery = query(collection(db, 'homeLeagueMatches'));
        const allMatchesSnap = await getDocs(allMatchesQuery);
        const deleteMatchPromises = allMatchesSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteMatchPromises);
        
        // Delete all reports
        const allReportsQuery = query(collection(db, 'homeLeagueReports'));
        const allReportsSnap = await getDocs(allReportsQuery);
        const deleteReportPromises = allReportsSnap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteReportPromises);
        
        // Reset teams
        this.teams.forEach(team => {
          team.elo = 1500;
          team.wins = 0;
          team.losses = 0;
          team.mapsWon = 0;
          team.mapsLost = 0;
          team.last5 = '';
        });
        
        this.currentWeek = 1;
        this.matches = [];
        this.generateWeeklyMatches();
        this.renderMatches();
        this.renderRankings();
        this.renderAdminContent();
        alert('Nuclear reset complete! All data has been cleared.');
      } catch (error) {
        console.error('Error during nuclear reset:', error);
        alert('Error during nuclear reset. Please try again.');
      }
    }
  }
}

// Initialize when DOM is ready
let homeLeagueLadder;
document.addEventListener('DOMContentLoaded', () => {
  try {
    homeLeagueLadder = new HomeLeagueLadder();
    window.homeLeagueLadder = homeLeagueLadder;
    console.log('HomeLeagueLadder initialized successfully');
  } catch (error) {
    console.error('Error initializing HomeLeagueLadder:', error);
  }
});

// Safety wrapper for onclick handlers
window.openCreateTeamModal = function() {
  if (window.homeLeagueLadder && typeof window.homeLeagueLadder.openCreateTeamModal === 'function') {
    window.homeLeagueLadder.openCreateTeamModal();
  } else {
    console.error('homeLeagueLadder not initialized yet');
    setTimeout(() => {
      if (window.homeLeagueLadder) {
        window.homeLeagueLadder.openCreateTeamModal();
      }
    }, 500);
  }
};

window.closeCreateTeamModal = function() {
  if (window.homeLeagueLadder && typeof window.homeLeagueLadder.closeCreateTeamModal === 'function') {
    window.homeLeagueLadder.closeCreateTeamModal();
  }
};

window.openEditTeamModal = function(teamId) {
  if (window.homeLeagueLadder && typeof window.homeLeagueLadder.openEditTeamModal === 'function') {
    window.homeLeagueLadder.openEditTeamModal(teamId);
  } else {
    console.error('homeLeagueLadder not initialized yet');
    setTimeout(() => {
      if (window.homeLeagueLadder) {
        window.homeLeagueLadder.openEditTeamModal(teamId);
      }
    }, 500);
  }
};

window.closeEditTeamModal = function() {
  if (window.homeLeagueLadder && typeof window.homeLeagueLadder.closeEditTeamModal === 'function') {
    window.homeLeagueLadder.closeEditTeamModal();
  }
};

