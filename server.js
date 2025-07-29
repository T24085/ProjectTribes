const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const teamsFile = path.join(dataDir, 'teams.json');
const montagesFile = path.join(dataDir, 'montages.json');

app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.static(__dirname));

async function readJson(file) {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

app.get('/api/teams', async (req, res) => {
  const teams = await readJson(teamsFile);
  res.json(teams);
});

app.post('/api/teams', async (req, res) => {
  const teams = await readJson(teamsFile);
  teams.push(req.body);
  await writeJson(teamsFile, teams);
  res.status(201).json(req.body);
});

app.get('/api/montages', async (req, res) => {
  const montages = await readJson(montagesFile);
  res.json(montages);
});

app.post('/api/montages', async (req, res) => {
  const montages = await readJson(montagesFile);
  montages.push(req.body);
  await writeJson(montagesFile, montages);
  res.status(201).json(req.body);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
