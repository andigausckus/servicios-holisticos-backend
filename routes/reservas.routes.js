const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");
const authMiddleware = require("../middlewares/auth");

// ✅ Crear nueva reserva
router.post("/", async (req, res) => {
  try {
    const nueva = new Reserva(req.body);
    await nueva.save();
    res.status(201).json({ mensaje: "✅ Reserva registrada", reserva: nueva });
  } catch (error) {
    console.error("❌ Error al guardar reserva:", error);
    res.status(500).json({ mensaje: "❌ Error al guardar reserva", error });
  }
});

// ✅ Obtener TODAS las reservas (uso general o para admin)
router.get("/", async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ fecha: -1 }).populate("servicioId terapeutaId");
    res.json(reservas);
  } catch (error) {
    console.error("❌ Error al obtener reservas:", error);
    res.status(500).json({ mensaje: "❌ Error al obtener reservas", error });
  }
});

// ✅ Obtener SOLO las reservas del terapeuta logueado
router.get("/mis-reservas", authMiddleware, async (req, res) => {
  try {
    const reservas = await Reserva.find({ terapeutaId: req.user.id }).sort({ fecha: -1 });
    res.json(reservas);
  } catch (err) {
    res.status(500).json({ mensaje: "❌ Error al obtener reservas", error: err });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    const reservaActualizada = await Reserva.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );
    res.json({ mensaje: "✅ Estado actualizado", reserva: reservaActualizada });
  } catch (error) {
    console.error("❌ Error al actualizar reserva:", error);
    res.status(500).json({ mensaje: "❌ No se pudo actualizar la reserva", error });
  }
});

// ✅ Liberar un horario bloqueado (cuando expira el temporizador)
const Bloqueo = require("../models/Bloqueo");

router.post("/liberar", async (req, res) => {
  const { servicioId, fecha, hora } = req.body;

  if (!servicioId || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const result = await Bloqueo.deleteOne({ servicioId, fecha, hora });

    if (result.deletedCount === 0) {
      return res.status(404).json({ mensaje: "No se encontró bloqueo para liberar" });
    }

    res.json({ mensaje: "⛔ Reserva liberada correctamente" });
  } catch (error) {
    console.error("❌ Error al liberar reserva:", error);
    res.status(500).json({ error: "Error al liberar reserva" });
  }
});

// Obtener la reserva más reciente por email
router.get("/reciente", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: "Falta el email en la query" });
    }

    const reserva = await Reserva.findOne({ usuarioEmail: email })
      .sort({ createdAt: -1 })
      .populate("terapeutaId");

    if (!reserva) {
      return res.status(404).json({ error: "No se encontró una reserva para este email" });
    }

    res.json(reserva);
  } catch (error) {
    console.error("❌ Error al obtener reserva reciente:", error);
    res.status(500).json({ error: "Error al buscar la reserva" });
  }
});

module.exports = router;
