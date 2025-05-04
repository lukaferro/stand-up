document.addEventListener('DOMContentLoaded', async () => {
  const apiKey = localStorage.getItem('apiKey');
  const meetingList = document.getElementById('meetingList');

  if (!apiKey) {
    alert('API Key non trovata. Effettua nuovamente il login.');
    window.location.href = 'index.html';
    return;
  }

  try {
    // Recupera tutti i meeting
    const response = await fetch('https://standupparo-apis.vercel.app/api/stand-ups', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.ok) {
      const meetings = await response.json();

      // Ordina i meeting dal più recente al più vecchio
      meetings.forEach(meeting => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <div>
            <strong>Data:</strong> ${new Date(meeting.date).toLocaleDateString('it-IT')} 
            <strong>Durata:</strong> ${meeting.durationMins} minuti
            <button class="expandBtn">Espandi</button>
          </div>
          <div class="details" style="display: none;">
            <p><strong>Dettagli:</strong></p>
            <ul id="details-${meeting.id}"></ul>
          </div>
        `;

        const expandBtn = listItem.querySelector('.expandBtn');
        const detailsDiv = listItem.querySelector('.details');

        expandBtn.addEventListener('click', async () => {
          if (detailsDiv.style.display === 'none') {
            detailsDiv.style.display = 'block';
            await loadMeetingDetails(meeting.id, `details-${meeting.id}`);
          } else {
            detailsDiv.style.display = 'none';
          }
        });

        meetingList.appendChild(listItem);
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
  const apiKey = localStorage.getItem('apiKey');
  const detailsContainer = document.getElementById(detailsContainerId);

  try {
    const response = await fetch(`https://standupparo-apis.vercel.app/api/stand-up?id=${meetingId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.ok) {
      const meetingDetails = await response.json();
      console.log('Meeting details:', meetingDetails);
      detailsContainer.innerHTML = '';

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
      console.error('Errore API:', response.status);
      alert('Errore nel recupero dei dettagli del meeting.');
    }
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore di rete.');
  }
}