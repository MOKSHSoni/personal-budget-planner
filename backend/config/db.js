const mysql = require("mysql2/promise");
const env = require("./env");

// Connection pool. All queries elsewhere use pool.execute() with
// parameter placeholders (?) so values are never concatenated into SQL.
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}

module.exports = { pool, testConnection };
