const express = require("express");
const router = express.Router();
const Resena = require("../models/Resena");
const Servicio = require("../models/Servicio"); // 🔹 importar el modelo Servicio

// POST: crear una nueva reseña
router.post("/", async (req, res) => {
  try {
    const { servicioId, nombre, comentario, puntaje, email } = req.body;

    // Verificar que el servicio existe
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

    // Verificar si ya existe una reseña de este usuario/email para este servicio
    const existente = await Resena.findOne({ servicio: servicio._id, nombre, email });
    if (existente) {
      return res.status(400).json({ error: "Ya dejaste una reseña para este servicio" });
    }

    const nuevaResena = new Resena({
      terapeuta: servicio.terapeuta._id,
      servicio: servicio._id,
      nombre,
      email, // ⚠️ agregamos email al modelo si no está
      comentario,
      puntaje,
      aprobado: false
    });

    await nuevaResena.save();
    res.status(201).json({ mensaje: "Reseña creada", reseña: nuevaResena });
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

// GET: obtener cantidad de reseñas pendientes
router.get("/pendientes", async (req, res) => {
  try {
    const cantidad = await Resena.countDocuments({ aprobado: false });
    res.json({ cantidad });
  } catch (error) {
    console.error("❌ Error al contar reseñas pendientes:", error);
    res.status(500).json({ error: "Error al obtener reseñas pendientes" });
  }
});

module.exports = router;
