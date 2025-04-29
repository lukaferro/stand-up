function fetchCompanyNameWithXHR(apiKey, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://stand-up-eta.vercel.app/api/company-name', true);
    xhr.setRequestHeader('x-api-key', apiKey);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                callback(null, response.companyName);
            } else {
                callback(new Error('API Key non valida o errore nella richiesta.'));
            }
        }
    };

    xhr.onerror = function () {
        callback(new Error('Errore di rete.'));
    };

    xhr.send();
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const resultDiv = document.getElementById('result');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const apiKey = document.getElementById('apiKey').value;

        fetchCompanyNameWithXHR(apiKey, function (error, companyName) {
            if (error) {
                resultDiv.innerText = error.message;
            } else {
                localStorage.setItem('apiKey', apiKey);
                localStorage.setItem('companyName', companyName);

                window.location.href = 'dashboard.html';
            }
        });
    });
});
