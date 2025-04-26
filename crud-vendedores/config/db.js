const { Pool } = require('pg');

const pool = new Pool({
  host: "dpg-cvnl0ni4d50c73cv2l3g-a.oregon-postgres.render.com",
  user: "asleep2049",
  password: "cV4RQZcQNOVArokkeJMCPg9bEaTd22Gj",
  database: "sistema_ventas",
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false,
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
