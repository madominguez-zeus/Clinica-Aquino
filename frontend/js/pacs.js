/**
 * Lógica para el Módulo PACS (Imágenes Médicas)
 */

document.addEventListener('DOMContentLoaded', () => {
    cargarEstudiosPACS();
    cargarPacientesParaEstudio();

    // Submit del Formulario
    const formEstudio = document.getElementById('form-estudio');
    if (formEstudio) {
        formEstudio.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarEstudio();
        });
    }
});

async function cargarPacientesParaEstudio() {
    try {
        const response = await fetch(`${API_BASE_URL}/pacientes`);
        const result = await response.json();

        if (result.success) {
            const selectPaciente = document.getElementById('estudio-paciente');
            if (selectPaciente) {
                result.data.forEach(p => {
                    selectPaciente.innerHTML += `<option value="${p.id_paciente}">${p.cedula} - ${p.nombre} ${p.apellido}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error cargando pacientes:', error);
    }
}

async function cargarEstudiosPACS() {
    const tableBody = document.querySelector('#tabla-estudios tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando estudios...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/estudios`);
        const result = await response.json();

        if (result.success) {
            renderizarTablaEstudios(result.data);
        }
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Error de conexión.</td></tr>';
    }
}

function renderizarTablaEstudios(data) {
    const tableBody = document.querySelector('#tabla-estudios tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay estudios registrados.</td></tr>';
        return;
    }

    data.forEach(est => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(est.fecha)}</td>
            <td><strong>${est.paciente_nombre} ${est.paciente_apellido}</strong></td>
            <td>${est.tipo_estudio}</td>
            <td>
                <button class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick='visualizarEstudio(${JSON.stringify(est).replace(/'/g, "&#39;")})'><i class="fas fa-eye"></i> Ver</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function abrirModalEstudio() {
    document.getElementById('form-estudio').reset();
    document.getElementById('estudio-fecha').value = formatDateForInput(new Date().toISOString());
    openModal('modal-estudio');
}

async function guardarEstudio() {
    const fileInput = document.getElementById('estudio-archivo');
    let imagenBase64 = null;
    let nombreArchivo = null;

    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        nombreArchivo = file.name;
        
        try {
            imagenBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('Error leyendo archivo:', error);
            showToast('Error al procesar la imagen', 'error');
            return;
        }
    }

    const datos = {
        id_paciente: document.getElementById('estudio-paciente').value,
        tipo_estudio: document.getElementById('estudio-tipo').value,
        fecha: document.getElementById('estudio-fecha').value,
        medico_solicitante: document.getElementById('estudio-medico').value,
        imagenBase64: imagenBase64,
        nombreArchivo: nombreArchivo
    };

    try {
        const response = await fetch(`${API_BASE_URL}/estudios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await response.json();
        
        if (result.success) {
            closeModal('modal-estudio');
            showToast(result.message, 'success');
            cargarEstudiosPACS();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

function visualizarEstudio(estudio) {
    const info = document.getElementById('estudio-activo');
    const viewer = document.querySelector('.dicom-viewer-sim');
    
    if (info && viewer) {
        info.innerHTML = `Estudio: ${estudio.tipo_estudio} - Paciente: ${estudio.paciente_nombre} ${estudio.paciente_apellido}`;
        
        if (estudio.ruta_archivo) {
            viewer.innerHTML = `
                <div style="width: 100%; height: 300px; display: flex; justify-content: center; align-items: center; overflow: hidden; background: #000; border-radius: 5px;">
                    <img src="${API_BASE_URL.replace('/api', '')}/uploads/${estudio.ruta_archivo}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <div style="margin-top: 20px; display:flex; gap: 10px; justify-content: center;">
                    <button class="btn" style="background:#333; color:white; border:none; padding:5px 10px;"><i class="fas fa-search-plus"></i></button>
                    <button class="btn" style="background:#333; color:white; border:none; padding:5px 10px;"><i class="fas fa-search-minus"></i></button>
                    <button class="btn" style="background:#333; color:white; border:none; padding:5px 10px;"><i class="fas fa-adjust"></i></button>
                </div>
            `;
        } else {
            let icon = 'fa-file-medical-alt';
            if (estudio.tipo_estudio === 'Radiografía') icon = 'fa-x-ray';
            if (estudio.tipo_estudio === 'Ecografía') icon = 'fa-wave-square';
            
            viewer.innerHTML = `
                <i class="fas ${icon}" style="color: var(--secondary-blue);"></i>
                <p>Estudio de fecha: ${formatDate(estudio.fecha)}</p>
                <p style="color: #666; font-size: 0.8rem; margin-top: 5px;">(No hay imagen adjunta)</p>
            `;
        }
    }
}
