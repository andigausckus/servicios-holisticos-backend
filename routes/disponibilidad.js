const express = require("express");
const router = express.Router();
const Disponibilidad = require("../models/Disponibilidad");
const jwt = require("jsonwebtoken");

// Middleware para verificar token
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.terapeutaId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

// ✅ Obtener horarios cargados por el terapeuta entre dos fechas
router.get("/mis-horarios", verificarToken, async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Faltan fechas desde y hasta" });
    }

    const horarios = await Disponibilidad.find({
      terapeuta: req.terapeutaId,
      fecha: { $gte: new Date(desde), $lte: new Date(hasta) },
    });

    res.json(horarios);
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    res.status(500).json({ error: "Error al obtener horarios" });
  }
});

module.exports = router;
