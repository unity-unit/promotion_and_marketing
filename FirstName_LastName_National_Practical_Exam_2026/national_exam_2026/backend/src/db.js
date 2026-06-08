const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function loadDbConfig() {
  // Prefer env vars, but fall back to local json so the app can run
  // in environments where .env editing is blocked.
  const env = process.env;

  const hasEnv = env.DB_HOST && env.DB_USER && env.DB_NAME;
  if (hasEnv) {
    return {
      DB_HOST: env.DB_HOST,
      DB_PORT: env.DB_PORT,
      DB_USER: env.DB_USER,
      DB_PASSWORD: env.DB_PASSWORD,
      DB_NAME: env.DB_NAME
    };
  }

  const localPath = path.join(__dirname, 'db.local.json');
  const examplePath = path.join(__dirname, 'db.local.example.json');
  const targetPath = fs.existsSync(localPath) ? localPath : examplePath;

  try {
    const raw = fs.readFileSync(targetPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Missing DB configuration. Provide env vars (DB_HOST, DB_USER, DB_NAME) or create backend/src/db.local.json. Tried reading: ${targetPath}`
    );
  }
}

function createPool() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = loadDbConfig();

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error(
      `Missing DB config. Required: DB_HOST, DB_USER, DB_NAME. Got DB_HOST=${String(DB_HOST)}, DB_USER=${String(DB_USER)}, DB_NAME=${String(DB_NAME)}`
    );
  }

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


