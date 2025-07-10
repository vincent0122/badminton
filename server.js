const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define Schemas
const playerSchema = new mongoose.Schema({
  name: String,
});

const teamSchema = new mongoose.Schema({
  name: String,
  players: [{type: mongoose.Schema.Types.ObjectId, ref: "Player"}],
});

const matchSchema = new mongoose.Schema({
  team1: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
  team2: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
  score1: Number,
  score2: Number,
  date: {type: Date, default: Date.now},
});

const Player = mongoose.model("Player", playerSchema);
const Team = mongoose.model("Team", teamSchema);
const Match = mongoose.model("Match", matchSchema);

// API routes will be updated to use Mongoose models

// Teams API
app.get("/api/teams", async (req, res) => {
  try {
    console.log("GET /api/teams 요청 받음");
    const teams = await Team.find().populate("players");
    console.log("팀 목록 조회됨:", teams.length, "개");
    
    const matches = await Match.find();
    console.log("매치 목록 조회됨:", matches.length, "개");

    const teamsWithStats = teams.map((team) => {
      const stats = {wins: 0, draws: 0, losses: 0, winRate: 0};
      const teamMatches = matches.filter(
        (m) => m.team1 && m.team2 && (m.team1.equals(team._id) || m.team2.equals(team._id))
      );

      for (const match of teamMatches) {
        if (!match.team1 || !match.team2) continue;
        
        const score1 = match.score1;
        const score2 = match.score2;
        if (match.team1.equals(team._id)) {
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

      return {...team.toObject(), ...stats};
    });

    teamsWithStats.sort((a, b) => b.winRate - a.winRate);
    console.log("팀 목록 반환:", teamsWithStats.length, "개");
    res.json(teamsWithStats);
  } catch (err) {
    console.error("GET /api/teams 오류:", err);
    res.status(500).json({message: err.message, stack: err.stack});
  }
});

app.post("/api/teams", async (req, res) => {
  try {
    console.log("POST /api/teams 요청 받음:", req.body);
    const {name, players} = req.body;
    const newTeam = new Team({name, players});
    console.log("새 팀 생성:", newTeam);
    
    const savedTeam = await newTeam.save();
    console.log("팀 저장 완료:", savedTeam);
    res.status(201).json(savedTeam);
  } catch (err) {
    console.error("POST /api/teams 오류:", err);
    res.status(400).json({message: err.message, stack: err.stack});
  }
});

app.put("/api/teams/:id", async (req, res) => {
  try {
    const updatedTeam = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedTeam);
  } catch (err) {
    res.status(400).json({message: err.message});
  }
});

app.delete("/api/teams/:id", async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({message: "Team deleted"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

// Matches API
app.get("/api/matches", async (req, res) => {
  try {
    const matches = await Match.find().populate("team1").populate("team2");
    res.json(matches);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

app.post("/api/matches", async (req, res) => {
  const {team1, team2, score1, score2} = req.body;
  const newMatch = new Match({team1, team2, score1, score2});
  try {
    const savedMatch = await newMatch.save();
    res.status(201).json(savedMatch);
  } catch (err) {
    res.status(400).json({message: err.message});
  }
});

app.put("/api/matches/:id", async (req, res) => {
  try {
    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true}
    );
    res.json(updatedMatch);
  } catch (err) {
    res.status(400).json({message: err.message});
  }
});

app.delete("/api/matches/:id", async (req, res) => {
  try {
    await Match.findByIdAndDelete(req.params.id);
    res.json({message: "Match deleted"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

// Players API
app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

app.post("/api/players", async (req, res) => {
  const newPlayer = new Player({name: req.body.name});
  try {
    const savedPlayer = await newPlayer.save();
    res.status(201).json(savedPlayer);
  } catch (err) {
    res.status(400).json({message: err.message});
  }
});

app.put("/api/players/:id", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true}
    );
    res.json(updatedPlayer);
  } catch (err) {
    res.status(400).json({message: err.message});
  }
});

app.delete("/api/players/:id", async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({message: "Player deleted"});
  } catch (err) {
    res.status(500).json({message: err.message});
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

module.exports = app;
