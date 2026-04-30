CREATE DATABASE IF NOT EXISTS clinicaAq;
USE clinicaAq;

CREATE TABLE IF NOT EXISTS pacientes (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    sexo ENUM('M','F'),
    telefono VARCHAR(20),
    direccion VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS personal_salud (
    id_personal INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especialidad VARCHAR(100),
    cargo VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_personal INT NOT NULL,
    fecha DATE,
    hora TIME,
    motivo VARCHAR(200),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_personal) REFERENCES personal_salud(id_personal)
);

CREATE TABLE IF NOT EXISTS historia_clinica (
    id_historia INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    fecha DATE,
    diagnostico VARCHAR(255),
    tratamiento VARCHAR(255),
    observaciones TEXT,
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente)
);

CREATE TABLE IF NOT EXISTS servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre_servicio VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS facturas (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_servicio INT NOT NULL,
    fecha DATE,
    monto DECIMAL(10,2),
    estado ENUM('Pagado','Pendiente'),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente),
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio)
);

CREATE TABLE IF NOT EXISTS pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    fecha DATE,
    monto DECIMAL(10,2),
    metodo_pago ENUM('Efectivo','Tarjeta','Seguro'),
    FOREIGN KEY (id_factura) REFERENCES facturas(id_factura)
);

CREATE TABLE IF NOT EXISTS estudios_imagen (
    id_estudio INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    tipo_estudio VARCHAR(50),
    fecha DATE,
    medico_solicitante VARCHAR(100),
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_paciente)
);

CREATE TABLE IF NOT EXISTS imagenes (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_estudio INT NOT NULL,
    ruta_archivo VARCHAR(255),
    formato VARCHAR(20),
    FOREIGN KEY (id_estudio) REFERENCES estudios_imagen(id_estudio)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) UNIQUE,
    contrasena VARCHAR(255),
    rol ENUM('Administrador','Medico','Recepcion')
);

-- ==========================================
-- DATOS DE PRUEBA INICIALES (MOCK DATA)
-- ==========================================

-- Insertar Usuarios por defecto
INSERT IGNORE INTO usuarios (usuario, contrasena, rol) VALUES 
('admin', 'admin123', 'Administrador'),
('medico', 'medico123', 'Medico'),
('recepcion', 'recepcion123', 'Recepcion');

-- Insertar Servicios Base para el ERP
INSERT IGNORE INTO servicios (nombre_servicio, precio) VALUES 
('Consulta General', 30.00),
('Consulta Especialista', 50.00),
('Radiografía', 25.00),
('Ecografía', 40.00),
('Examen de Sangre', 15.00);

INSERT INTO personal_salud (nombre, especialidad, cargo) VALUES 
('Dr. Carlos Medina', 'Cardiología', 'Médico Titular'),
('Dra. Ana Torres', 'Pediatría', 'Médico Especialista'),
('Dr. Roberto Silva', 'Medicina General', 'Médico Residente');
