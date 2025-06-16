const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Terapeuta = require("../models/Terapeuta");

const secret = process.env.JWT_SECRET;

// Registrar nuevo terapeuta
router.post("/", async (req, res) => {
  const {
    nombreCompleto,
    email,
    password,
    fechaNacimiento,
    telefono,
    ubicacion
  } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const nuevoTerapeuta = new Terapeuta({
      nombreCompleto,
      email,
      password: hashedPassword,
      fechaNacimiento,
      telefono,
      ubicacion
    });

    const terapeutaGuardado = await nuevoTerapeuta.save();
    res.status(201).json(terapeutaGuardado);
  } catch (err) {
    console.error("Error al registrar terapeuta:", err);
    res.status(400).json({ message: err.message });
  }
});

// Login de terapeuta
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const terapeuta = await Terapeuta.findOne({ email });
    if (!terapeuta) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const passwordOk = await bcrypt.compare(password, terapeuta.password);
    if (!passwordOk) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: terapeuta._id, email: terapeuta.email },
      secret,
      { expiresIn: "2h" }
    );

    res.json({ token, terapeuta: { id: terapeuta._id, nombre: terapeuta.nombreCompleto } });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Obtener todos los terapeutas (para el mapa, por ejemplo)
router.get("/", async (req, res) => {
  try {
    const terapeutas = await Terapeuta.find().select("-password"); // Excluye el campo de contraseña
    res.json(terapeutas);
  } catch (error) {
    console.error("Error al obtener terapeutas:", error);
    res.status(500).json({ message: "Error al obtener terapeutas" });
  }
});

module.exports = router;
