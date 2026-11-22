require("dotenv").config({ quiet: true });

// Integer env var with a default (0 is a valid value).
const intEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isNaN(value) ? fallback : value;
};

const base = {
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "academix_dev",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 5432,
  dialect: "postgres",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  // Sequelize's default pool is max 5 connections: under load, requests queue waiting for one.
  // Keep DB_POOL_MAX × number of Node processes below PostgreSQL's max_connections (100 by default).
  pool: {
    max: intEnv("DB_POOL_MAX", 20),
    min: intEnv("DB_POOL_MIN", 2),
    acquire: intEnv("DB_POOL_ACQUIRE_MS", 30000),
    idle: intEnv("DB_POOL_IDLE_MS", 10000),
  },
};

module.exports = {
  development: { ...base },
  test: { ...base, database: process.env.DB_NAME || "academix_test" },
  production: { ...base, database: process.env.DB_NAME || "academix_prod" },
};
