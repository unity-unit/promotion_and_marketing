const mysql = require('mysql2/promise');

function createPool() {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
  } = process.env;

  return mysql.createPool({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });
}

const pool = createPool();

module.exports = { pool };

