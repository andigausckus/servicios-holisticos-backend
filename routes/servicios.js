const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const Terapeuta = require("../models/Terapeuta");
const jwt = require("jsonwebtoken");
const Bloqueo = require("../models/Bloqueo");
const Reserva = require("../models/Reserva");

// Middleware JWT
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.terapeutaId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

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
      terapeuta: req.terapeutaId,
      imagen: imagen || null,
    });

    await nuevoServicio.save();

    await Terapeuta.findByIdAndUpdate(req.terapeutaId, {
      $push: { servicios: nuevoServicio._id },
    });

    res.status(201).json({ id: nuevoServicio._id });
  } catch (err) {
    console.error("Error al crear servicio:", err);
    res.status(500).json({ error: "Error al crear el servicio." });
  }
});

// ✅ Obtener todos los servicios
router.get("/", async (req, res) => {
  try {
    const servicios = await Servicio.find().populate("terapeuta", "nombreCompleto ubicacion");
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los servicios" });
  }
});

// 🔥 Ruta temporal para borrar todos los servicios
router.delete("/borrar-todos", async (req, res) => {
  try {
    await Servicio.deleteMany({});
    res.json({ mensaje: "Todos los servicios fueron eliminados" });
  } catch (error) {
    console.error("Error al borrar servicios:", error);
    res.status(500).json({ error: "Error al borrar servicios" });
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

// ✅ Obtener un servicio público por ID
router.get("/publico/:id", async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id).populate("terapeuta", "nombreCompleto");
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const bloqueos = await Bloqueo.find({ servicioId: servicio._id });
    const reservas = await Reserva.find({ servicioId: servicio._id });

    const horariosConEstado = (servicio.horariosDisponibles || []).map((dia) => {
      const horariosFijosConEstado = (dia.horariosFijos || [])
        .filter(h => h.desde && h.hasta) // ✅ filtro agregado
        .map((horario) => {
          const estaReservado = reservas.some(
            (r) => r.fecha === dia.fecha && r.hora === horario.desde
          );
          const estaBloqueado = bloqueos.some(
            (b) => b.fecha === dia.fecha && b.hora === horario.desde
          );

          let estado = "disponible";
          if (estaReservado) estado = "reservado";
          else if (estaBloqueado) estado = "no_disponible";

          return {
            ...horario,
            estado,
          };
        });

      return {
        fecha: dia.fecha,
        horariosFijos: horariosFijosConEstado,
      };
    });

    res.json({
      ...servicio.toObject(),
      horariosDisponibles: horariosConEstado,
    });

  } catch (err) {
    console.error("❌ Error al obtener servicio público:", err);
    res.status(500).json({ error: "Error al obtener el servicio público" });
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
    res.json({ mensaje: "Servicio actualizado correctamente." });
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
      return res.status(404).json({ error: "Servicio no encontrado o no autorizado" });
    }

    await Terapeuta.findByIdAndUpdate(req.terapeutaId, {
      $pull: { servicios: servicio._id },
    });

    res.json({ mensaje: "Servicio eliminado correctamente." });
  } catch (err) {
    console.error("Error al eliminar servicio:", err);
    res.status(500).json({ error: "Error al eliminar el servicio." });
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

    await Servicio.findByIdAndUpdate(id, {
      horariosDisponibles: horarios,
    });

    res.json({ mensaje: "Horarios guardados correctamente" });
  } catch (error) {
    console.error("Error al guardar horarios:", error);
    res.status(500).json({ error: "Error al guardar horarios" });
  }
});

module.exports = router;
