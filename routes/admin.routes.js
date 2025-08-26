const express = require("express");
const router = express.Router();
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const Resena = require("../models/Resena");
const Reserva = require("../models/Reserva");
const { enviarEmailAprobacionTerapeuta } = require("../utils/emailSender");


// --- TERAPEUTAS ---

// Obtener terapeutas pendientes
router.get("/terapeutas-pendientes", async (req, res) => {
  try {
    const pendientes = await Terapeuta.find({ estado: "pendiente" });
    res.json(pendientes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener terapeutas", error });
  }
});

// Aprobar terapeuta
router.put("/aprobar-terapeuta/:id", async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findByIdAndUpdate(
      req.params.id,
      { estado: "aprobado" },
      { new: true }
    );
    res.json({ mensaje: "✅ Terapeuta aprobado", terapeuta });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al aprobar terapeuta", error });
  }
});

// Rechazar terapeuta
router.put("/rechazar-terapeuta/:id", async (req, res) => {
  try {
    const terapeuta = await Terapeuta.findByIdAndUpdate(
      req.params.id,
      { estado: "rechazado" },
      { new: true }
    );
    res.json({ mensaje: "❌ Terapeuta rechazado", terapeuta });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al rechazar terapeuta", error });
  }
});

// --- SERVICIOS PENDIENTES ---
router.get("/servicios-pendientes", async (req, res) => {
  try {
    const terapeutas = await Terapeuta.find({ 
      "servicios": { 
        $elemMatch: { 
          aprobado: false, 
          rechazado: { $ne: true }  // 🔹 ignorar los rechazados
        } 
      }
    }).populate("servicios"); // 🔹 traemos todos los datos del servicio real

    const pendientes = [];

    terapeutas.forEach(t => {
      t.servicios.forEach(s => {
        if (!s.aprobado && s.rechazado !== true) {
          pendientes.push({
            _id: s._id,
            titulo: s.titulo,
            precio: s.precio,
            imagen: s.imagen || "",
            terapeuta: { 
              _id: t._id, 
              nombreCompleto: t.nombreCompleto 
            }
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

    // 1️⃣ Actualizamos el servicio dentro del array del terapeuta
    const terapeuta = await Terapeuta.findOne({ "servicios._id": req.params.id });
    if (!terapeuta) return res.status(404).json({ mensaje: "Servicio no encontrado" });

    const servicio = terapeuta.servicios.id(req.params.id);
    servicio.aprobado = aprobado;
    servicio.rechazado = false;

    await terapeuta.save();

    // 2️⃣ Sincronizamos con la colección Servicios
    const ServicioModel = require("../models/Servicio"); // ajusta la ruta
    await ServicioModel.findByIdAndUpdate(
      req.params.id,
      {
        aprobado: aprobado,
        rechazado: false,
        titulo: servicio.titulo,
        descripcion: servicio.descripcion,
        modalidad: servicio.modalidad,
        duracionMinutos: servicio.duracionMinutos,
        precio: servicio.precio,
        categoria: servicio.categoria,
        plataformas: servicio.plataformas,
        imagen: servicio.imagen,
        slug: servicio.slug,
        terapeuta: servicio.terapeuta,
        horariosDisponibles: servicio.horariosDisponibles,
      },
      { new: true, upsert: true }
    );

    res.json({ mensaje: "✅ Servicio aprobado y sincronizado", servicio });
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


router.put("/aprobar-terapeuta/:id", async (req, res) => {
  try {
    const { aprobado } = req.body;
    const terapeuta = await Terapeuta.findByIdAndUpdate(
      req.params.id,
      { aprobado },
      { new: true }
    );

    if (!terapeuta) {
      return res.status(404).json({ message: "Terapeuta no encontrado" });
    }

    // Si fue aprobado, mandamos el email
    if (aprobado) {
      await enviarEmailAprobacionTerapeuta({
        nombreCompleto: terapeuta.nombreCompleto,
        emailTerapeuta: terapeuta.email,
      });
    }

    res.json(terapeuta);
  } catch (error) {
    console.error("❌ Error al aprobar terapeuta:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
