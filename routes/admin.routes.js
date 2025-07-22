const express = require("express");
const router = express.Router();
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const Resena = require("../models/Resena");
const Reserva = require("../models/Reserva"); // ⬅️ Asegurate de importar el modelo

// --- TERAPEUTAS ---

// Obtener terapeutas pendientes de aprobación
router.get("/terapeutas-pendientes", async (req, res) => {
  try {
    const pendientes = await Terapeuta.find({ aprobado: false });
    res.json(pendientes);
  } catch (error) {
    console.error("❌ Error al obtener terapeutas pendientes:", error);
    res.status(500).json({ mensaje: "Error al obtener terapeutas", error });
  }
});

// Aprobar o rechazar terapeuta
router.put("/aprobar-terapeuta/:id", async (req, res) => {
  try {
    const { aprobado } = req.body;
    const terapeuta = await Terapeuta.findByIdAndUpdate(
      req.params.id,
      { aprobado },
      { new: true }
    );
    res.json({ mensaje: "✅ Estado actualizado", terapeuta });
  } catch (error) {
    console.error("❌ Error al actualizar terapeuta:", error);
    res.status(500).json({ mensaje: "Error al actualizar terapeuta", error });
  }
});

// --- SERVICIOS ---

// Obtener servicios pendientes
router.get("/servicios-pendientes", async (req, res) => {
  try {
    const pendientes = await Servicio.find({ aprobado: false }).populate("terapeuta");
    res.json(pendientes);
  } catch (error) {
    console.error("❌ Error al obtener servicios pendientes:", error);
    res.status(500).json({ mensaje: "Error al obtener servicios", error });
  }
});

// Aprobar o rechazar servicio
router.put("/aprobar-servicio/:id", async (req, res) => {
  try {
    const { aprobado } = req.body;
    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      { aprobado },
      { new: true }
    );
    res.json({ mensaje: "✅ Estado actualizado", servicio });
  } catch (error) {
    console.error("❌ Error al actualizar servicio:", error);
    res.status(500).json({ mensaje: "Error al actualizar servicio", error });
  }
});

// --- RESEÑAS ---

// Obtener reseñas pendientes
router.get("/resenas-pendientes", async (req, res) => {
  try {
    const pendientes = await Resena.find({ aprobado: false }).populate("terapeuta");
    res.json(pendientes);
  } catch (error) {
    console.error("❌ Error al obtener reseñas pendientes:", error);
    res.status(500).json({ mensaje: "Error al obtener reseñas", error });
  }
});

// Aprobar o rechazar reseña
router.put("/aprobar-resena/:id", async (req, res) => {
  try {
    const { aprobado } = req.body;
    const resena = await Resena.findByIdAndUpdate(
      req.params.id,
      { aprobado },
      { new: true }
    );
    res.json({ mensaje: "✅ Estado actualizado", resena });
  } catch (error) {
    console.error("❌ Error al actualizar reseña:", error);
    res.status(500).json({ mensaje: "Error al actualizar reseña", error });
  }
});

// Obtener reservas en proceso (pagos no verificados aún)
router.get("/reservas-pendientes", async (req, res) => {
  try {
    const pendientes = await Reserva.find({ estado: "en_proceso" })
      .sort({ creadaEn: -1 })
      .populate("terapeuta servicio");

    res.json(pendientes);
  } catch (error) {
    console.error("❌ Error al obtener reservas pendientes:", error);
    res.status(500).json({ mensaje: "Error al obtener reservas pendientes", error });
  }
});

// Actualizar el estado de una reserva (confirmada o cancelada)
router.put("/reserva/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    const reserva = await Reserva.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    ).populate("terapeuta servicio");

    if (!reserva) {
      return res.status(404).json({ mensaje: "Reserva no encontrada" });
    }

    res.json({ mensaje: "✅ Estado actualizado", reserva });
  } catch (error) {
    console.error("❌ Error al actualizar reserva:", error);
    res.status(500).json({ mensaje: "Error al actualizar reserva", error });
  }
});

module.exports = router;
