/**
 * Archivo de Configuración de Base de Datos
 * Usa variables de entorno para conectarse a RDS en AWS.
 * Localmente se puede usar un archivo .env o las variables por defecto.
 */

require('dotenv').config();
const mysql = require('mysql2');

// Configuración de la conexión MySQL (compatible con RDS y local)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinicaAq',
    port: parseInt(process.env.DB_PORT) || 3306
};

// Crear un pool de conexiones para manejar múltiples peticiones concurrentes
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convertir el pool para usar Promesas (async/await)
const promisePool = pool.promise();

module.exports = promisePool;
