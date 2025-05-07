async function updateCachedData(apiKey) {
  try {
    const devsResponse = await fetch('https://standupparo-apis.vercel.app/api/devs', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (devsResponse.ok) {
      const devs = await devsResponse.json();
      localStorage.setItem('developers', JSON.stringify(devs));
      console.log('Dati degli sviluppatori aggiornati in background');
    }

    const meetingsResponse = await fetch('https://standupparo-apis.vercel.app/api/stand-ups', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (meetingsResponse.ok) {
      const meetings = await meetingsResponse.json();
      localStorage.setItem('api_meetings', JSON.stringify(meetings));
      console.log('Dati dei meeting aggiornati in background');
    }
  } catch (error) {
    console.error('Errore nell\'aggiornamento dei dati in background:', error);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const companyName = localStorage.getItem('companyName');
  const apiKey = localStorage.getItem('apiKey');

  if (!companyName || !apiKey) {
    window.location.href = 'index.html';
    return;
  }

  updateCachedData(apiKey);

  document.getElementById('welcomeMsg').innerText = `Azienda: ${companyName}`;

  const startBtn = document.getElementById('startBtn');
  const historyBtn = document.getElementById('historyBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const modal = document.getElementById('modal');
  const meetingForm = document.getElementById('meetingForm');
  const participantsContainer = document.getElementById('participants-container');
  const durationInput = document.getElementById('duration');
  const selectedParticipantsInput = document.getElementById('selected-participants');
  const timeOptions = document.querySelectorAll('.time-option');

  historyBtn.addEventListener('click', () => {
    window.location.href = 'history.html';
  });
  
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('apiKey');
    localStorage.removeItem('companyName');
    window.location.href = 'index.html';
  });

  startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
  });

  let closeModalBtn = document.getElementById('closeModalBtn');
  if (!closeModalBtn) {
    closeModalBtn = document.createElement('button');
    closeModalBtn.id = 'closeModalBtn';
    closeModalBtn.type = 'button';
    closeModalBtn.textContent = '×';
    closeModalBtn.className = 'close-modal-btn';
    closeModalBtn.title = 'Chiudi';
    const modalContent = document.querySelector('.modal-content');
    modalContent.insertBefore(closeModalBtn, modalContent.firstChild);
  }

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  timeOptions.forEach(option => {
    if (option.dataset.minutes === '15') {
      option.classList.add('selected');
    }

    option.addEventListener('click', () => {
      timeOptions.forEach(opt => opt.classList.remove('selected'));

      option.classList.add('selected');

      durationInput.value = option.dataset.minutes;
    });
  });

  async function populateParticipants() {
    participantsContainer.innerHTML = '<div class="loading">Caricamento partecipanti...</div>';

    try {
      let devs = [];
      const cachedDevs = localStorage.getItem('developers');

      if (cachedDevs) {
        devs = JSON.parse(cachedDevs);
        console.log('Utilizzati dati degli sviluppatori dal cache');
      } else {
        const response = await fetch('https://standupparo-apis.vercel.app/api/devs', {
          method: 'GET',
          headers: {
            'x-api-key': apiKey
          }
        });

        if (response.ok) {
          devs = await response.json();
          localStorage.setItem('developers', JSON.stringify(devs));
        } else {
          throw new Error('Errore nel recupero degli sviluppatori');
        }
      }

      devs.sort((a, b) => a.name.localeCompare(b.name));

      participantsContainer.innerHTML = '';

      devs.forEach((dev) => {
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        participantItem.dataset.id = dev.id;
        participantItem.textContent = dev.name;

        participantItem.addEventListener('click', () => {
          participantItem.classList.toggle('selected');
          updateSelectedParticipants();
        });

        participantsContainer.appendChild(participantItem);
      });
    } catch (error) {
      participantsContainer.innerHTML = '<div class="error">Errore di rete</div>';
      console.error('Errore di rete:', error);
    }
  }

  function updateSelectedParticipants() {
    const selectedItems = participantsContainer.querySelectorAll('.participant-item.selected');
    const selectedIds = Array.from(selectedItems).map(item => item.dataset.id);
    selectedParticipantsInput.value = selectedIds.join(',');
  }

  await populateParticipants();

  meetingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const duration = durationInput.value;
    const selectedItems = participantsContainer.querySelectorAll('.participant-item.selected');
    const participants = Array.from(selectedItems).map(item => item.dataset.id);

    if (participants.length === 0) {
      alert('Seleziona almeno un partecipante');
      return;
    }

    modal.style.display = 'none';
    window.location.href = `meeting.html?duration=${duration}&participants=${participants.join(',')}`;
  });

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
  }
  setInterval(updateClock, 1000);
  updateClock();
});
