// auth.js
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado. Token faltante." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.terapeuta = decoded; // El objeto con el _id y email
    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido." });
  }
}

module.exports = auth;
