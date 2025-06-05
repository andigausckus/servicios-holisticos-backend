const express = require("express");
const router = express.Router();
const Resena = require("../models/Resena");

// POST: crear una nueva reseña
router.post("/", async (req, res) => {
  try {
    const nuevaResena = new Resena(req.body);
    await nuevaResena.save();
    res.status(201).json(nuevaResena);
  } catch (error) {
    res.status(400).json({ mensaje: "Error al guardar la reseña", error });
  }
});

// ✅ GET: obtener todas las reseñas (opcional, para testeo o futuro)
router.get("/", async (req, res) => {
  try {
    const resenas = await Resena.find();
    res.status(200).json(resenas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener las reseñas", error });
  }
});

module.exports = router;