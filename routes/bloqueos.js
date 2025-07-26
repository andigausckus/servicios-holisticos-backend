const express = require("express");
const router = express.Router();
const Bloqueo = require("../models/Bloqueo");
const Reserva = require("../models/Reserva");

// Crear bloqueo
router.post("/", async (req, res) => {
  const { servicioId, fecha, hora } = req.body;
  if (!servicioId || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const ahora = new Date();
  const desbloqueo = new Date(ahora.getTime() + 10 * 60000);

  try {
    await Bloqueo.create({
      servicioId,
      fecha,
      hora,
      bloqueadoHasta: desbloqueo,
    });
    res.status(200).json({ ok: true, bloqueadoHasta: desbloqueo });
  } catch (err) {
    res.status(500).json({ error: "Error al bloquear horario" });
  }
});

// Verificar bloqueo
router.get("/verificar", async (req, res) => {
  const { servicioId, fecha, hora } = req.query;
  try {
    const bloqueo = await Bloqueo.findOne({ servicioId, fecha, hora });

    if (!bloqueo) return res.status(200).json({ libre: true });

    const ahora = new Date();
    if (bloqueo.bloqueadoHasta > ahora) {
      return res.status(200).json({ libre: false });
    } else {
      await Bloqueo.deleteOne({ _id: bloqueo._id });
      return res.status(200).json({ libre: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al verificar bloqueo" });
  }
});

router.get("/todos", async (req, res) => {
  try {
    const { servicioId, desde, hasta } = req.query;

    if (!servicioId || !desde || !hasta) {
      return res.status(400).json({ mensaje: "Faltan parámetros: servicioId, desde, hasta" });
    }

    // Horarios bloqueados manualmente
    const bloqueos = await Bloqueo.find({
      servicioId,
      fecha: { $gte: desde, $lte: hasta },
    }).select("fecha hora");

    // Todas las reservas que deben bloquear el horario
    const reservas = await Reserva.find({
      servicioId,
      fecha: { $gte: desde, $lte: hasta },
      estado: { $in: ["confirmada", "en_proceso", "pendiente_de_aprobacion"] },
    }).select("fecha hora estado");

    res.json({
      bloqueos: bloqueos.map(b => ({ fecha: b.fecha, hora: b.hora })),
      reservas: reservas.map(r => ({
        fecha: r.fecha,
        hora: r.hora,
        estado: r.estado,
      }))
    });
  } catch (error) {
    console.error("❌ Error al obtener bloqueos y reservas:", error);
    res.status(500).json({ mensaje: "❌ Error interno del servidor" });
  }
});

        // --- BLOQUEOS TEMPORALES (2 minutos) ---
const BloqueoTemporal = require("../models/BloqueoTemporal");

// Crear bloqueo temporal (visible para todos)
router.post("/temporales", async (req, res) => {
  const { servicioId, fecha, hora } = req.body;

  if (!servicioId || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const ahora = new Date();
  const expiracion = new Date(ahora.getTime() + 2 * 60000); // 2 minutos

  try {
    // Eliminar bloqueos expirados antes de crear uno nuevo
    await BloqueoTemporal.deleteMany({ expiracion: { $lt: ahora } });

    // Verificar si ya existe uno activo
    const existente = await BloqueoTemporal.findOne({ servicioId, fecha, hora });
    if (existente && existente.expiracion > ahora) {
  console.log("⏰ Bloqueo activo hasta:", existente.expiracion, "⏳ Ahora:", ahora);
  return res.status(409).json({ error: "Ya existe un bloqueo activo para ese horario" });
}

    await BloqueoTemporal.create({ servicioId, fecha, hora, expiracion });
    res.status(201).json({ ok: true, expiracion });
  } catch (err) {
    console.error("❌ Error al crear bloqueo temporal:", err);
    res.status(500).json({ error: "Error interno al crear el bloqueo temporal" });
  }
});

// Obtener bloqueos temporales activos
router.get("/temporales", async (req, res) => {
  const { servicioId, desde, hasta } = req.query;

  if (!servicioId || !desde || !hasta) {
    return res.status(400).json({ error: "Faltan parámetros: servicioId, desde, hasta" });
  }

  try {
    const ahora = new Date();

    // Limpiar expirados
    await BloqueoTemporal.deleteMany({ expiracion: { $lt: ahora } });

    const bloqueosTemporales = await BloqueoTemporal.find({
      servicioId,
      fecha: { $gte: desde, $lte: hasta },
      expiracion: { $gt: ahora }
    }).select("fecha hora expiracion");

    res.status(200).json({ bloqueos: bloqueosTemporales });
  } catch (err) {
    console.error("❌ Error al obtener bloqueos temporales:", err);
    res.status(500).json({ error: "Error interno al obtener bloqueos temporales" });
  }
});

module.exports = router;
