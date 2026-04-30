document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Verificar si ya está logueado
    const session = localStorage.getItem('clinica_session');
    if (session) {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuario = document.getElementById('usuario').value;
        const contrasena = document.getElementById('contrasena').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, contrasena })
            });

            const result = await response.json();

            if (result.success) {
                // Guardar sesión en localStorage
                localStorage.setItem('clinica_session', JSON.stringify(result.data));
                window.location.href = 'index.html';
            } else {
                errorMessage.style.display = 'block';
                errorMessage.textContent = result.message || 'Error de autenticación';
            }
        } catch (error) {
            console.error('Error al hacer login:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Error de conexión con el servidor.';
        }
    });
});
