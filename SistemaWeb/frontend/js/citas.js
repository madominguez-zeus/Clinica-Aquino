/**
 * Lógica para el Módulo Citas
 */

let currentDoctorId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await cargarOpcionesCita();

    // Buscador
    const buscador = document.getElementById('buscador-citas');
    if (buscador) {
        buscador.addEventListener('input', (e) => {
            const termino = e.target.value.toLowerCase();
            const filas = document.querySelectorAll('#tabla-citas tbody tr');
            
            filas.forEach(fila => {
                const texto = fila.textContent.toLowerCase();
                fila.style.display = texto.includes(termino) ? '' : 'none';
            });
        });
    }

    // Submit del formulario
    const form = document.getElementById('form-cita');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarCita();
        });
    }
});

async function cargarOpcionesCita() {
    try {
        // Cargar Pacientes
        const resPacientes = await fetch(`${API_BASE_URL}/pacientes`);
        const dataPacientes = await resPacientes.json();
        if (dataPacientes.success) {
            const selectPaciente = document.getElementById('cita-paciente');
            if (selectPaciente) {
                dataPacientes.data.forEach(p => {
                    selectPaciente.innerHTML += `<option value="${p.id_paciente}">${p.cedula} - ${p.nombre} ${p.apellido}</option>`;
                });
            }
        }

        // Cargar Personal
        const resPersonal = await fetch(`${API_BASE_URL}/personal`);
        const dataPersonal = await resPersonal.json();
        
        const session = localStorage.getItem('clinica_session');
        const userData = session ? JSON.parse(session) : null;
        
        const userToDoctorMap = {
            'cmedina': 'Dr. Carlos Medina',
            'atorres': 'Dra. Ana Torres',
            'rsilva': 'Dr. Roberto Silva'
        };

        if (dataPersonal.success) {
            const selectMedico = document.getElementById('cita-medico');
            if (selectMedico) {
                dataPersonal.data.forEach(m => {
                    selectMedico.innerHTML += `<option value="${m.id_personal}">${m.nombre} (${m.especialidad})</option>`;
                    
                    if (userData && userData.rol === 'Medico') {
                        if (userToDoctorMap[userData.usuario] === m.nombre) {
                            currentDoctorId = m.id_personal;
                        }
                    }
                });
            }
        }
        
        // Ahora que tenemos el ID del doctor actual resuelto, cargamos las citas
        cargarCitas();
        
    } catch (error) {
        console.error('Error cargando opciones:', error);
    }
}

async function cargarCitas() {
    const tableBody = document.querySelector('#tabla-citas tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando citas...</td></tr>';

    try {
        const session = localStorage.getItem('clinica_session');
        const userData = session ? JSON.parse(session) : null;
        let url = `${API_BASE_URL}/citas`;
        
        // Si es médico, filtrar por su ID
        if (userData && userData.rol === 'Medico' && currentDoctorId) {
            url += `?medico_id=${currentDoctorId}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            renderizarTabla(result.data);
        }
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error de conexión.</td></tr>';
    }
}

function renderizarTabla(data) {
    const tableBody = document.querySelector('#tabla-citas tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay citas programadas.</td></tr>';
        return;
    }

    data.forEach(cita => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(cita.fecha)}</td>
            <td><span style="background: var(--light-blue); color: var(--primary-blue); padding: 3px 8px; border-radius: 12px; font-size: 0.85rem; font-weight: bold;">${cita.hora.substring(0, 5)}</span></td>
            <td><strong>${cita.paciente_nombre} ${cita.paciente_apellido}</strong></td>
            <td><i class="fas fa-user-md" style="color:var(--text-muted);"></i> ${cita.medico}</td>
            <td>${cita.motivo}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function abrirModalCita() {
    document.getElementById('form-cita').reset();
    document.getElementById('cita-fecha').value = formatDateForInput(new Date().toISOString());
    
    const session = localStorage.getItem('clinica_session');
    const userData = session ? JSON.parse(session) : null;
    const selectMedico = document.getElementById('cita-medico');
    
    if (userData && userData.rol === 'Medico' && currentDoctorId) {
        selectMedico.value = currentDoctorId;
        // Simular disabled visualmente para que JS lo pueda leer sin problema
        selectMedico.style.pointerEvents = 'none';
        selectMedico.style.backgroundColor = '#eee';
    } else {
        selectMedico.style.pointerEvents = 'auto';
        selectMedico.style.backgroundColor = '';
    }

    openModal('modal-cita');
}

async function guardarCita() {
    const datos = {
        id_paciente: document.getElementById('cita-paciente').value,
        id_personal: document.getElementById('cita-medico').value,
        fecha: document.getElementById('cita-fecha').value,
        hora: document.getElementById('cita-hora').value,
        motivo: document.getElementById('cita-motivo').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/citas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await response.json();
        
        if (result.success) {
            closeModal('modal-cita');
            showToast(result.message, 'success');
            cargarCitas(); // Recargar la tabla
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}
