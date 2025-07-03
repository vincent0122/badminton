
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Teams API
app.get('/api/teams', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  const teamsWithStats = data.teams.map(team => {
    const stats = { wins: 0, draws: 0, losses: 0, winRate: 0 };
    const teamMatches = data.matches.filter(m => m.team1_id == team.id || m.team2_id == team.id);
    for (const match of teamMatches) {
      const score1 = parseInt(match.score1);
      const score2 = parseInt(match.score2);
      if (match.team1_id == team.id) {
        if (score1 > score2) stats.wins++;
        else if (score1 < score2) stats.losses++;
        else stats.draws++;
      } else {
        if (score2 > score1) stats.wins++;
        else if (score2 < score1) stats.losses++;
        else stats.draws++;
      }
    }
    const totalGames = stats.wins + stats.losses + stats.draws;
    if (totalGames > 0) {
      stats.winRate = (stats.wins / totalGames) * 100;
    }
    return { ...team, ...stats };
  });
  teamsWithStats.sort((a, b) => b.winRate - a.winRate);
  res.json(teamsWithStats);
});

app.post('/api/teams', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  const newTeam = req.body;
  newTeam.id = Date.now();
  data.teams.push(newTeam);
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
  res.json(newTeam);
});

app.put('/api/teams/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  const teamId = parseInt(req.params.id);
  const updatedTeam = req.body;
  data.teams = data.teams.map(team => (team.id === teamId ? { ...team, ...updatedTeam } : team));
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
  res.json(updatedTeam);
});

app.delete('/api/teams/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  const teamId = parseInt(req.params.id);
  data.teams = data.teams.filter(team => team.id !== teamId);
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
  res.json({ message: 'Team deleted' });
});

// Matches API
app.get('/api/matches', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  res.json(data.matches);
});

app.post('/api/matches', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  const newMatch = req.body;
  newMatch.id = Date.now();
  data.matches.push(newMatch);
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
  res.json(newMatch);
});

app.put('/api/matches/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  const matchId = parseInt(req.params.id);
  const updatedMatch = req.body;
  data.matches = data.matches.map(match => (match.id === matchId ? { ...match, ...updatedMatch } : match));
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
  res.json(updatedMatch);
});

app.delete('/api/matches/:id', (req, res) => {
  const data = JSON.parse(fs.readFileSync('db.json'));
  const matchId = parseInt(req.params.id);
  data.matches = data.matches.filter(match => match.id !== matchId);
  fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
  res.json({ message: 'Match deleted' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
