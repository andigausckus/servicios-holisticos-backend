const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Terapeuta = require("../models/Terapeuta");
const secret = process.env.JWT_SECRET;

// ✅ Ruta para registrar nuevo terapeuta
router.post("/", async (req, res) => {
  try {
    const { nombreCompleto, email, password, especialidades, modalidad, ubicacion } = req.body;

    // Validación básica
    if (!nombreCompleto || !email || !password || !especialidades || !modalidad || !ubicacion) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Verificar si el terapeuta ya existe
    const existe = await Terapeuta.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear y guardar terapeuta
    const nuevoTerapeuta = new Terapeuta({
      nombreCompleto,
      email,
      password: hashedPassword,
      especialidades,
      modalidad,
      ubicacion,
    });

    await nuevoTerapeuta.save();

    res.status(201).json({ message: "Terapeuta registrado con éxito", id: nuevoTerapeuta._id });
  } catch (error) {
    console.error("❌ Error al registrar terapeuta:", error);
    res.status(500).json({ message: "Error en el servidor", error });
  }
});

// ✅ Login de terapeuta
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

    // 🛑 Verificamos si fue aprobado por el admin
    if (!terapeuta.aprobado) {
      return res.status(403).json({
        message:
          "Tu cuenta aún no fue aprobada. Te avisaremos por email cuando esté lista.",
      });
    }

    const token = jwt.sign(
      { id: terapeuta._id, email: terapeuta.email },
      secret,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      terapeuta: { id: terapeuta._id, nombre: terapeuta.nombreCompleto },
    });
  } catch (err) {
    console.error("❌ Error en /login:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
