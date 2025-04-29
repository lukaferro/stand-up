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
  