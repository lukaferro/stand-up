document.addEventListener('DOMContentLoaded', async () => {
  const apiKey = localStorage.getItem('apiKey');
  const devTableBody = document.querySelector('#devTable tbody');
  const endStandUpBtn = document.getElementById('endStandUpBtn');
  const meetingDateElement = document.getElementById('meetingDate');
  const meetingDurationElement = document.getElementById('meetingDuration');

  if (!apiKey) {
    alert('API Key non trovata. Effettua nuovamente il login.');
    window.location.href = 'index.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const duration = urlParams.get('duration');
  const participantIds = urlParams.get('participants') ? urlParams.get('participants').split(',') : [];

  if (!duration || participantIds.length === 0) {
    alert('Parametri mancanti. Torna alla dashboard.');
    window.location.href = 'dashboard.html';
    return;
  }

  const startTime = new Date();
  meetingDateElement.textContent = startTime.toLocaleDateString('it-IT');

  const durationMs = parseInt(duration) * 60 * 1000;
  const endTime = new Date(startTime.getTime() + durationMs);
  let meetingTimer;

  function updateDuration() {
    const now = new Date();
    const elapsedMs = now - startTime;
    const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);
    const elapsedSeconds = Math.floor((elapsedMs / 1000) % 60);
    const remainingMs = Math.max(0, endTime - now);
    const remainingMinutes = Math.floor(remainingMs / 1000 / 60);
    const remainingSeconds = Math.floor((remainingMs / 1000) % 60);

    const remainingText = `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    meetingDurationElement.textContent = `${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')} (Rimanente: ${remainingText})`;

    if (remainingMs <= 60000) {
      meetingDurationElement.style.color = 'red';
      meetingDurationElement.style.fontWeight = 'bold';

      if (remainingMs <= 30000) {
        meetingDurationElement.style.animation = 'blink 1s linear infinite';

        if (remainingMs <= 30000 && remainingMs > 29000) {
          alert('Attenzione: il meeting terminerà automaticamente tra 30 secondi!');
        }
      }
    }

    if (remainingMs <= 0) {
      clearInterval(meetingTimer);
      alert('Tempo scaduto! Il meeting verrà terminato automaticamente.');
      endStandUpBtn.click();
    }
  }

  meetingTimer = setInterval(updateDuration, 1000);

  try {
    const response = await fetch('https://standupparo-apis.vercel.app/api/devs', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.ok) {
      const allDevs = await response.json();

      const selectedDevs = allDevs.filter(dev => participantIds.includes(dev.id.toString()));

      selectedDevs.sort((a, b) => a.name.localeCompare(b.name));

      if (selectedDevs.length === 0) {
        alert('Nessun partecipante selezionato trovato.');
        window.location.href = 'dashboard.html';
        return;
      }

      selectedDevs.forEach(dev => {
        const row = document.createElement('tr');

        const devNameCell = document.createElement('td');
        devNameCell.textContent = dev.name;
        row.appendChild(devNameCell);

        const actionsCell = document.createElement('td');
        const playPauseBtn = document.createElement('button');
        playPauseBtn.textContent = 'Play';
        playPauseBtn.dataset.devId = dev.id;
        playPauseBtn.dataset.startTime = '';
        playPauseBtn.dataset.duration = '0';
        playPauseBtn.dataset.durationSecs = '0';

        const timerSpan = document.createElement('span');
        timerSpan.textContent = '00:00';
        timerSpan.style.marginLeft = '10px';

        playPauseBtn.addEventListener('click', () => togglePlayPause(playPauseBtn, timerSpan));
        actionsCell.appendChild(playPauseBtn);
        actionsCell.appendChild(timerSpan);
        row.appendChild(actionsCell);

        const notesCell = document.createElement('td');
        const notesInput = document.createElement('input');
        notesInput.type = 'text';
        notesInput.placeholder = 'Aggiungi note';
        notesInput.dataset.devId = dev.id;
        notesCell.appendChild(notesInput);
        row.appendChild(notesCell);

        devTableBody.appendChild(row);
      });
    } else {
      alert('Errore nel recupero degli sviluppatori.');
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore di rete.');
    window.location.href = 'dashboard.html';
  }

  endStandUpBtn.addEventListener('click', async () => {
    clearInterval(meetingTimer);
    const standUpsInfo = [];
    document.querySelectorAll('#devTable tbody tr').forEach(row => {
      const devId = row.querySelector('button').dataset.devId;
      const notes = row.querySelector('input').value;
      const durationMins = parseInt(row.querySelector('button').dataset.duration || '0', 10);
      const durationSecs = parseInt(row.querySelector('button').dataset.durationSecs || '0', 10);

      standUpsInfo.push({
        devId: parseInt(devId, 10),
        durationMins,
        durationSecs,
        notes
      });
    });

    const totalSeconds = standUpsInfo.reduce((sum, info) => sum + info.durationSecs, 0);
    const additionalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    const totalMinutes = standUpsInfo.reduce((sum, info) => sum + info.durationMins, 0) + additionalMinutes;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const meetingData = {
      date: new Date().toISOString(),
      durationHours: totalHours,
      durationMins: remainingMinutes,
      durationSecs: remainingSeconds,
      standUpsInfo
    };

    const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];
    savedMeetings.push(meetingData);
    localStorage.setItem('meetings', JSON.stringify(savedMeetings));

    try {
      const response = await fetch('https://standupparo-apis.vercel.app/api/stand-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(meetingData)
      });

      if (response.ok) {
        alert('Stand Up Meeting salvato con successo.');
        window.location.href = 'history.html';
      } else {
        alert('Errore durante la terminazione dello Stand Up Meeting.');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore di rete.');
    }
  });

  function togglePlayPause(button, timerSpan) {
    document.querySelectorAll('#devTable tbody tr button').forEach(otherButton => {
      if (otherButton !== button && otherButton.textContent === 'Pausa') {
        otherButton.textContent = 'Play';
        clearInterval(otherButton.timerInterval);

        const startTime = parseInt(otherButton.dataset.startTime, 10);
        const elapsedMs = Date.now() - startTime;
        const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);
        const elapsedSeconds = Math.floor((elapsedMs / 1000) % 60);

        const totalSeconds = parseInt(otherButton.dataset.durationSecs || '0', 10) + elapsedSeconds;
        const additionalMinutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;

        otherButton.dataset.duration = (parseInt(otherButton.dataset.duration || '0', 10) + elapsedMinutes + additionalMinutes).toString();
        otherButton.dataset.durationSecs = remainingSeconds.toString();
      }
    });

    if (button.textContent === 'Play') {
      button.textContent = 'Pausa';

      const accumulatedMinutes = parseInt(button.dataset.duration || '0', 10);
      const accumulatedSeconds = parseInt(button.dataset.durationSecs || '0', 10);

      button.dataset.startTime = Date.now() - (accumulatedMinutes * 60 + accumulatedSeconds) * 1000;

      button.timerInterval = setInterval(() => {
        const startTime = parseInt(button.dataset.startTime, 10);
        const elapsedMs = Date.now() - startTime;
        const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);
        const elapsedSeconds = Math.floor((elapsedMs / 1000) % 60);
        timerSpan.textContent = `${String(elapsedMinutes).padStart(2, '0')}:${String(elapsedSeconds).padStart(2, '0')}`;
      }, 1000);
    } else {
      button.textContent = 'Play';
      clearInterval(button.timerInterval);

      const startTime = parseInt(button.dataset.startTime, 10);
      const elapsedMs = Date.now() - startTime;
      const elapsedMinutes = Math.floor(elapsedMs / 1000 / 60);
      const elapsedSeconds = Math.floor((elapsedMs / 1000) % 60);

      const totalSeconds = parseInt(button.dataset.durationSecs || '0', 10) + elapsedSeconds;
      const additionalMinutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;

      button.dataset.duration = (parseInt(button.dataset.duration || '0', 10) + elapsedMinutes + additionalMinutes).toString();
      button.dataset.durationSecs = remainingSeconds.toString();
    }
  }
});