document.addEventListener('DOMContentLoaded', async () => {
  const companyName = localStorage.getItem('companyName');
  const apiKey = localStorage.getItem('apiKey');

  if (!companyName || !apiKey) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('welcomeMsg').innerText = `Azienda: ${companyName}`;

  const startBtn = document.getElementById('startBtn');
  const historyBtn = document.getElementById('historyBtn');
  const modal = document.getElementById('modal');
  const meetingForm = document.getElementById('meetingForm');
  const participantsSelect = document.getElementById('participants');

  historyBtn.addEventListener('click', () => {
    window.location.href = 'history.html';
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
    closeModalBtn.textContent = 'Chiudi';
    closeModalBtn.className = 'close-modal-btn';
    const modalContent = document.querySelector('.modal-content');
    modalContent.insertBefore(closeModalBtn, modalContent.firstChild);
  }

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  async function populateParticipantsSelect() {
    participantsSelect.innerHTML = '<option disabled>Caricamento partecipanti...</option>';

    try {
      const response = await fetch('https://standupparo-apis.vercel.app/api/devs', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey
        }
      });

      if (response.ok) {
        const devs = await response.json();

        devs.sort((a, b) => a.name.localeCompare(b.name));

        participantsSelect.innerHTML = '';
        devs.forEach((dev) => {
          const option = document.createElement('option');
          option.value = dev.id;
          option.text = dev.name;
          participantsSelect.appendChild(option);
        });
      } else {
        participantsSelect.innerHTML = '<option disabled>Errore nel caricamento dei partecipanti</option>';
        console.error('Errore nel recupero dei partecipanti:', response.status);
      }
    } catch (error) {
      participantsSelect.innerHTML = '<option disabled>Errore di rete</option>';
      console.error('Errore di rete:', error);
    }
  }

  await populateParticipantsSelect();

  meetingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const duration = document.getElementById('duration').value;
    const participants = Array.from(participantsSelect.selectedOptions).map((option) => option.value);

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
