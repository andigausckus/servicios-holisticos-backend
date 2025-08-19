const express = require("express");
const router = express.Router();
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const Resena = require("../models/Resena");
const Reserva = require("../models/Reserva");

// --- TERAPEUTAS ---
router.get("/terapeutas-pendientes", async (req, res) => {
  try {
    const pendientes = await Terapeuta.find({ aprobado: false });
    res.json(pendientes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener terapeutas", error });
  }
});

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
    res.status(500).json({ mensaje: "Error al actualizar terapeuta", error });
  }
});

// --- SERVICIOS PENDIENTES ---
router.get("/servicios-pendientes", async (req, res) => {
  try {
    const terapeutas = await Terapeuta.find({ 
      "servicios": { $elemMatch: { $or: [ { aprobado: false }, { aprobado: { $exists: false } } ], rechazado: false } }
    });

    const pendientes = [];

    terapeutas.forEach(t => {
      t.servicios.forEach(s => {
        if ((!s.aprobado && s.aprobado !== true) && !s.rechazado) { // pendiente y no rechazado
          pendientes.push({
            ...s.toObject(),
            terapeuta: { _id: t._id, nombreCompleto: t.nombreCompleto }
          });
        }
      });
    });

    res.json(pendientes);
  } catch (error) {
    console.error("Error al obtener servicios pendientes:", error);
    res.status(500).json({ mensaje: "Error al obtener servicios pendientes", error });
  }
});

router.put("/aprobar-servicio/:id", async (req, res) => {
  try {
    const { aprobado } = req.body;
    const terapeuta = await Terapeuta.findOne({ "servicios._id": req.params.id });
    if (!terapeuta) return res.status(404).json({ mensaje: "Servicio no encontrado" });

    const servicio = terapeuta.servicios.id(req.params.id);
    servicio.aprobado = aprobado;
    servicio.rechazado = false; // 👈 aseguramos que no quede rechazado

    await terapeuta.save();
    res.json({ mensaje: "✅ Servicio aprobado", servicio });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al aprobar servicio", error });
  }
});

router.put("/rechazar-servicio/:id", async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findOne({ "servicios._id": req.params.id });
    if (!terapeuta) return res.status(404).json({ mensaje: "Servicio no encontrado" });

    const servicio = terapeuta.servicios.id(req.params.id);
    servicio.aprobado = false;
    servicio.rechazado = true; // 👈 clave

    await terapeuta.save();
    res.json({ mensaje: "❌ Servicio rechazado", servicio });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al rechazar servicio", error });
  }
});

// --- RESEÑAS ---
router.get("/resenas-pendientes", async (req, res) => {
  try {
    const pendientes = await Resena.find({ aprobado: false }).populate("terapeuta");
    res.json(pendientes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener reseñas", error });
  }
});

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
    res.status(500).json({ mensaje: "Error al actualizar reseña", error });
  }
});

// --- RESERVAS ---
router.get("/reservas-pendientes", async (req, res) => {
  try {
    const pendientes = await Reserva.find({ estado: "en_proceso" }) // sigue válido
      .sort({ creadaEn: -1 })
      .populate("terapeuta servicio");
    res.json(pendientes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener reservas pendientes", error });
  }
});

router.put("/reserva/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    const reserva = await Reserva.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    ).populate("terapeuta servicio");

    if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada" });

    res.json({ mensaje: "✅ Estado actualizado", reserva });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar reserva", error });
  }
});

module.exports = router;
