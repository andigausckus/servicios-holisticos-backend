const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const Terapeuta = require("../models/Terapeuta");
const jwt = require("jsonwebtoken");
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

    const terapeuta = await Terapeuta.findById(req.user.id);
const nuevoServicio = new Servicio({
  titulo,
  descripcion,
  modalidad,
  duracionMinutos,
  precio,
  categoria,
  plataformas: typeof plataformas === "string" ? JSON.parse(plataformas) : plataformas,
  terapeuta: terapeuta._id,
  imagen: imagen || null,
  aprobado: false,
});

    await nuevoServicio.save();
    res.status(201).json({ _id: nuevoServicio._id });

  } catch (err) {
    console.error("Error al crear servicio:", err);
    res.status(500).json({ error: "Error al crear el servicio." });
  }
});

// ✅ Obtener todos los servicios aprobados
router.get("/", async (req, res) => {
  try {
    const terapeutas = await Terapeuta.find();
    const serviciosAprobados = [];

    terapeutas.forEach(t => {
      if (Array.isArray(t.servicios)) {
        t.servicios.forEach(s => {
          if (s.aprobado && !s.rechazado) {
            serviciosAprobados.push({
              _id: s._id,
              titulo: s.titulo,
              descripcion: s.descripcion,
              modalidad: s.modalidad,
              duracionMinutos: s.duracionMinutos,
              precio: s.precio,
              categoria: s.categoria || "Sin categoría",
              plataformas: s.plataformas || [],
              imagen: s.imagen || "",
              slug: s.slug || "",
              createdAt: s.createdAt,
              terapeuta: {
                _id: t._id,
                nombreCompleto: t.nombreCompleto
              },
              promedioResenas: s.promedioResenas || 0,
              cantidadResenas: s.cantidadResenas || 0
            });
          }
        });
      }
    });

    res.json(serviciosAprobados);

  } catch (err) {
    console.error("❌ Error al obtener servicios:", err);
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

// ✅ Obtener un servicio privado por ID
router.get("/:id", verificarToken, async (req, res) => {
  try {
    const servicio = await Servicio.findOne({
      _id: req.params.id,
      terapeuta: req.terapeutaId,
    });

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    res.json(servicio);

  } catch (err) {
    console.error("Error al obtener servicio:", err);
    res.status(500).json({ error: "Error al obtener el servicio" });
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

    res.json({ mensaje: "Servicio actualizado correctamente", servicio: servicioExistente });

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

    res.json({ mensaje: "Servicio eliminado correctamente.", eliminadoId: servicio._id });

  } catch (err) {
    console.error("Error al eliminar servicio:", err);
    res.status(500).json({ error: "Error al eliminar el servicio" });
  }
});

// ✅ Guardar o actualizar horarios del servicio
router.put("/:id/horarios", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { horarios } = req.body;

    if (!Array.isArray(horarios)) {
      return res.status(400).json({ error: "Horarios inválidos" });
    }

    await Servicio.findByIdAndUpdate(id, { horariosDisponibles: horarios });
    res.json({ mensaje: "Horarios guardados correctamente" });

  } catch (error) {
    console.error("Error al guardar horarios:", error);
    res.status(500).json({ error: "Error al guardar horarios" });
  }
});

// ✅ Agregar reseña a un servicio
router.post("/:id/resena", async (req, res) => {
  try {
    const { nombre, comentario, puntaje } = req.body;

    const servicio = await Servicio.findById(req.params.id);
    if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

    const nuevaResena = new Resena({
      servicio: servicio._id,
      terapeuta: servicio.terapeuta,
      nombre,
      comentario,
      puntaje
    });

    await nuevaResena.save();
    res.status(201).json({ ok: true, resena: nuevaResena });

  } catch (err) {
    console.error("Error al agregar reseña:", err);
    res.status(500).json({ error: "Error al agregar la reseña" });
  }
});

module.exports = router;
