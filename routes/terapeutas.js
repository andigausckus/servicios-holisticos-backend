const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Terapeuta = require("../models/Terapeuta");

// Obtener todos los terapeutas
router.get("/", async (req, res) => {
  try {
    const terapeutas = await Terapeuta.find();
    res.json(terapeutas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo terapeuta (ruta POST)
router.post("/", async (req, res) => {
  const {
    nombreCompleto,
    email,
    contraseña,
    especialidades,
    modalidad,
    ubicacion
  } = req.body;

  try {
    // Encriptar la contraseña antes de guardar
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

    const nuevoTerapeuta = new Terapeuta({
      nombreCompleto,
      email,
      contraseña: hashedPassword,
      especialidades,
      modalidad,
      ubicacion
    });

    const terapeutaGuardado = await nuevoTerapeuta.save();
    res.status(201).json(terapeutaGuardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ NUEVO: Obtener un terapeuta por ID
router.get("/:id", async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findById(req.params.id);
    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }
    res.json(terapeuta);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener terapeuta" });
  }
});

module.exports = router;
