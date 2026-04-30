/**
 * Lógica para el Dashboard Principal
 */

document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
});

async function cargarDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        const result = await response.json();

        if (result.success) {
            animarNumero('dash-pacientes', result.data.total_pacientes, 0);
            animarNumero('dash-citas', result.data.citas_hoy, 0);
            animarNumero('dash-ingresos', result.data.ingresos_mes, 2, '$');
            animarNumero('dash-estudios', result.data.total_estudios, 0);

            renderizarActividad(result.data.actividad_reciente);
        }
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showToast('Error conectando al servidor', 'error');
    }
}

// Función para animar números (efecto contador)
function animarNumero(id, valorFinal, decimales = 0, prefijo = '') {
    const elemento = document.getElementById(id);
    if (!elemento) return;

    // Convertir valor final a número
    const target = parseFloat(valorFinal) || 0;
    const duracion = 1000; // 1 segundo
    const frames = 30;
    const incremento = target / frames;
    let actual = 0;
    let frameActual = 0;

    const timer = setInterval(() => {
        frameActual++;
        actual += incremento;
        
        if (frameActual >= frames) {
            actual = target;
            clearInterval(timer);
        }

        elemento.textContent = prefijo + actual.toLocaleString('es-ES', { 
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        });
    }, duracion / frames);
}

function renderizarActividad(data) {
    const tableBody = document.querySelector('#tabla-actividad tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay actividad reciente.</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span style="background: var(--accent-green); color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;"><i class="fas fa-check-circle"></i> ${item.accion}</span></td>
            <td><strong>${item.paciente}</strong></td>
            <td>${formatDate(item.fecha)}</td>
            <td><span style="background: var(--light-blue); color: var(--primary-blue); padding: 3px 8px; border-radius: 12px; font-size: 0.85rem; font-weight: bold;"><i class="far fa-clock"></i> ${item.hora_cita ? item.hora_cita.substring(0,5) : 'Pendiente'}</span></td>
            <td>${item.detalle || ''}</td>
        `;
        tableBody.appendChild(tr);
    });
}
