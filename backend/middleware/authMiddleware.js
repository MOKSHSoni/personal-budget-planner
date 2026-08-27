const { verifyToken } = require("../utils/generateToken");
const User = require("../models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Not authorized: token missing" });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Not authorized: user not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized: invalid or expired token" });
  }
};
