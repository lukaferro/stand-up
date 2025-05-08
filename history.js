async function fetchDevelopers(apiKey) {
  try {
    const cachedDevs = localStorage.getItem('developers');

    if (cachedDevs) {
      console.log('Utilizzati dati degli sviluppatori dal cache');
      return JSON.parse(cachedDevs);
    }

    const response = await fetch('https://standupparo-apis.vercel.app/api/devs', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (response.ok) {
      const devs = await response.json();
      localStorage.setItem('developers', JSON.stringify(devs));
      return devs;
    } else {
      console.error('Errore nel recupero degli sviluppatori');
      return [];
    }
  } catch (error) {
    console.error('Errore di rete:', error);
    return [];
  }
}

function formatDuration(hours, minutes, seconds) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

let currentPage = 1;
const meetingsPerPage = 7;
let allMeetings = [];
let totalPages = 0;
let developers = [];

document.addEventListener('DOMContentLoaded', async () => {
  const apiKey = localStorage.getItem('apiKey');
  const meetingList = document.getElementById('meetingList');
  
  if (!apiKey) {
    alert('API Key non trovata. Effettua nuovamente il login.');
    window.location.href = 'index.html';
    return;
  }

  developers = await fetchDevelopers(apiKey);

  try {
    let meetings = [];
    const cachedMeetings = localStorage.getItem('api_meetings');

    if (cachedMeetings) {
      meetings = JSON.parse(cachedMeetings);
      console.log('Utilizzati dati dei meeting dal cache');
    } else {
      const response = await fetch('https://standupparo-apis.vercel.app/api/stand-ups', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey
        }
      });

      if (response.ok) {
        meetings = await response.json();
        localStorage.setItem('api_meetings', JSON.stringify(meetings));
      } else {
        throw new Error('Errore nel recupero dei meeting');
      }
    }

    const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];

    allMeetings = meetings.map(apiMeeting => {
      const localMeeting = savedMeetings.find(savedMeeting => savedMeeting.date === apiMeeting.date);
      return {
        ...apiMeeting,
        durationHours: localMeeting ? localMeeting.durationHours : apiMeeting.durationHours || 0,
        durationMins: localMeeting ? localMeeting.durationMins : apiMeeting.durationMins || 0,
        durationSecs: localMeeting ? localMeeting.durationSecs : apiMeeting.durationSecs || 0,
        notes: localMeeting ? localMeeting.standUpsInfo : []
      };
    });

    allMeetings.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    totalPages = Math.ceil(allMeetings.length / meetingsPerPage);
    
    displayMeetings(currentPage);
    
    updatePaginationControls();
    
  } catch (error) {
    console.error('Errore:', error);
    alert('Errore di rete.');
  }
});

function displayMeetings(page) {
  const meetingList = document.getElementById('meetingList');
  meetingList.innerHTML = '';
  
  const startIndex = (page - 1) * meetingsPerPage;
  const endIndex = Math.min(startIndex + meetingsPerPage, allMeetings.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    addMeetingToList(allMeetings[i], meetingList, developers);
  }
  
  currentPage = page;
  
  updatePaginationControls();
}

function updatePaginationControls() {
  const paginationInfo = document.getElementById('paginationInfo');
  const prevButton = document.getElementById('prevPage');
  const nextButton = document.getElementById('nextPage');
  
  paginationInfo.textContent = `Pagina ${currentPage} di ${totalPages}`;
  
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === totalPages;
}

async function loadMeetingDetails(meetingId, detailsContainerId, developers = []) {
  const detailsContainer = document.getElementById(detailsContainerId);

  const getDevName = (devId) => {
    const developer = developers.find(dev => dev.id === devId);
    return developer ? developer.name : `Sviluppatore ${devId}`;
  };

  const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];
  const meetingDetails = savedMeetings.find(meeting => meeting.date === meetingId);

  if (meetingDetails) {
    detailsContainer.innerHTML = '';

    if (meetingDetails.standUpsInfo && meetingDetails.standUpsInfo.length > 0) {
      meetingDetails.standUpsInfo.forEach(info => {
        const detailItem = document.createElement('li');
        detailItem.innerHTML = `
          <strong>Sviluppatore:</strong> ${getDevName(info.devId)} <br>
          <strong>Durata:</strong> ${info.durationMins} minuti e ${typeof info.durationSecs !== 'undefined' ? info.durationSecs : 0} secondi <br>
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

function goToPreviousPage() {
  if (currentPage > 1) {
    displayMeetings(currentPage - 1);
  }
}

function goToNextPage() {
  if (currentPage < totalPages) {
    displayMeetings(currentPage + 1);
  }
}

function addMeetingToList(meeting, meetingList, developers = []) {
  const durationHours = meeting.durationHours || 0;
  const durationMinutes = meeting.durationMins || 0;
  const durationSeconds = meeting.durationSecs || 0;

  const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];
  const localMeeting = savedMeetings.find(savedMeeting => savedMeeting.date === meeting.date);
  const plannedDuration = localMeeting && localMeeting.plannedDurationMins ? localMeeting.plannedDurationMins : '?';

  const getDevName = (devId) => {
    const developer = developers.find(dev => dev.id === devId);
    return developer ? developer.name : `Sviluppatore ${devId}`;
  };


  const listItem = document.createElement('li');
  listItem.classList.add('meeting-item');

  const meetingDate = new Date(meeting.date).toLocaleDateString('it-IT');

  const effectiveDuration = formatDuration(durationHours, durationMinutes, durationSeconds);

  const currentNotesHtml = meeting.notes && meeting.notes.length > 0
    ? meeting.notes.map(note => `
      <div class="note-item">
        <p><strong>Sviluppatore:</strong> ${getDevName(note.devId)}</p>
        <p><strong>Durata:</strong> ${note.durationMins} minuti e ${typeof note.durationSecs !== 'undefined' ? note.durationSecs : 0} secondi</p>
        <p><strong>Note:</strong> ${note.notes || 'Nessuna'}</p>
      </div>
    `).join('')
    : '<p class="no-notes">Nessuna nota disponibile.</p>';

  const previousNotesHtml = '';

  listItem.innerHTML = `
    <div class="meeting-header">
      <strong>Data:</strong> ${meetingDate} 
      <strong>Durata pianificata:</strong> ${plannedDuration} min
      <strong>Durata effettiva:</strong> ${effectiveDuration}
      <button class="expandBtn">Espandi</button>
    </div>
    <div class="details" style="display: none;">
      <div class="notes-container">
        <div class="current-notes">
          <h3>Note del meeting</h3>
          <div class="notes-list">
            ${currentNotesHtml}
          </div>
        </div>
      </div>
    </div>
  `;

  const expandBtn = listItem.querySelector('.expandBtn');
  const detailsDiv = listItem.querySelector('.details');

  expandBtn.addEventListener('click', () => {
    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
  });

  meetingList.appendChild(listItem);
}