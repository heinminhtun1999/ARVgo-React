const postgres = require('postgres'); // Import the Postgres.js library
const DB = process.env.DB;

const sql = postgres(DB);

module.exports = sql;

