const express = require("express");
const router = express.Router();
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
  try {
    const nuevoTerapeuta = new Terapeuta({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      especialidad: req.body.especialidad
    });

    const terapeutaGuardado = await nuevoTerapeuta.save();
    res.status(201).json(terapeutaGuardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
  
// Crear un nuevo terapeuta
router.post("/", async (req, res) => {
  const { nombre, descripcion, especialidad } = req.body;

  const nuevoTerapeuta = new Terapeuta({
    nombre,
    descripcion,
    especialidad,
  });

  try {
    const terapeutaGuardado = await nuevoTerapeuta.save();
    res.status(201).json(terapeutaGuardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
