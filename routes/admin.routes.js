const express = require("express");
const router = express.Router();
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const Resena = require("../models/Resena");
const Reserva = require("../models/Reserva");
const { enviarEmailAprobacionTerapeuta } = require("../utils/emailSender");
const { enviarEmailResena } = require("../controllers/emailsController");


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
    const pendientes = await Servicio.find({ aprobado: false }) // solo filtro por aprobado
      .populate("terapeuta", "nombreCompleto") 
      .select("_id titulo precio imagen terapeuta");

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
  console.log("🚦 PUT /aprobar-terapeuta llamado");
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
  console.log("📧 Enviando email de aprobación a:", terapeuta.email);
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

  // Obtener reseñas pendientes
router.get("/resenas-pendientes", async (req, res) => {
  try {
    const reseñas = await Resena.find({ aprobado: false })
      .populate("servicio", "titulo")
      .populate("terapeuta", "nombre");
    res.json(reseñas);
  } catch (error) {
    console.error("❌ Error al obtener reseñas pendientes:", error);
    res.status(500).json({ error: "Error al obtener reseñas pendientes" });
  }
});

// DELETE reseña
router.delete("/rechazar-resena/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Resena.findByIdAndDelete(id);
    res.json({ message: "✅ Reseña rechazada y eliminada" });
  } catch (error) {
    console.error("❌ Error al rechazar reseña:", error);
    res.status(500).json({ error: "Error al rechazar reseña" });
  }
});


// 1️⃣ Obtener reservas pendientes de email de reseña
router.get("/emails-resenas-pendientes", async (req, res) => {
  try {
    const ahora = new Date();

    // Solo reservas confirmadas que ya finalizaron + delay y aún no se les envió email
    const reservasPendientes = await Reserva.find({
      estado: "confirmada",
      emailResenaEnviado: false,
      fechaHoraEnvioResena: { $lte: ahora },
    })
      .populate("terapeutaId", "nombreCompleto email")
      .populate("servicioId", "titulo duracion")
      .sort({ fechaHoraEnvioResena: 1 }); // las más antiguas primero

    res.json(reservasPendientes);
  } catch (error) {
    console.error("❌ Error al obtener reservas pendientes de reseña:", error);
    res.status(500).json({ error: "Error al obtener reservas pendientes de reseña" });
  }
});

// 2️⃣ Enviar email de reseña manualmente
router.post("/enviar-email-resena/:id", async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id)
      .populate("terapeutaId", "nombreCompleto email")
      .populate("servicioId", "titulo");

    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });

    // Validar que ya haya pasado el tiempo mínimo
    const ahora = new Date();
    if (reserva.fechaHoraEnvioResena > ahora) {
      return res.status(400).json({ error: "Aún no ha pasado el tiempo mínimo para enviar el email" });
    }

    // Llamada a la función que envía el email
    await enviarEmailResena({
      nombreCliente: reserva.nombreUsuario,
      emailCliente: reserva.emailUsuario,
      nombreTerapeuta: reserva.terapeutaId.nombreCompleto,
      idReserva: reserva._id,
    });

    // Marcar como enviado
    reserva.emailResenaEnviado = true;
    await reserva.save();

    res.json({ mensaje: "Email de reseña enviado correctamente" });
  } catch (error) {
    console.error("❌ Error al enviar email de reseña:", error);
    res.status(500).json({ error: "Error al enviar email de reseña" });
  }
});

module.exports = router;
