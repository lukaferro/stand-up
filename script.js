async function fetchCompanyName(apiKey) {
    try {
        const response = await fetch('https://<stand-up>.vercel.app/api/company-name', {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.companyName;
        } else {
            const errorText = await response.text();
            console.error('Errore API:', errorText);
            throw new Error('API Key non valida o errore nella richiesta.');
        }
    } catch (error) {
        console.error('Errore:', error);
        throw new Error('Errore di rete.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const resultDiv = document.getElementById('result');

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const apiKey = document.getElementById('apiKey').value;

        try {
            const companyName = await fetchCompanyName(apiKey);

            localStorage.setItem('apiKey', apiKey);
            localStorage.setItem('companyName', companyName);

            window.location.href = 'dashboard.html';
        } catch (error) {
            resultDiv.innerText = error.message;
        }
    });
});
