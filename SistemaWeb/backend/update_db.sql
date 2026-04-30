USE clinicaAq;

-- 1. Eliminar todos los usuarios actuales
TRUNCATE TABLE usuarios;

-- 2. Insertar los 3 médicos en su propia tabla
INSERT IGNORE INTO personal_salud (nombre, especialidad, cargo) VALUES 
('Dr. Carlos Medina', 'Cardiología', 'Médico Titular'),
('Dra. Ana Torres', 'Pediatría', 'Médico Especialista'),
('Dr. Roberto Silva', 'Medicina General', 'Médico Residente');

-- 3. Crear los Usuarios en su tabla (SIN usar id_personal)
INSERT INTO usuarios (usuario, contrasena, rol) VALUES 
('admin', 'ad753min', 'Administrador'),
('cmedina', 'med159co', 'Medico'),
('atorres', 'm375dic0', 'Medico'),
('rsilva', '349di2o', 'Medico'),
('recepcion', 'rec864nis', 'Recepcion');
