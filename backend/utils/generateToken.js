const jwt = require("jsonwebtoken");
const env = require("../config/env");

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { generateToken, verifyToken };
