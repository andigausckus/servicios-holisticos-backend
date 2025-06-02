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
  const { nombre, email, password, especialidad, modalidad, ubicacion } = req.body;

  const nuevoTerapeuta = new Terapeuta({
    nombre,
    email,
    password,
    especialidad,
    modalidad,
    ubicacion,
  });

  const bcrypt = require("bcrypt");
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

  try {
    const terapeutaGuardado = await nuevoTerapeuta.save();
    res.status(201).json(terapeutaGuardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
