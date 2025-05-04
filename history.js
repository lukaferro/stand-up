document.addEventListener('DOMContentLoaded', async () => {
  const apiKey = localStorage.getItem('apiKey');
  const meetingList = document.getElementById('meetingList');

  if (!apiKey) {
    alert('API Key non trovata. Effettua nuovamente il login.');
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch('https://standupparo-apis.vercel.app/api/stand-ups', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.ok) {
      const meetings = await response.json();

      meetings.forEach(meeting => {
        addMeetingToList(meeting, meetingList);
      });

      const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];
      const filteredSavedMeetings = savedMeetings.filter(savedMeeting =>
        !meetings.some(apiMeeting => apiMeeting.date === savedMeeting.date)
      );

      filteredSavedMeetings.forEach(meeting => {
        addMeetingToList(meeting, meetingList);
      });
    } else {
      alert('Errore nel recupero dello storico dei meeting.');
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore di rete.');
  }

  const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];
  savedMeetings.forEach(meeting => {
    const durationHours = Math.floor(meeting.durationMins / 60);
    const durationMinutes = meeting.durationMins % 60;

    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <div>
        <strong>Data:</strong> ${new Date(meeting.date).toLocaleDateString('it-IT')} 
        <strong>Durata:</strong> ${String(durationHours).padStart(2, '0')}:${String(durationMinutes).padStart(2, '0')}
        <button class="expandBtn">Espandi</button>
      </div>
      <div class="details" style="display: none;">
        <p><strong>Dettagli:</strong></p>
        <ul id="details-${meeting.date}"></ul>
      </div>
    `;

    const expandBtn = listItem.querySelector('.expandBtn');
    const detailsDiv = listItem.querySelector('.details');

    expandBtn.addEventListener('click', async () => {
      if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        await loadMeetingDetails(meeting.date, `details-${meeting.date}`);
      } else {
        detailsDiv.style.display = 'none';
      }
    });

    meetingList.appendChild(listItem);
  });
});

async function loadMeetingDetails(meetingId, detailsContainerId) {
  console.log('Loading details for meeting ID:', meetingId);
  const detailsContainer = document.getElementById(detailsContainerId);

  const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];
  const meetingDetails = savedMeetings.find(meeting => meeting.date === meetingId);

  if (meetingDetails) {
    detailsContainer.innerHTML = '';

    if (meetingDetails.standUpsInfo && meetingDetails.standUpsInfo.length > 0) {
      meetingDetails.standUpsInfo.forEach(info => {
        const detailItem = document.createElement('li');
        detailItem.innerHTML = `
          <strong>Sviluppatore ID:</strong> ${info.devId} <br>
          <strong>Durata:</strong> ${info.durationMins} minuti <br>
          <strong>Note:</strong> ${info.notes || 'Nessuna'}
        `;
        detailsContainer.appendChild(detailItem);
      });
    } else {
      detailsContainer.innerHTML = '<p>Nessun dettaglio disponibile per questo meeting.</p>';
    }
  } else {
    detailsContainer.innerHTML = '<p>Dettagli non trovati per questo meeting.</p>';
  }
}

function addMeetingToList(meeting, meetingList) {
  const durationHours = Math.floor(meeting.durationMins / 60);
  const durationMinutes = meeting.durationMins % 60;
  const durationSeconds = meeting.durationSecs || 0;

  const listItem = document.createElement('li');
  listItem.innerHTML = `
    <div>
      <strong>Data:</strong> ${new Date(meeting.date).toLocaleDateString('it-IT')} 
      <strong>Durata:</strong> ${String(durationHours).padStart(2, '0')}:${String(durationMinutes).padStart(2, '0')}:${String(durationSeconds).padStart(2, '0')}
      <button class="expandBtn">Espandi</button>
    </div>
    <div class="details" style="display: none;">
      <p><strong>Dettagli:</strong></p>
      <ul id="details-${meeting.date}"></ul>
    </div>
  `;

  const expandBtn = listItem.querySelector('.expandBtn');
  const detailsDiv = listItem.querySelector('.details');

  expandBtn.addEventListener('click', async () => {
    if (detailsDiv.style.display === 'none') {
      detailsDiv.style.display = 'block';
      await loadMeetingDetails(meeting.date, `details-${meeting.date}`);
    } else {
      detailsDiv.style.display = 'none';
    }
  });

  meetingList.appendChild(listItem);
}