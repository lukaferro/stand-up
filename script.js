const API_KEY = '40bd14d4d4b3aed9551fe612af5fd82695325cf2a88dbe6e6ff3e9f88339d5aa';

document.addEventListener('DOMContentLoaded', function () {
  localStorage.setItem('apiKey', API_KEY);
  window.location.href = 'dashboard.html';
});
