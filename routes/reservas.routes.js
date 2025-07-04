const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");
const authMiddleware = require("../middleware/auth");

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

module.exports = router;
