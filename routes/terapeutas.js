const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Terapeuta = require("../models/Terapeuta");
const auth = require("../auth"); // ✅ Asegurate que el archivo auth.js esté en la raíz del proyecto

const secret = process.env.JWT_SECRET;

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
  password, // ✅ Cambiar "contraseña" por "password"
  especialidades,
  modalidad,
  ubicacion
} = req.body;

const hashedPassword = await bcrypt.hash(password, saltRounds);

const nuevoTerapeuta = new Terapeuta({
  nombreCompleto,
  email,
  password: hashedPassword, // ✅ Guardar como password en la DB
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

// ✅ Ruta de login
router.post("/login", async (req, res) => {
  const { email, contraseña } = req.body;

  try {
    const terapeuta = await Terapeuta.findOne({ email });
    if (!terapeuta) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const passwordOk = await bcrypt.compare(contraseña, terapeuta.contraseña);
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

// ✅ Ruta protegida para obtener perfil (corregido req.user.id)
router.get("/perfil", auth, async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findById(req.user.id).select("-contraseña");
    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }
    res.json(terapeuta);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// Obtener terapeuta por ID
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
