const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD.toString(),
  database: process.env.DB_DATABASE,
  port: 5432,
});

module.exports = pool;
