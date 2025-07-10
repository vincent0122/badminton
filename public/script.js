document.addEventListener('DOMContentLoaded', () => {
  loadTeams();
  loadMatches();
});

async function loadTeams() {
  const response = await fetch('/api/teams');
  const teams = await response.json();
  const teamsBody = document.getElementById('teams');
  teamsBody.innerHTML = '';
  for (const team of teams) {
    const row = teamsBody.insertRow();
    row.innerHTML = `
      <td>${team.name}</td>
      <td>${team.wins}</td>
      <td>${team.draws}</td>
      <td>${team.losses}</td>
      <td>${Math.round(team.winRate)}%</td>
      <td>
        <button onclick="editTeam('${team._id}', '${team.name}')">✏️</button>
        <button class="delete-button" onclick="deleteTeam('${team._id}')">🗑️</button>
      </td>
    `;
  }
}

async function editTeam(id, currentName) {
  const newName = prompt('새로운 팀 이름을 입력하세요:', currentName);
  if (newName && newName !== currentName) {
    await fetch(`/api/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    loadTeams();
    loadMatches();
  }
}

async function deleteTeam(id) {
  if (confirm('이 팀을 정말 삭제하시겠습니까?')) {
    await fetch(`/api/teams/${id}`, {
      method: 'DELETE',
    });
    loadTeams();
    loadMatches();
  }
}

async function loadMatches() {
  try {
    const response = await fetch('/api/matches');
    
    if (!response.ok) {
      console.error('매치 목록 로드 실패:', response.status, response.statusText);
      return;
    }
    
    const matches = await response.json();
    const matchesBody = document.getElementById('matches');
    matchesBody.innerHTML = '';
    
    for (const match of matches) {
      // 팀 정보가 없는 매치는 건너뛰기
      if (!match.team1 || !match.team2) {
        console.warn('팀 정보가 없는 매치 건너뛰기:', match);
        continue;
      }
      
      const row = matchesBody.insertRow();
      let team1Name = await getTeamName(match.team1._id);
      let team2Name = await getTeamName(match.team2._id);
      let displayTeam1 = team1Name;
      let displayScore1 = match.score1;
      let displayTeam2 = team2Name;
      let displayScore2 = match.score2;

      let winnerClass1 = '';
      let winnerClass2 = '';

      if (parseInt(match.score1) > parseInt(match.score2)) {
        winnerClass1 = 'winner-highlight';
      } else if (parseInt(match.score2) > parseInt(match.score1)) {
        winnerClass2 = 'winner-highlight';
        // Swap to put winner on the left
        displayTeam1 = team2Name;
        displayScore1 = match.score2;
        displayTeam2 = team1Name;
        displayScore2 = match.score1;
        [winnerClass1, winnerClass2] = [winnerClass2, winnerClass1]; // Swap classes too
      }

      row.innerHTML = `
        <td><span class="${winnerClass1}">${displayTeam1}</span> ${displayScore1}점 vs <span class="${winnerClass2}">${displayTeam2}</span> ${displayScore2}점</td>
        <td>
          <button onclick="editMatch('${match._id}', '${match.team1._id}', '${match.team2._id}', ${match.score1}, ${match.score2})">✏️</button>
          <button class="delete-button" onclick="deleteMatch('${match._id}')">🗑️</button>
        </td>
      `;
    }
  } catch (error) {
    console.error('매치 목록 로드 중 오류 발생:', error);
  }
}

async function editMatch(id, team1_id, team2_id, currentScore1, currentScore2) {
    const newScore1 = prompt('팀 1의 새로운 점수를 입력하세요:', currentScore1);
    const newScore2 = prompt('팀 2의 새로운 점수를 입력하세요:', currentScore2);

    if (newScore1 !== null && newScore2 !== null) {
        await fetch(`/api/matches/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team1: team1_id, team2: team2_id, score1: newScore1, score2: newScore2 })
        });
        loadMatches();
        loadTeams();
    }
}

async function deleteMatch(id) {
  if (confirm('이 경기를 정말 삭제하시겠습니까?')) {
    await fetch(`/api/matches/${id}`, {
      method: 'DELETE',
    });
    loadMatches();
    loadTeams();
  }
}

async function getTeamName(teamId) {
  const response = await fetch(`/api/teams`);
  const teams = await response.json();
  const team = teams.find(t => t._id == teamId);
  return team ? team.name : '알 수 없는 팀';
}
