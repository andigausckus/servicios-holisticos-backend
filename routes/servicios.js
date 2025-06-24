const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const jwt = require("jsonwebtoken");

// Middleware para verificar el token JWT
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

// Crear un nuevo servicio
router.post("/", verificarToken, async (req, res) => {
  try {
    const nuevoServicio = new Servicio({
      ...req.body,
      terapeuta: req.terapeutaId,
    });

    await nuevoServicio.save();
    res.status(201).json({ id: nuevoServicio._id });
  } catch (err) {
    console.error("Error al crear servicio:", err);
    res.status(500).json({ error: "Error al crear el servicio" });
  }
});

// Obtener todos los servicios
router.get("/", async (req, res) => {
  try {
    const servicios = await Servicio.find().populate("terapeuta", "nombreCompleto ubicacion");
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los servicios" });
  }
});

module.exports = router;
