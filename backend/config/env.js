require("dotenv").config();

const env = {
  port: process.env.PORT || 5000,
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};

const required = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn(`[env] Missing environment variables: ${missing.join(", ")}`);
}

module.exports = env;
