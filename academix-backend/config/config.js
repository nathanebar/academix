require("dotenv").config({ quiet: true });

const base = {
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "academix_dev",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 5432,
  dialect: "postgres",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
};

module.exports = {
  development: { ...base },
  test: { ...base, database: process.env.DB_NAME || "academix_test" },
  production: { ...base, database: process.env.DB_NAME || "academix_prod" },
};
