
document.addEventListener('DOMContentLoaded', () => {
  loadTeamsForSelect();
});

async function loadTeamsForSelect() {
  const response = await fetch('/api/teams');
  const teams = await response.json();

  const team1Select = document.getElementById('team1');
  const team2Select = document.getElementById('team2');
  team1Select.innerHTML = '';
  team2Select.innerHTML = '';

  // Add a default option
  const defaultOption1 = document.createElement('option');
  defaultOption1.value = '';
  defaultOption1.textContent = '팀 선택';
  defaultOption1.disabled = true;
  defaultOption1.selected = true;
  team1Select.appendChild(defaultOption1);

  const defaultOption2 = document.createElement('option');
  defaultOption2.value = '';
  defaultOption2.textContent = '팀 선택';
  defaultOption2.disabled = true;
  defaultOption2.selected = true;
  team2Select.appendChild(defaultOption2);

  for (const team of teams) {
    const option1 = document.createElement('option');
    option1.value = team._id;
    option1.textContent = team.name;
    team1Select.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = team._id;
    option2.textContent = team.name;
    team2Select.appendChild(option2);
  }
}

async function addTeam() {
  const teamName = document.getElementById('team-name').value;
  if (!teamName) {
    alert('팀 이름을 입력해주세요.');
    return;
  }
  await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: teamName }),
  });
  document.getElementById('team-name').value = '';
  alert('팀이 추가되었습니다!');
  loadTeamsForSelect(); // 팀 목록 업데이트
}

async function addMatch() {
  const team1_id = document.getElementById('team1').value;
  const team2_id = document.getElementById('team2').value;
  const score1 = document.getElementById('score1').value;
  const score2 = document.getElementById('score2').value;

  if (!team1_id || !team2_id || !score1 || !score2) {
    alert('모든 필드를 입력해주세요.');
    return;
  }

  if (team1_id === team2_id) {
    alert("같은 팀끼리는 경기를 할 수 없습니다.");
    return;
  }

  await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team1: team1_id, team2: team2_id, score1, score2 }),
  });

  document.getElementById('score1').value = '';
  document.getElementById('score2').value = '';
  document.getElementById('team1').value = ''; // Reset select
  document.getElementById('team2').value = ''; // Reset select
  alert('경기가 추가되었습니다!');

  // 팡파레 사운드 재생 (public 폴더에 fanfare.mp3 파일을 넣어주세요)
  const fanfare = new Audio('/fanfare.mp3');
  fanfare.play();
}

async function getTeamName(teamId) {
  const response = await fetch(`/api/teams`);
  const teams = await response.json();
  const team = teams.find(t => t._id == teamId);
  return team ? team.name : '알 수 없는 팀';
}
