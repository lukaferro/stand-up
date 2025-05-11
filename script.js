document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const resultDiv = document.getElementById('result');

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const apiKey = document.getElementById('apiKey').value;

    try {
      const response = await fetch('https://standupparo-apis.vercel.app/api/company-name', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem('apiKey', apiKey);
        localStorage.setItem('companyName', data.companyName);

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
            console.log('Dati degli sviluppatori precaricati con successo');
          }
        } catch (error) {
          console.error('Errore nel precaricare i dati degli sviluppatori:', error);
        }

        try {
          const meetingsResponse = await fetch('https://standupparo-apis.vercel.app/api/stand-ups', {
            method: 'GET',
            headers: {
              'x-api-key': apiKey
            }
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
            console.log('Dati dei meeting precaricati con successo');
          }
        } catch (error) {
          console.error('Errore nel precaricare i dati dei meeting:', error);
        }

        window.location.href = 'dashboard.html';
      } else {
        resultDiv.innerText = 'API Key non valida o errore nella richiesta.';
      }
    } catch (error) {
      resultDiv.innerText = 'Errore di rete.';
      console.error('Errore:', error);
    }
  });
});
