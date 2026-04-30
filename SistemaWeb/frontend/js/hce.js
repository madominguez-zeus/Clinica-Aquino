/**
 * Lógica para el Módulo HCE (Historia Clínica Electrónica)
 */

let pacientesData = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarPacientesHCE();

    // Búsqueda en tiempo real
    const searchInput = document.getElementById('buscar-paciente');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = pacientesData.filter(p => 
                p.nombre.toLowerCase().includes(term) || 
                (p.apellido && p.apellido.toLowerCase().includes(term)) ||
                (p.cedula && p.cedula.toLowerCase().includes(term))
            );
            renderizarTablaPacientes(filtrados);
        });
    }

    // Submit del Formulario
    const formPaciente = document.getElementById('form-paciente');
    if (formPaciente) {
        formPaciente.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarPaciente();
        });
    }
});

async function cargarPacientesHCE() {
    const tableBody = document.querySelector('#tabla-pacientes tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando pacientes...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/pacientes`);
        const result = await response.json();

        if (result.success) {
            pacientesData = result.data;
            renderizarTablaPacientes(pacientesData);
        }
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error de conexión con el backend.</td></tr>';
    }
}

function renderizarTablaPacientes(data) {
    const tableBody = document.querySelector('#tabla-pacientes tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontraron pacientes.</td></tr>';
        return;
    }

    data.forEach(paciente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${paciente.cedula || 'N/A'}</td>
            <td><strong>${paciente.nombre} ${paciente.apellido || ''}</strong></td>
            <td>${formatDate(paciente.fecha_nacimiento)}</td>
            <td>${paciente.telefono || 'N/A'}</td>
            <td>
                <button class="btn" style="background:#3498db; color:white; padding: 5px 10px; margin-right:5px;" onclick='editarPaciente(${JSON.stringify(paciente).replace(/'/g, "&#39;")})'><i class="fas fa-edit"></i></button>
                <button class="btn" style="background:#e74c3c; color:white; padding: 5px 10px;" onclick="eliminarPaciente(${paciente.id_paciente})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function abrirModalPaciente() {
    document.getElementById('form-paciente').reset();
    document.getElementById('paciente-id').value = '';
    document.getElementById('modal-titulo').innerText = 'Registrar Paciente';
    openModal('modal-paciente');
}

function editarPaciente(paciente) {
    document.getElementById('paciente-id').value = paciente.id_paciente;
    document.getElementById('paciente-cedula').value = paciente.cedula || '';
    document.getElementById('paciente-nombre').value = paciente.nombre;
    document.getElementById('paciente-apellido').value = paciente.apellido || '';
    document.getElementById('paciente-fecha').value = formatDateForInput(paciente.fecha_nacimiento);
    document.getElementById('paciente-sexo').value = paciente.sexo || 'M';
    document.getElementById('paciente-telefono').value = paciente.telefono || '';
    document.getElementById('paciente-direccion').value = paciente.direccion || '';
    
    document.getElementById('modal-titulo').innerText = 'Editar Paciente';
    openModal('modal-paciente');
}

async function guardarPaciente() {
    const id = document.getElementById('paciente-id').value;
    const datos = {
        cedula: document.getElementById('paciente-cedula').value,
        nombre: document.getElementById('paciente-nombre').value,
        apellido: document.getElementById('paciente-apellido').value,
        fecha_nacimiento: document.getElementById('paciente-fecha').value || null,
        sexo: document.getElementById('paciente-sexo').value,
        telefono: document.getElementById('paciente-telefono').value,
        direccion: document.getElementById('paciente-direccion').value
    };

    const url = id ? `${API_BASE_URL}/pacientes/${id}` : `${API_BASE_URL}/pacientes`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await response.json();
        
        if (result.success) {
            closeModal('modal-paciente');
            showToast(result.message, 'success');
            cargarPacientesHCE(); // Recargar lista
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

async function eliminarPaciente(id) {
    if (confirm('¿Está seguro de eliminar este paciente?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/pacientes/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                showToast(result.message, 'success');
                cargarPacientesHCE();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        }
    }
}
