
document.addEventListener('DOMContentLoaded', () => {
  loadTeamsForSelect();
  initModal();
});

// 커스텀 모달 함수들
function initModal() {
  const modal = document.getElementById('custom-modal');
  
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

async function loadTeamsForSelect() {
  try {
    const response = await fetch('/api/teams');
    
    if (!response.ok) {
      console.error('팀 목록 로드 실패:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('오류 내용:', errorText);
      return;
    }
    
    const teams = await response.json();
    
    if (!Array.isArray(teams)) {
      console.error('팀 데이터가 배열이 아닙니다:', teams);
      return;
    }

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
  } catch (error) {
    console.error('팀 목록 로드 중 오류 발생:', error);
  }
}

async function addTeam() {
  const teamName = document.getElementById('team-name').value;
  if (!teamName) {
    await customAlert('팀 이름을 입력해주세요.');
    return;
  }
  
  try {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName }),
    });
    
    if (!response.ok) {
      console.error('팀 추가 실패:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('오류 내용:', errorText);
      await customAlert('팀 추가 중 오류가 발생했습니다.');
      return;
    }
    
    const result = await response.json();
    console.log('팀 추가 성공:', result);
    
    document.getElementById('team-name').value = '';
    await customAlert('팀이 추가되었습니다!');
    loadTeamsForSelect(); // 팀 목록 업데이트
  } catch (error) {
    console.error('팀 추가 중 오류 발생:', error);
    await customAlert('팀 추가 중 오류가 발생했습니다.');
  }
}

async function addMatch() {
  const team1_id = document.getElementById('team1').value;
  const team2_id = document.getElementById('team2').value;
  const score1 = document.getElementById('score1').value;
  const score2 = document.getElementById('score2').value;

  if (!team1_id || !team2_id || !score1 || !score2) {
    await customAlert('모든 필드를 입력해주세요.');
    return;
  }

  if (team1_id === team2_id) {
    await customAlert("같은 팀끼리는 경기를 할 수 없습니다.");
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
  await customAlert('경기가 추가되었습니다!');

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
