document.addEventListener('DOMContentLoaded', async () => {
  const apiKey = localStorage.getItem('apiKey');
  const devTableBody = document.querySelector('#devTable tbody');
  const endStandUpBtn = document.getElementById('endStandUpBtn');
  const meetingDateElement = document.getElementById('meetingDate');
  const meetingDurationElement = document.getElementById('meetingDuration');
  const maxTimePerDevElement = document.getElementById('maxTimePerDev');

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

  const maxTimePerDevInMinutes = parseInt(duration) / participantIds.length;
  const maxTimePerDevInSeconds = maxTimePerDevInMinutes * 60;
  const maxTimePerDevMinutesDisplay = Math.floor(maxTimePerDevInMinutes);
  const maxTimePerDevSecondsDisplay = Math.round((maxTimePerDevInMinutes - maxTimePerDevMinutesDisplay) * 60);

  const startTime = new Date();
  meetingDateElement.textContent = startTime.toLocaleDateString('it-IT');
  maxTimePerDevElement.textContent = `${maxTimePerDevMinutesDisplay} min ${maxTimePerDevSecondsDisplay} sec`;

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

      }
    }

    if (remainingMs <= 0) {
      meetingDurationElement.style.animation = 'blinkFast 0.5s linear infinite';
      meetingDurationElement.style.backgroundColor = '#ffebee';
      meetingDurationElement.style.borderColor = '#ffcdd2';
    }
  }

  meetingTimer = setInterval(updateDuration, 1000);

  async function getPreviousMeeting() {
    const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];

    const sortedMeetings = savedMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));

    return sortedMeetings.length > 0 ? sortedMeetings[0] : null;
  }

  const previousMeeting = await getPreviousMeeting();

  try {
    let allDevs = [];
    const cachedDevs = localStorage.getItem('developers');

    if (cachedDevs) {
      allDevs = JSON.parse(cachedDevs);
      console.log('Utilizzati dati degli sviluppatori dal cache');
    } else {
      const response = await fetch('https://standupparo-apis.vercel.app/api/devs', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey
        }
      });

      if (response.ok) {
        allDevs = await response.json();
        localStorage.setItem('developers', JSON.stringify(allDevs));
      } else {
        throw new Error('Errore nel recupero degli sviluppatori');
      }
    }

    const selectedDevs = allDevs.filter(dev => participantIds.includes(dev.id.toString()));

    selectedDevs.sort((a, b) => a.name.localeCompare(b.name));

    if (selectedDevs.length === 0) {
      alert('Nessun partecipante selezionato trovato.');
      window.location.href = 'dashboard.html';
      return;
    }

    function getPreviousNotes(devId) {
      if (!previousMeeting || !previousMeeting.standUpsInfo) return '';

      const devInfo = previousMeeting.standUpsInfo.find(info => info.devId === devId);
      return devInfo ? devInfo.notes : '';
    }

    selectedDevs.forEach(dev => {
      const row = document.createElement('tr');

      const devNameCell = document.createElement('td');
      devNameCell.textContent = dev.name;
      row.appendChild(devNameCell);

      const actionsCell = document.createElement('td');
      const playPauseBtn = document.createElement('button');
      playPauseBtn.textContent = 'Play';
      playPauseBtn.className = 'play-button';
      playPauseBtn.dataset.devId = dev.id;
      playPauseBtn.dataset.startTime = '';
      playPauseBtn.dataset.duration = '0';
      playPauseBtn.dataset.durationSecs = '0';

      const timerSpan = document.createElement('span');
      timerSpan.textContent = '00:00';
      timerSpan.className = 'timer-span';

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

      const previousNotesCell = document.createElement('td');
      const previousNotes = getPreviousNotes(dev.id);
      previousNotesCell.textContent = previousNotes || 'Nessuna nota precedente';
      previousNotesCell.className = 'previous-notes-cell';
      row.appendChild(previousNotesCell);

      devTableBody.appendChild(row);
    });
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

    const now = new Date();
    const elapsedMs = now - startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    const totalHours = Math.floor(elapsedSeconds / 3600);
    const remainingMinutes = Math.floor((elapsedSeconds % 3600) / 60);
    const remainingSeconds = elapsedSeconds % 60;

    console.log(`Durata effettiva del meeting: ${totalHours}h ${remainingMinutes}m ${remainingSeconds}s`);

    const meetingData = {
      date: new Date().toISOString(),
      durationHours: totalHours,
      durationMins: remainingMinutes,
      durationSecs: remainingSeconds,
      plannedDurationMins: parseInt(duration),
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
    const maxTimePerDevInMinutes = parseInt(duration) / participantIds.length;
    const maxTimePerDevInSeconds = maxTimePerDevInMinutes * 60;

    const calculateElapsedTime = (startTimeMs) => {
      const elapsedMs = Date.now() - startTimeMs;
      const minutes = Math.floor(elapsedMs / 1000 / 60);
      const seconds = Math.floor((elapsedMs / 1000) % 60);
      return { minutes, seconds, totalSeconds: minutes * 60 + seconds };
    };


    document.querySelectorAll('#devTable tbody tr button').forEach(otherButton => {
      if (otherButton !== button && otherButton.textContent === 'Pausa') {
        otherButton.textContent = 'Play';
        otherButton.classList.remove('pause-button');
        otherButton.classList.add('play-button');
        clearInterval(otherButton.timerInterval);

        const startTimeMs = parseInt(otherButton.dataset.startTime, 10);
        const { minutes, seconds } = calculateElapsedTime(startTimeMs);

        otherButton.dataset.duration = minutes.toString();
        otherButton.dataset.durationSecs = seconds.toString();

        const otherTimerSpan = otherButton.nextElementSibling;
        if (otherTimerSpan && otherTimerSpan.classList.contains('timer-span')) {
          otherTimerSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
      }
    });

    if (button.textContent === 'Play') {
      button.textContent = 'Pausa';
      button.classList.remove('play-button');
      button.classList.add('pause-button');

      const accumulatedMinutes = parseInt(button.dataset.duration || '0', 10);
      const accumulatedSeconds = parseInt(button.dataset.durationSecs || '0', 10);
      const totalAccumulatedSeconds = accumulatedMinutes * 60 + accumulatedSeconds;

      button.dataset.startTime = (Date.now() - totalAccumulatedSeconds * 1000).toString();

      button.timerInterval = setInterval(() => {
        const startTimeMs = parseInt(button.dataset.startTime, 10);
        const { minutes, seconds, totalSeconds } = calculateElapsedTime(startTimeMs);

        timerSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const remainingSeconds = maxTimePerDevInSeconds - totalSeconds;

        if (remainingSeconds <= 30 && remainingSeconds > 10) {
          timerSpan.classList.add('warning');
          timerSpan.classList.remove('danger', 'time-exceeded');
        } else if (remainingSeconds <= 10 && remainingSeconds > 0) {
          timerSpan.classList.add('danger');
          timerSpan.classList.remove('warning', 'time-exceeded');
        } else if (remainingSeconds <= 0) {
          timerSpan.classList.add('time-exceeded');
          timerSpan.classList.remove('warning', 'danger');

        } else {
          timerSpan.classList.remove('warning', 'danger', 'time-exceeded');
        }
      }, 1000);
    } else {
      button.textContent = 'Play';
      button.classList.remove('pause-button');
      button.classList.add('play-button');
      clearInterval(button.timerInterval);

      const startTimeMs = parseInt(button.dataset.startTime, 10);
      const { minutes, seconds } = calculateElapsedTime(startTimeMs);

      button.dataset.duration = minutes.toString();
      button.dataset.durationSecs = seconds.toString();

      timerSpan.classList.remove('warning', 'danger');

      timerSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }
}
);