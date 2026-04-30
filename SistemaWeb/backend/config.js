/**
 * Archivo de Configuración de Base de Datos
 * Este archivo aísla las credenciales de la conexión, evitando que estén expuestas en el código frontend.
 */

const mysql = require('mysql2');

// Configuración de la conexión MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',      // Usuario por defecto en XAMPP
    password: '',      // Contraseña por defecto en XAMPP suele estar vacía
    database: 'clinicaAq'
};

// Crear un pool de conexiones para manejar múltiples peticiones concurrentes eficientemente
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir el pool para usar Promesas, lo que facilita el uso de async/await en server.js
const promisePool = pool.promise();

module.exports = promisePool;
