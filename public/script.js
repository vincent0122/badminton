document.addEventListener('DOMContentLoaded', () => {
  loadTeams();
  loadMatches();
  initModal();
});

// 커스텀 모달 함수들
function initModal() {
  const modal = document.getElementById('custom-modal');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn = document.getElementById('modal-cancel');
  
  // 모달 외부 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

function showModal(title, message, isConfirm = false) {
  return new Promise((resolve) => {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    if (isConfirm) {
      cancelBtn.style.display = 'inline-block';
      confirmBtn.textContent = '확인';
    } else {
      cancelBtn.style.display = 'none';
      confirmBtn.textContent = '확인';
    }
    
    modal.style.display = 'block';
    
    // 이벤트 리스너 제거 (중복 방지)
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // 새 이벤트 리스너 추가
    newConfirmBtn.addEventListener('click', () => {
      closeModal();
      resolve(true);
    });
    
    if (isConfirm) {
      newCancelBtn.addEventListener('click', () => {
        closeModal();
        resolve(false);
      });
    }
  });
}

function closeModal() {
  const modal = document.getElementById('custom-modal');
  modal.style.display = 'none';
}

// 커스텀 alert 함수
function customAlert(message, title = '알림') {
  return showModal(title, message, false);
}

// 커스텀 confirm 함수
function customConfirm(message, title = '확인') {
  return showModal(title, message, true);
}

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
  const confirmed = await customConfirm('이 팀을 정말 삭제하시겠습니까?');
  if (confirmed) {
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
      if (!match.team1 || !match.team2 || !match.team1._id || !match.team2._id) {
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

      // 승리팀 점수에도 클래스 적용하고 승/패 표시 추가
      let scoreClass1 = winnerClass1 ? 'winner-score' : '';
      let scoreClass2 = winnerClass2 ? 'winner-score' : '';
      let result1 = '';
      let result2 = '';
      
      // 표시되는 점수를 기준으로 승/패 판정
      if (parseInt(displayScore1) > parseInt(displayScore2)) {
        result1 = '(승)';
        result2 = '(패)';
      } else if (parseInt(displayScore2) > parseInt(displayScore1)) {
        result1 = '(패)';
        result2 = '(승)';
      } else {
        result1 = '(무)';
        result2 = '(무)';
      }
      
      row.innerHTML = `
        <td><span class="${winnerClass1}">${displayTeam1}</span> <span class="${scoreClass1}">${displayScore1}점${result1}</span> vs <span class="${winnerClass2}">${displayTeam2}</span> <span class="${scoreClass2}">${displayScore2}점${result2}</span></td>
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
  const confirmed = await customConfirm('이 경기를 정말 삭제하시겠습니까?');
  if (confirmed) {
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

async function deleteAllTeams() {
  const confirmed = await customConfirm('정말로 모든 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
  if (confirmed) {
    try {
      const response = await fetch('/api/teams/all', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await customAlert('모든 팀이 삭제되었습니다.');
        loadTeams();
        loadMatches(); // 경기 기록도 새로고침
      } else {
        await customAlert('팀 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('전체 팀 삭제 중 오류:', error);
      await customAlert('팀 삭제 중 오류가 발생했습니다.');
    }
  }
}

async function deleteAllMatches() {
  const confirmed = await customConfirm('정말로 모든 경기 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
  if (confirmed) {
    try {
      const response = await fetch('/api/matches/all', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await customAlert('모든 경기 기록이 삭제되었습니다.');
        loadMatches();
        loadTeams(); // 팀 통계도 새로고침
      } else {
        await customAlert('경기 기록 삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('전체 경기 기록 삭제 중 오류:', error);
      await customAlert('경기 기록 삭제 중 오류가 발생했습니다.');
    }
  }
}
