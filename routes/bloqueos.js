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

    // Horarios bloqueados temporalmente
    const bloqueos = await Bloqueo.find({
      servicioId,
      fecha: { $gte: desde, $lte: hasta },
    }).select("fecha hora");

    // Reservas confirmadas
    const reservasConfirmadas = await Reserva.find({
      servicioId,
      fecha: { $gte: desde, $lte: hasta },
      estado: "confirmada",
    }).select("fecha hora");

    res.json({
      bloqueos: bloqueos.map(b => ({ fecha: b.fecha, hora: b.hora })),
      reservas: reservasConfirmadas.map(r => ({ fecha: r.fecha, hora: r.hora })),
    });
  } catch (error) {
    console.error("❌ Error al obtener bloqueos y reservas:", error);
    res.status(500).json({ mensaje: "❌ Error interno del servidor" });
  }
});

module.exports = router;
