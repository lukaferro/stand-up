const API_KEY = '40bd14d4d4b3aed9551fe612af5fd82695325cf2a88dbe6e6ff3e9f88339d5aa';
const API_BASE = 'https://standupparo-apis.vercel.app';

document.addEventListener('DOMContentLoaded', async function () {
  const loadingDiv = document.getElementById('loading');

  localStorage.setItem('apiKey', API_KEY);

  try {
    const response = await fetch(`${API_BASE}/api/company-name`, {
      method: 'GET',
      headers: { 'x-api-key': API_KEY }
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('companyName', data.companyName);

      try {
        const devsResponse = await fetch(`${API_BASE}/api/devs`, {
          method: 'GET',
          headers: { 'x-api-key': API_KEY }
        });
        if (devsResponse.ok) {
          const devs = await devsResponse.json();
          localStorage.setItem('developers', JSON.stringify(devs));
        }
      } catch (e) {
        console.error('Errore nel precaricare i dati degli sviluppatori:', e);
      }

      try {
        const meetingsResponse = await fetch(`${API_BASE}/api/stand-ups`, {
          method: 'GET',
          headers: { 'x-api-key': API_KEY }
        });
        if (meetingsResponse.ok) {
          const meetings = await meetingsResponse.json();
          localStorage.setItem('api_meetings', JSON.stringify(meetings));

          const savedMeetings = JSON.parse(localStorage.getItem('meetings')) || [];
          meetings.forEach(apiMeeting => {
            const existingMeeting = savedMeetings.find(m => m.date === apiMeeting.date);
            if (!existingMeeting) {
              savedMeetings.push({
                ...apiMeeting,
                plannedDurationMins: apiMeeting.plannedDurationMins || 0,
                standUpsInfo: apiMeeting.notes || []
              });
            }
          });
          localStorage.setItem('meetings', JSON.stringify(savedMeetings));
        }
      } catch (e) {
        console.error('Errore nel precaricare i dati dei meeting:', e);
      }

      window.location.href = 'dashboard.html';
    } else {
      loadingDiv.innerText = 'Errore di connessione. Riprova più tardi.';
    }
  } catch (error) {
    loadingDiv.innerText = 'Errore di rete.';
    console.error('Errore:', error);
  }
});
