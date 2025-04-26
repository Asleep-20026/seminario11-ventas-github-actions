const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  max: process.env.DB_MAX,
  idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT,
  connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT,
  ssl: {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
  },
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Conexión exitosa a la base de datos");

    const res = await client.query("SELECT 1");
    console.log("Consulta de prueba exitosa:", res.rows);

    client.release();
    return true;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    return false;
  }
}

testConnection();

module.exports = pool;
