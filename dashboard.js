document.addEventListener('DOMContentLoaded', () => {
  const companyName = localStorage.getItem('companyName');
  if (!companyName) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('welcomeMsg').innerText = `Azienda: ${companyName}`;

  document.getElementById('startBtn').addEventListener('click', () => {
    window.location.href = 'meeting.html';
  });

  document.getElementById('historyBtn').addEventListener('click', () => {
    window.location.href = 'history.html';
  });

  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
  }

  setInterval(updateClock, 1000);
  updateClock();
});