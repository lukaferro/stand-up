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

      // Recupera le note dal localStorage
      const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];

      // Combina i dati dell'API con le note locali
      const combinedMeetings = meetings.map(apiMeeting => {
        const localMeeting = savedMeetings.find(savedMeeting => savedMeeting.date === apiMeeting.date);
        return {
          ...apiMeeting,
          notes: localMeeting ? localMeeting.standUpsInfo : []
        };
      });

      // Aggiungi i meeting alla lista
      combinedMeetings.forEach(meeting => {
        addMeetingToList(meeting, meetingList);
      });
    } else {
      alert('Errore nel recupero dello storico dei meeting.');
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore di rete.');
  }
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
      <p><strong>Note:</strong></p>
      <ul>
        ${meeting.notes && meeting.notes.length > 0
          ? meeting.notes.map(note => `
            <li>
              <strong>Sviluppatore ID:</strong> ${note.devId} <br>
              <strong>Durata:</strong> ${note.durationMins} minuti <br>
              <strong>Note:</strong> ${note.notes || 'Nessuna'}
            </li>
          `).join('')
          : '<p>Nessuna nota disponibile.</p>'
        }
      </ul>
    </div>
  `;

  const expandBtn = listItem.querySelector('.expandBtn');
  const detailsDiv = listItem.querySelector('.details');

  expandBtn.addEventListener('click', () => {
    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
  });

  meetingList.appendChild(listItem);
}