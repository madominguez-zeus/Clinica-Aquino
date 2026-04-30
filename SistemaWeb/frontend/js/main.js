/**
 * Lógica Principal del Frontend - Clínica Aquino
 */

const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificación de sesión
    const session = localStorage.getItem('clinica_session');
    const path = window.location.pathname;
    
    // Si no hay sesión y no estamos en la página de login, redirigir
    if (!session && !path.endsWith('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Configurar información del usuario en la UI
    if (session && document.querySelector('.user-profile span')) {
        const userData = JSON.parse(session);
        document.querySelector('.user-profile span').textContent = `${userData.rol}: ${userData.usuario}`;
        
        // Aplicar control de roles
        aplicarPermisos(userData.rol);
    }

    // 2. Manejo del menú lateral
    const toggleBtn = document.getElementById('menu-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth > 768) {
                document.body.classList.toggle('sidebar-collapsed');
            } else {
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('open');
            }
        });
    }
});

// Logout global
window.logout = function() {
    localStorage.removeItem('clinica_session');
    window.location.href = 'login.html';
};

// Utilidad global: Mostrar notificaciones (Toast)
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-container');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-container';
        document.body.appendChild(toast);
    }
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.textContent = message;
    
    toast.appendChild(toastEl);
    
    setTimeout(() => toastEl.classList.add('show'), 10);
    
    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.remove(), 300);
    }, 3000);
}

// Utilidad para formatear fechas
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Handle UTC parsing safely for YYYY-MM-DD format to avoid off-by-one errors
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

// Función para formatear fechas para inputs (YYYY-MM-DD)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Utilidad para abrir/cerrar modales
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

// Cerrar modal si se hace clic fuera del contenido
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ==========================================
// CONTROL DE ACCESO (RBAC)
// ==========================================
const pageRules = {
    'dashboard': ['Administrador', 'Medico', 'Recepcion'],
    'citas': ['Administrador', 'Medico', 'Recepcion'],
    'hce': ['Administrador', 'Medico', 'Recepcion'],
    'erp': ['Administrador', 'Recepcion'],
    'pacs': ['Administrador', 'Medico']
};

function aplicarPermisos(rol) {
    const currentPage = document.body.getAttribute('data-page');
    
    // 1. Verificar si tiene acceso a la página actual
    if (currentPage && pageRules[currentPage]) {
        if (!pageRules[currentPage].includes(rol)) {
            showToast('Acceso denegado a este módulo', 'error');
            // Ocultar el contenido principal para evitar interacciones no autorizadas
            const mainContent = document.querySelector('.content-area');
            if (mainContent) mainContent.style.display = 'none';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }
    }

    // 2. Ocultar enlaces del menú lateral a los que no tiene acceso
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        let allowed = true;
        
        if (href === 'citas.html' && !pageRules['citas'].includes(rol)) allowed = false;
        if (href === 'erp.html' && !pageRules['erp'].includes(rol)) allowed = false;
        if (href === 'pacs.html' && !pageRules['pacs'].includes(rol)) allowed = false;
        
        if (!allowed) {
            link.parentElement.style.display = 'none';
        }
    });
}
