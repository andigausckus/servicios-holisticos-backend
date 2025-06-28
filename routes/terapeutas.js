const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const verificarToken = require("../middlewares/authMiddleware");

const secret = process.env.JWT_SECRET;

// ✅ Registrar nuevo terapeuta
router.post("/", async (req, res) => {
  const {
    nombreCompleto,
    email,
    password,
    especialidades,
    ubicacion,
  } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let ubicacionFinal = ubicacion;
    if (typeof ubicacion === "string") {
      if (ubicacion.toLowerCase().includes("rosario")) {
        ubicacionFinal = { lat: -32.9442, lng: -60.6505 };
      } else if (ubicacion.toLowerCase().includes("cordoba")) {
        ubicacionFinal = { lat: -31.4201, lng: -64.1888 };
      } else {
        ubicacionFinal = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires por defecto
      }
    }

    const nuevoTerapeuta = new Terapeuta({
      nombreCompleto,
      email,
      password: hashedPassword,
      especialidades,
      ubicacion: ubicacionFinal,
    });

    const terapeutaGuardado = await nuevoTerapeuta.save();
    res.status(201).json(terapeutaGuardado);
  } catch (err) {
    console.error("Error al registrar terapeuta:", err);
    res.status(400).json({ message: err.message });
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
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// ✅ Ruta protegida para obtener el perfil privado + servicios
router.get("/perfil", verificarToken, async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findById(req.user.id)
      .select("-password")
      .populate("servicios");

    if (!terapeuta) return res.status(404).json({ message: "Terapeuta no encontrado" });

    res.json(terapeuta);
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// ✅ Obtener todos los terapeutas (público)
router.get("/", async (req, res) => {
  try {
    const terapeutas = await Terapeuta.find().select("-password");
    res.json(terapeutas);
  } catch (error) {
    console.error("Error al obtener terapeutas:", error);
    res.status(500).json({ message: "Error al obtener terapeutas" });
  }
});

// ✅ Guardar disponibilidad horaria semanal
router.post("/disponibilidad", verificarToken, async (req, res) => {
  try {
    const { disponibilidad } = req.body;

    if (!Array.isArray(disponibilidad)) {
      return res.status(400).json({ message: "Formato de disponibilidad inválido" });
    }

    const terapeuta = await Terapeuta.findById(req.user.id);
    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }

    terapeuta.disponibilidad = disponibilidad;
    await terapeuta.save();

    res.json({ message: "Disponibilidad guardada correctamente" });
  } catch (err) {
    console.error("Error al guardar disponibilidad:", err);
    res.status(500).json({ message: "Error al guardar disponibilidad" });
  }
});

// ✅ Guardar disponibilidad por fecha específica con rangos
router.post("/disponibilidad-fechas", verificarToken, async (req, res) => {
  try {
    const { fechas } = req.body;

    if (!Array.isArray(fechas)) {
      return res.status(400).json({ message: "Formato de fechas inválido" });
    }

    const terapeuta = await Terapeuta.findById(req.user.id);
    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }

    terapeuta.disponibilidadPorFechas = fechas;
    await terapeuta.save();

    res.json({ message: "Disponibilidad por fecha guardada correctamente" });
  } catch (err) {
    console.error("Error al guardar disponibilidad por fecha:", err);
    res.status(500).json({ message: "Error al guardar disponibilidad por fecha" });
  }
});

// ✅ Obtener disponibilidad semanal por servicio
router.get("/disponibilidad/:servicioId", async (req, res) => {
  try {
    const { servicioId } = req.params;

    const terapeuta = await Terapeuta.findOne({ servicios: servicioId });

    if (!terapeuta || !terapeuta.disponibilidad) {
      return res.status(404).json({ message: "Disponibilidad no encontrada" });
    }

    res.json(terapeuta.disponibilidad);
  } catch (err) {
    console.error("Error al obtener disponibilidad:", err);
    res.status(500).json({ message: "Error al obtener disponibilidad" });
  }
});

// ✅ Obtener disponibilidad por fechas del terapeuta según su servicio (ruta corregida)
router.get("/disponibilidad-fechas/:servicioId", async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.servicioId).populate("terapeuta");

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const disponibilidad = servicio.terapeuta.disponibilidadPorFechas || [];
    res.json(disponibilidad);
  } catch (err) {
    console.error("Error al obtener disponibilidad:", err);
    res.status(500).json({ error: "Error al obtener disponibilidad del terapeuta" });
  }
});

module.exports = router;
