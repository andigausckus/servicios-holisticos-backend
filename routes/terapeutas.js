const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Terapeuta = require("../models/Terapeuta");
const secret = process.env.JWT_SECRET;
const verificarToken = require("../middlewares/auth");

// ✅ Ruta para registrar nuevo terapeuta
router.post("/", async (req, res) => {
  try {
    const {
      nombreCompleto,
      email,
      password,
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

// login terapeuta
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const terapeuta = await Terapeuta.findOne({ email });
    if (!terapeuta) {
      return res.status(400).json({ mensaje: "Credenciales incorrectas" });
    }

    const esValido = await bcrypt.compare(password, terapeuta.password);
    if (!esValido) {
      return res.status(400).json({ mensaje: "Credenciales incorrectas" });
    }

    // 🔍 chequear estado antes de permitir acceso
    if (terapeuta.estado === "pendiente") {
      return res.status(403).json({ mensaje: "Tu cuenta está en revisión. Te avisaremos por email cuando sea aprobada." });
    }

    if (terapeuta.estado === "rechazado") {
      return res.status(403).json({ mensaje: "Tu solicitud fue rechazada. Contactanos para más información." });
    }

    // ✅ solo si está aprobado generamos token
    const token = jwt.sign(
      { id: terapeuta._id, email: terapeuta.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// 🔐 Ruta protegida para obtener el perfil del terapeuta logueado
router.get("/perfil", verificarToken, async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findById(req.user.id).populate({
      path: "servicios",
      select: "titulo descripcion modalidad duracionMinutos precio categoria plataformas imagen aprobado horariosDisponibles slug reseñas"
    });

    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }

    res.json(terapeuta);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// 🧹 Ruta para borrar todos los terapeutas (temporal)
router.delete('/borrar-todos', async (req, res) => {
  try {
    await Terapeuta.deleteMany({});
    res.json({ mensaje: 'Todos los terapeutas fueron eliminados' });
  } catch (error) {
    res.status(500).json({ error: 'Error al borrar terapeutas' });
  }
});

// ✅ Obtener un terapeuta público por ID
router.get("/publico/:id", async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findById(req.params.id).select("nombreCompleto email whatsapp");
    if (!terapeuta) {
      return res.status(404).json({ error: "Terapeuta no encontrado" });
    }
    res.json(terapeuta);
  } catch (err) {
    console.error("Error al obtener terapeuta público:", err);
    res.status(500).json({ error: "Error al obtener terapeuta" });
  }
});

// ✅ Ruta pública para obtener reseñas aprobadas y puntaje promedio de un terapeuta
const Resena = require("../models/Resena");

router.get("/publico/:id/resenas", async (req, res) => {
  try {
    const { id } = req.params;
    const resenas = await Resena.find({ terapeuta: id, aprobada: true });

    if (resenas.length === 0) {
      return res.json({ promedio: 0, total: 0, resenas: [] });
    }

    const total = resenas.length;
    const suma = resenas.reduce((acc, r) => acc + (r.puntaje || 0), 0);
    const promedio = Math.round((suma / total) * 10) / 10; // redondeo a un decimal

    res.json({ promedio, total, resenas });
  } catch (error) {
    console.error("Error al obtener reseñas del terapeuta:", error);
    res.status(500).json({ message: "Error al obtener reseñas", error });
  }
});

module.exports = router;
