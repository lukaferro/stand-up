export default function handler(req, res) {
    if (req.method === 'GET') {
        const apiKey = req.headers['x-api-key'];

        // Simula una verifica della chiave API
        if (apiKey === '40bd14d4d4b3aed9551fe612af5fd82695325cf2a88dbe6e6ff3e9f88339d5aa') {
            res.status(200).json({ companyName: 'Azienda Esempio' });
        } else {
            res.status(401).send('API Key non valida');
        }
    } else {
        res.status(405).send('Metodo non consentito');
    }
}