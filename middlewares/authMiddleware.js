const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extrae el token del header "Bearer xxx"
  if (!token) return res.status(401).json({ message: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // El payload del token estará disponible en req.user
    next();
  } catch (error) {
    console.error("Token inválido:", error.message);
    res.status(403).json({ message: "Token inválido" });
  }
};

module.exports = verificarToken;
