const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const Terapeuta = require("../models/Terapeuta");
const jwt = require("jsonwebtoken");
const Bloqueo = require("../models/Bloqueo");
const Reserva = require("../models/Reserva");
const mongoose = require("mongoose"); // asegurate de tener esta línea al comienzo del archivo

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
  $push: {
    servicios: {
      _id: nuevoServicio._id,
      titulo: nuevoServicio.titulo
    }
  },
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
    const servicios = await Servicio.find().populate("terapeuta");

if (!Array.isArray(servicios)) {
  console.error("❌ No se obtuvo un array de servicios:", servicios);
  return res.status(500).json({ error: "No se pudo obtener los servicios" });
}
console.log("🟡 Servicios obtenidos:", servicios);
res.json(servicios);

  } catch (err) {
    console.error("❌ Error real al obtener los servicios:", err.message, err.stack);
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

// ✅ Obtener un servicio público por ID
router.get("/publico/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID de servicio inválido" });
  }

  try {
    const servicio = await Servicio.findById(id).populate("terapeuta", "nombreCompleto");
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const bloqueos = await Bloqueo.find({ servicioId: servicio._id });
    const reservas = await Reserva.find({ servicioId: servicio._id });

const horariosConEstado = Array.isArray(servicio.horariosDisponibles)
  ? servicio.horariosDisponibles
      .filter((dia) => dia && Array.isArray(dia.horariosFijos))
      .map((dia) => {
        const horariosFijosConEstado = dia.horariosFijos
          .filter((h) => h.desde && h.hasta)
          .map((horario) => {
            const estaReservado = reservas.some(
              (r) => r.fecha === dia.fecha && r.hora === horario.desde
            );
            const estaBloqueado = bloqueos.some(
              (b) => b.fecha === dia.fecha && b.hora === horario.desde
            );

            let estado = "disponible";
            if (estaReservado) estado = "reservado";
            else if (estaBloqueado) estado = "en_proceso";

            return {
              desde: horario.desde,
              hasta: horario.hasta,
              estado,
            };
          });

        return {
          fecha: dia.fecha,
          horariosFijos: horariosFijosConEstado,
        };
      })
  : [];
    
    res.json({
      ...servicio.toObject(),
      horariosDisponibles: horariosConEstado,
      plataformas: servicio.plataformas || [],
    });

  } catch (err) {
    console.error("❌ Error al obtener servicio público:", err);
    res.status(500).json({ error: "Error al obtener el servicio público" });
  }
});


// 🧹 Limpiar horarios inválidos (temporal)
router.post("/admin/limpiar-horarios-invalidos", async (req, res) => {
  const servicios = await Servicio.find();
  let totalLimpiados = 0;

  for (const servicio of servicios) {
    let cambiado = false;

    const nuevosHorarios = (servicio.horariosDisponibles || []).map(dia => {
      const horariosFijos = (dia.horariosFijos || []).filter(h => h.desde && h.hasta);
      if (horariosFijos.length !== dia.horariosFijos.length) {
        cambiado = true;
      }
      return { ...dia, horariosFijos };
    });

    if (cambiado) {
      servicio.horariosDisponibles = nuevosHorarios;
      await servicio.save();
      totalLimpiados++;
    }
  }

  res.json({ mensaje: "Horarios inválidos eliminados", serviciosActualizados: totalLimpiados });
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
