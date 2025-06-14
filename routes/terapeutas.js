const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Terapeuta = require("../models/Terapeuta");
const auth = require("../auth");

const secret = process.env.JWT_SECRET;

// Obtener todos los terapeutas
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

// Ruta protegida para obtener perfil
router.get("/perfil", auth, async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findById(req.user.id).select("-password");
    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }
    res.json(terapeuta);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// Ruta protegida para actualizar disponibilidad
router.put("/disponibilidad", auth, async (req, res) => {
  try {
    console.log("📦 Disponibilidad recibida:", JSON.stringify(req.body, null, 2));
    console.log("REQ.BODY:", req.body);
    const { disponibilidad } = req.body;

    const terapeuta = await Terapeuta.findByIdAndUpdate(
      req.user.id,
      { disponibilidad },
      { new: true }
    );

    res.json({ message: "Disponibilidad actualizada", disponibilidad: terapeuta.disponibilidad });
  } catch (err) {
    console.error("Error al guardar disponibilidad:", err);
    res.status(500).json({ message: "Error al guardar disponibilidad" });
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

const authMiddleware = require("../middlewares/auth");
const Terapeuta = require("../models/Terapeuta");

// Ruta protegida para obtener el perfil del terapeuta
router.get("/perfil", auth, async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findById(req.user.id).select("-password");

    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }

    res.json(terapeuta);
  } catch (error) {
    console.error("❌ Error al obtener perfil:", error);
    res.status(500).json({ message: "Error al obtener perfil del terapeuta" });
  }
});

module.exports = router;
