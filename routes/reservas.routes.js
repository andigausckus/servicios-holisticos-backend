const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");

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

router.get("/", async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ creadoEn: -1 }).populate("servicioId terapeutaId");
    res.json(reservas);
  } catch (error) {
    console.error("❌ Error al obtener reservas:", error);
    res.status(500).json({ mensaje: "❌ Error al obtener reservas", error });
  }
});

module.exports = router;
