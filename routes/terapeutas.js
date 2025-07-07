const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Terapeuta = require("../models/Terapeuta");
const secret = process.env.JWT_SECRET;

// ✅ Ruta para registrar nuevo terapeuta
router.post("/", async (req, res) => {
  try {
    const {
      nombreCompleto,
      email,
      password,
      especialidades,
      whatsapp,
      ubicacion,
      cbuCvu,
      bancoOBilletera,
    } = req.body;

    // Validación mínima de campos obligatorios
    if (
      !nombreCompleto ||
      !email ||
      !password ||
      !especialidades ||
      !whatsapp ||
      !ubicacion ||
      !cbuCvu ||
      !bancoOBilletera
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Validar longitud exacta del número de WhatsApp (10 dígitos)
    if (!/^\d{10}$/.test(whatsapp)) {
      return res.status(400).json({ message: "El WhatsApp debe tener 10 dígitos sin 0 ni 15" });
    }

    // Validar longitud del CBU/CVU
    if (!/^\d{22}$/.test(cbuCvu)) {
      return res.status(400).json({ message: "El CBU/CVU debe tener 22 dígitos" });
    }

    // Verificar si el email ya está registrado
    const existe = await Terapeuta.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoTerapeuta = new Terapeuta({
      nombreCompleto,
      email,
      password: hashedPassword,
      especialidades,
      whatsapp,
      ubicacion,
      cbuCvu,
      bancoOBilletera,
    });

    const guardado = await nuevoTerapeuta.save();

    res.status(201).json({ message: "Terapeuta registrado con éxito", _id: guardado._id });
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
