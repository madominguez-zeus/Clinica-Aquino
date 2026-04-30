/**
 * Lógica para el Módulo ERP (Finanzas y Administrativo)
 */

let facturasData = [];
let pacientesList = [];
let serviciosList = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarFacturasERP();
    cargarSelectsERP();

    // Búsqueda en tiempo real
    const searchInput = document.getElementById('buscar-factura');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = facturasData.filter(f => 
                f.paciente_nombre.toLowerCase().includes(term) || 
                (f.paciente_apellido && f.paciente_apellido.toLowerCase().includes(term)) ||
                f.nombre_servicio.toLowerCase().includes(term)
            );
            renderizarTablaFacturas(filtrados);
        });
    }

    // Submit del Formulario
    const formFactura = document.getElementById('form-factura');
    if (formFactura) {
        formFactura.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarFactura();
        });
    }
});

async function cargarSelectsERP() {
    try {
        const [resPac, resSer] = await Promise.all([
            fetch(`${API_BASE_URL}/pacientes`),
            fetch(`${API_BASE_URL}/servicios`)
        ]);
        
        const pacResult = await resPac.json();
        const serResult = await resSer.json();

        if (pacResult.success) pacientesList = pacResult.data;
        if (serResult.success) serviciosList = serResult.data;

        // Llenar selects
        const selectPaciente = document.getElementById('factura-paciente');
        const selectServicio = document.getElementById('factura-servicio');

        if (selectPaciente) {
            pacientesList.forEach(p => {
                selectPaciente.innerHTML += `<option value="${p.id_paciente}">${p.cedula} - ${p.nombre} ${p.apellido}</option>`;
            });
        }
        
        if (selectServicio) {
            serviciosList.forEach(s => {
                selectServicio.innerHTML += `<option value="${s.id_servicio}">${s.nombre_servicio} ($${s.precio})</option>`;
            });
            
            // Auto-llenar el monto cuando se elige un servicio
            selectServicio.addEventListener('change', (e) => {
                const srv = serviciosList.find(x => x.id_servicio == e.target.value);
                if (srv) document.getElementById('factura-monto').value = srv.precio;
            });
        }
    } catch (error) {
        console.error('Error cargando selects:', error);
    }
}

async function cargarFacturasERP() {
    const tableBody = document.querySelector('#tabla-facturas tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Cargando facturas...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/facturas`);
        const result = await response.json();

        if (result.success) {
            facturasData = result.data;
            renderizarTablaFacturas(facturasData);
        }
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error de conexión con el backend.</td></tr>';
    }
}

function renderizarTablaFacturas(data) {
    const tableBody = document.querySelector('#tabla-facturas tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No se encontraron facturas.</td></tr>';
        return;
    }

    data.forEach(factura => {
        const badgeColor = factura.estado === 'Pagado' ? 'var(--accent-green)' : 
                          factura.estado === 'Pendiente' ? '#f39c12' : '#e74c3c';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>FAC-${factura.id_factura.toString().padStart(4, '0')}</td>
            <td>${factura.paciente_nombre} ${factura.paciente_apellido}</td>
            <td>${factura.nombre_servicio}</td>
            <td><strong>$${parseFloat(factura.monto).toFixed(2)}</strong></td>
            <td><span style="background:${badgeColor}; color:white; padding:4px 8px; border-radius:12px; font-size:0.8rem;">${factura.estado}</span></td>
            <td>${formatDate(factura.fecha)}</td>
            <td>
                ${factura.estado === 'Pendiente' ? 
                `<button class="btn" style="background:#2ecc71; color:white; padding: 5px 10px;" onclick="pagarFactura(${factura.id_factura})"><i class="fas fa-check"></i> Pagar</button>` 
                : '<span style="color:#2ecc71"><i class="fas fa-check-circle"></i> Completado</span>'}
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function abrirModalFactura() {
    document.getElementById('form-factura').reset();
    document.getElementById('factura-fecha').value = formatDateForInput(new Date().toISOString());
    openModal('modal-factura');
}

async function guardarFactura() {
    const datos = {
        id_paciente: document.getElementById('factura-paciente').value,
        id_servicio: document.getElementById('factura-servicio').value,
        fecha: document.getElementById('factura-fecha').value,
        monto: document.getElementById('factura-monto').value,
        estado: document.getElementById('factura-estado').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/facturas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const result = await response.json();
        
        if (result.success) {
            closeModal('modal-factura');
            showToast(result.message, 'success');
            cargarFacturasERP(); // Recargar lista
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

async function pagarFactura(id) {
    if (confirm('¿Marcar esta factura como pagada?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/facturas/${id}/pagar`, { method: 'PUT' });
            const result = await response.json();
            if (result.success) {
                showToast(result.message, 'success');
                cargarFacturasERP();
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        }
    }
}
