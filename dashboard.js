window.addEventListener('DOMContentLoaded', () => {
    const companyName = localStorage.getItem('companyName');
    if (!companyName) {
      window.location.href = 'index.html';
      return;
    }
  
    document.getElementById('welcomeMsg').innerText = `Azienda: ${companyName}`;
  
    document.getElementById('startBtn').addEventListener('click', () => {
      alert('Stand Up Meeting iniziato!');
    });
  });
  