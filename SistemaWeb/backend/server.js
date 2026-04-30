/**
 * Servidor Principal de la API - Clínica Aquino
 */

const express = require('express');
const cors = require('cors');
const db = require('./config');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================
app.post('/api/login', async (req, res) => {
    const { usuario, contrasena } = req.body;
    try {
        const [rows] = await db.query('SELECT id_usuario, usuario, rol FROM usuarios WHERE usuario = ? AND contrasena = ?', [usuario, contrasena]);
        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// ==========================================
// MÓDULO HCE (Historia Clínica Electrónica)
// ==========================================

// --- PACIENTES ---
app.get('/api/pacientes', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pacientes ORDER BY id_paciente DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener pacientes' });
    }
});

app.post('/api/pacientes', async (req, res) => {
    const { nombre, apellido, cedula, fecha_nacimiento, sexo, telefono, direccion } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO pacientes (nombre, apellido, cedula, fecha_nacimiento, sexo, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre, apellido, cedula, fecha_nacimiento, sexo, telefono, direccion]
        );
        res.status(201).json({ success: true, message: 'Paciente registrado exitosamente', id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar paciente' });
    }
});

app.put('/api/pacientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, cedula, fecha_nacimiento, sexo, telefono, direccion } = req.body;
    try {
        await db.query(
            'UPDATE pacientes SET nombre=?, apellido=?, cedula=?, fecha_nacimiento=?, sexo=?, telefono=?, direccion=? WHERE id_paciente=?',
            [nombre, apellido, cedula, fecha_nacimiento, sexo, telefono, direccion, id]
        );
        res.json({ success: true, message: 'Paciente actualizado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar paciente' });
    }
});

app.delete('/api/pacientes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM pacientes WHERE id_paciente=?', [req.params.id]);
        res.json({ success: true, message: 'Paciente eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar paciente (puede tener registros asociados)' });
    }
});

// --- PERSONAL DE SALUD ---
app.get('/api/personal', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM personal_salud ORDER BY nombre');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener personal' });
    }
});

// --- CITAS ---
app.get('/api/citas', async (req, res) => {
    try {
        const medicoId = req.query.medico_id;
        let query = `
            SELECT c.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, ps.nombre as medico 
            FROM citas c 
            JOIN pacientes p ON c.id_paciente = p.id_paciente 
            JOIN personal_salud ps ON c.id_personal = ps.id_personal
        `;
        let queryParams = [];

        if (medicoId) {
            query += ` WHERE c.id_personal = ?`;
            queryParams.push(medicoId);
        }

        query += ` ORDER BY c.fecha DESC, c.hora DESC`;

        const [rows] = await db.query(query, queryParams);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener citas' });
    }
});

app.post('/api/citas', async (req, res) => {
    const { id_paciente, id_personal, fecha, hora, motivo } = req.body;
    try {
        await db.query('INSERT INTO citas (id_paciente, id_personal, fecha, hora, motivo) VALUES (?, ?, ?, ?, ?)',
            [id_paciente, id_personal, fecha, hora, motivo]);
        res.json({ success: true, message: 'Cita registrada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar cita' });
    }
});

// ==========================================
// MÓDULO ERP (Facturación y Finanzas)
// ==========================================
// --- SERVICIOS ---
app.get('/api/servicios', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM servicios ORDER BY nombre_servicio');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener servicios' });
    }
});

// --- FACTURAS ---
app.get('/api/facturas', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, s.nombre_servicio 
            FROM facturas f 
            JOIN pacientes p ON f.id_paciente = p.id_paciente 
            JOIN servicios s ON f.id_servicio = s.id_servicio
            ORDER BY f.fecha DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener facturas' });
    }
});

app.post('/api/facturas', async (req, res) => {
    const { id_paciente, id_servicio, fecha, monto, estado } = req.body;
    try {
        await db.query('INSERT INTO facturas (id_paciente, id_servicio, fecha, monto, estado) VALUES (?, ?, ?, ?, ?)',
            [id_paciente, id_servicio, fecha, monto, estado]);
        res.json({ success: true, message: 'Factura registrada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar factura' });
    }
});

app.put('/api/facturas/:id/pagar', async (req, res) => {
    try {
        await db.query("UPDATE facturas SET estado='Pagado' WHERE id_factura=?", [req.params.id]);
        res.json({ success: true, message: 'Factura pagada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar factura' });
    }
});

// ==========================================
// MÓDULO PACS (Imágenes Médicas)
// ==========================================
app.get('/api/estudios', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, i.ruta_archivo 
            FROM estudios_imagen e 
            JOIN pacientes p ON e.id_paciente = p.id_paciente
            LEFT JOIN imagenes i ON e.id_estudio = i.id_estudio
            ORDER BY e.fecha DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener estudios' });
    }
});

app.post('/api/estudios', async (req, res) => {
    const { id_paciente, tipo_estudio, fecha, medico_solicitante, imagenBase64, nombreArchivo } = req.body;
    try {
        const [result] = await db.query('INSERT INTO estudios_imagen (id_paciente, tipo_estudio, fecha, medico_solicitante) VALUES (?, ?, ?, ?)',
            [id_paciente, tipo_estudio, fecha, medico_solicitante]);
        
        const id_estudio = result.insertId;

        if (imagenBase64) {
            const base64Data = imagenBase64.replace(/^data:image\/\w+;base64,/, "");
            const extension = nombreArchivo ? nombreArchivo.split('.').pop() : 'jpg';
            const filename = `estudio_${id_estudio}_${Date.now()}.${extension}`;
            const filepath = path.join(uploadsDir, filename);
            
            require('fs').writeFileSync(filepath, base64Data, 'base64');

            await db.query('INSERT INTO imagenes (id_estudio, ruta_archivo, formato) VALUES (?, ?, ?)',
                [id_estudio, filename, extension]);
        }

        res.json({ success: true, message: 'Estudio registrado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al registrar estudio' });
    }
});

// ==========================================
// MÓDULO DASHBOARD (Estadísticas Generales)
// ==========================================
app.get('/api/dashboard', async (req, res) => {
    try {
        const [[{ total: total_pacientes }]] = await db.query('SELECT COUNT(*) as total FROM pacientes');
        const [[{ total: citas_hoy }]] = await db.query('SELECT COUNT(*) as total FROM citas WHERE fecha = CURDATE()');
        const [[{ total: ingresos_mes }]] = await db.query("SELECT COALESCE(SUM(monto), 0) as total FROM facturas WHERE estado = 'Pagado' AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())");
        const [[{ total: total_estudios }]] = await db.query('SELECT COUNT(*) as total FROM estudios_imagen');

        const [actividad_reciente] = await db.query(`
            SELECT 'Cita Registrada' as accion, CONCAT(p.nombre, ' ', p.apellido) as paciente, c.fecha, c.hora as hora_cita, c.motivo as detalle 
            FROM citas c 
            JOIN pacientes p ON c.id_paciente = p.id_paciente 
            ORDER BY c.id_cita DESC LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                total_pacientes,
                citas_hoy,
                ingresos_mes: parseFloat(ingresos_mes).toFixed(2),
                total_estudios,
                actividad_reciente
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al obtener datos del dashboard' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de Clínica Aquino ejecutándose en http://localhost:${PORT}`);
});
