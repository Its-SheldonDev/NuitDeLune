document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault(); 

    const email = document.getElementById('register-email').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-pass').value;

    try {
        const response = await fetch('http://localhost:3000/api/users/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, name: username, password, passwordConfirm: password }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Utilisateur enregistré avec succès:', data);
            sendNotification('success', 'Inscription réussie !');
            // Faire quelque chose avec la réponse, rediriger l'utilisateur, etc.
        } else {
            const errorData = await response.json();
            console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', errorData.message);
            sendNotification('error', errorData.message);
            // Afficher un message d'erreur à l'utilisateur
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
        sendNotification('error', 'Erreur de connexion au serveur');
        // Gérer l'erreur de connexion au serveur
    }
});
