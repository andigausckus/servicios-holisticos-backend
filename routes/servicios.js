const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const Terapeuta = require("../models/Terapeuta");
const jwt = require("jsonwebtoken");
const Bloqueo = require("../models/Bloqueo");
const Reserva = require("../models/Reserva");
const mongoose = require("mongoose");
const Resena = require("../models/Resena");
const verificarToken = require("../middlewares/auth");

// ✅ Crear servicio
router.post("/", verificarToken, async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      modalidad,
      duracionMinutos,
      precio,
      categoria,
      plataformas,
      imagen,
    } = req.body;

    if (!titulo || !descripcion || !modalidad || !duracionMinutos || !precio || !categoria) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const nuevoServicio = new Servicio({
  titulo,
  descripcion,
  modalidad,
  duracionMinutos,
  precio,
  categoria,
  plataformas: typeof plataformas === "string" ? JSON.parse(plataformas) : plataformas,
  terapeuta: req.terapeutaId, // <--- acá va como estaba antes
  imagen: imagen || null,
});

    await nuevoServicio.save();

    res.status(201).json({ ...nuevoServicio.toObject() });
  } catch (err) {
    console.error("Error al crear servicio:", err);
    res.status(500).json({ error: "Error al crear el servicio." });
  }
});

// ✅ Obtener todos los servicios con promedio y cantidad de reseñas
router.get("/", async (req, res) => {
  try {
    const servicios = await Servicio.find({ aprobado: true }).populate("terapeuta");

    if (!Array.isArray(servicios)) {
      console.error("❌ No se obtuvo un array de servicios:", servicios);
      return res.status(500).json({ error: "No se pudo obtener los servicios" });
    }

    const conRatings = await Promise.all(
      servicios.map(async (s) => {
        const resenas = await Resena.find({
          servicio: s._id,
          aprobado: true,
        }).select("puntaje");
        const suma = resenas.reduce((acc, r) => acc + (r.puntaje || 0), 0);
        const promedio = resenas.length ? (suma / resenas.length) : 0;

        const obj = s.toObject();
        obj.cantidadResenas = resenas.length;
        obj.promedioResenas = Number(promedio.toFixed(1));
        return obj;
      })
    );

    res.json(conRatings);
  } catch (err) {
    console.error("❌ Error al obtener los servicios:", err.message, err.stack);
    res.status(500).json({ error: "Error al obtener los servicios" });
  }
});

// ✅ Obtener servicios del terapeuta autenticado
router.get("/mis-servicios", verificarToken, async (req, res) => {
  try {
    const servicios = await Servicio.find({ terapeuta: req.terapeutaId });
    res.json(servicios);
  } catch (err) {
    console.error("Error al obtener tus servicios:", err);
    res.status(500).json({ error: "Error al obtener tus servicios" });
  }
});

// GET /api/servicios/publico/:slug
router.get("/publico/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const servicio = await Servicio.findOne({ slug }).populate(
      "terapeuta",
      "nombreCompleto"
    );

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const reseñas = await Resena.find({
      servicio: servicio._id,
      aprobado: true
    }).select("nombre comentario puntaje createdAt");

    const totalEstrellas = reseñas.reduce((acc, r) => acc + (r.puntaje || 0), 0);
    const promedioEstrellas = reseñas.length > 0 ? totalEstrellas / reseñas.length : 0;

    res.json({
      ...servicio.toObject(),
      duracion: servicio.duracionMinutos,
      terapeutaId: servicio.terapeuta?._id,
      horariosDisponibles: servicio.horariosDisponibles || [],
      plataformas: servicio.plataformas || [],
      reseñas,
      promedioEstrellas: Number(promedioEstrellas.toFixed(1)),
      totalReseñas: reseñas.length
    });

  } catch (err) {
    console.error("❌ Error al obtener servicio público:", err);
    res.status(500).json({ error: "Error al obtener el servicio público" });
  }
});

// ✅ Actualizar un servicio
router.put("/:id", verificarToken, async (req, res) => {
  try {
    const servicioExistente = await Servicio.findOne({
      _id: req.params.id,
      terapeuta: req.terapeutaId,
    });

    if (!servicioExistente) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const {
      titulo,
      descripcion,
      modalidad,
      duracionMinutos,
      precio,
      categoria,
      plataformas,
      imagen,
    } = req.body;

    if (
      !titulo?.trim() ||
      !descripcion?.trim() ||
      !modalidad ||
      duracionMinutos === undefined ||
      isNaN(duracionMinutos) ||
      !precio ||
      !categoria?.trim() ||
      !plataformas || plataformas.length === 0
    ) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    servicioExistente.titulo = titulo;
    servicioExistente.descripcion = descripcion;
    servicioExistente.modalidad = modalidad;
    servicioExistente.duracionMinutos = duracionMinutos;
    servicioExistente.precio = precio;
    servicioExistente.categoria = categoria;
    servicioExistente.plataformas = plataformas;

    if (imagen) {
      servicioExistente.imagen = imagen;
    }

    await servicioExistente.save();

    res.json({
      mensaje: "Servicio actualizado correctamente",
      servicio: servicioExistente,
    });
  } catch (err) {
    console.error("Error al actualizar servicio:", err);
    res.status(500).json({ error: "Error al actualizar el servicio." });
  }
});

// ✅ Eliminar un servicio
router.delete("/:id", verificarToken, async (req, res) => {
  try {
    const servicio = await Servicio.findOneAndDelete({
      _id: req.params.id,
      terapeuta: req.terapeutaId,
    });

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado o ya eliminado" });
    }

    await Terapeuta.findByIdAndUpdate(req.terapeutaId, {
      $pull: { servicios: { _id: servicio._id } },
    });

    res.json({ mensaje: "Servicio eliminado correctamente.", eliminadoId: servicio._id });
  } catch (err) {
    console.error("Error al eliminar servicio:", err);
    res.status(500).json({ error: "Error al eliminar el servicio." });
  }
});

module.exports = router;
