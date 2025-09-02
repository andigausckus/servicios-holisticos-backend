const mongoose = require("mongoose");
const Reserva = require("../models/Reserva");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const {
enviarEmailsReserva,
enviarEmailConfirmacionCliente,
enviarEmailResena,
} = require("../utils/emailSender");

const crearReservaConComprobante = async (req, res) => {
  try {
    const {
      servicioId,
      terapeutaId,
      fecha,
      hora,
      nombreUsuario,
      emailUsuario,
      comprobantePago,
      precio,
      duracion,
    } = req.body;

    if (!nombreUsuario || !emailUsuario || !comprobantePago) {
      return res.status(400).json({
        error: "Todos los campos son obligatorios: nombre, email y comprobante.",
      });
    }

   // Calcular fechaHoraEnvioResena para enviar reseña después del delay
const [h, m] = hora.split(":").map(Number);
const fechaParts = fecha.split("-").map(Number); // YYYY-MM-DD
const duracionMinutos = duracion || 60;
const delayMinutos = process.env.NODE_ENV === "production" ? 30 : 2;

// 👇 definir fechaHoraEnvioResena en UTC antes de crear la reserva
const fechaHoraEnvioResena = new Date(Date.UTC(
  fechaParts[0],
  fechaParts[1] - 1,
  fechaParts[2],
  h,
  m + duracionMinutos + delayMinutos
));

// Crear reserva
const nuevaReserva = new Reserva({
  servicioId,
  terapeutaId,
  fecha,
  hora,
  nombreUsuario,
  emailUsuario,
  comprobantePago,
  precio,
  duracion,
  estado: "confirmada",
  reseñaEnviada: false,
  emailResenaEnviado: false,
  fechaHoraEnvioResena, // ✅ ya definida en UTC
});

await nuevaReserva.save();
console.log("✅ Reserva confirmada:", nuevaReserva);

    // Traer info de terapeuta y servicio
    const terapeuta = await Terapeuta.findById(terapeutaId);
    const servicio = await Servicio.findById(servicioId);
    servicio.duracion = servicio.duracion || duracion;

    // Calcular hora final para email de confirmación
    const calcularHoraFinal = (horaInicio, duracionMinutos) => {
      const [h, m] = horaInicio.split(":").map(Number);
      const fecha = new Date();
      fecha.setHours(h);
      fecha.setMinutes(m + duracionMinutos);
      const hh = fecha.getHours().toString().padStart(2, "0");
      const mm = fecha.getMinutes().toString().padStart(2, "0");
      return `${hh}:${mm}`;
    };
    const horaFinal = calcularHoraFinal(hora, duracion);

    // Formatear número de WhatsApp del terapeuta
    let numeroWhatsApp = terapeuta?.whatsapp || "";
    numeroWhatsApp = numeroWhatsApp.replace(/\D/g, "");
    if (numeroWhatsApp.startsWith("15")) numeroWhatsApp = "11" + numeroWhatsApp.slice(2);
    if (numeroWhatsApp.length === 10) numeroWhatsApp = `549${numeroWhatsApp}`;
    else if (numeroWhatsApp.length === 11 && numeroWhatsApp.startsWith("54"))
      numeroWhatsApp = `549${numeroWhatsApp.slice(2)}`;

    // Enviar emails de confirmación
    await enviarEmailsReserva({
      nombreCliente: nombreUsuario,
      emailCliente: emailUsuario,
      nombreTerapeuta: terapeuta?.nombreCompleto || "",
      emailTerapeuta: terapeuta?.email || "",
      nombreServicio: servicio?.titulo || "",
      fecha,
      hora,
      horaFinal,
      duracion,
      precio,
      telefonoTerapeuta: numeroWhatsApp,
      cbuTerapeuta: terapeuta?.cbuCvu || "",
      bancoTerapeuta: terapeuta?.bancoOBilletera || "",
    });

    console.log("✅ Emails de confirmación enviados");

    return res.status(201).json({
      mensaje: "Reserva creada exitosamente",
      reserva: nuevaReserva,
    });
  } catch (error) {
    console.error("❌ Error al crear reserva:", error.message);
    return res.status(500).json({ error: "Error al crear reserva" });
  }
};

const obtenerReservas = async (req, res) => {
try {
const reservas = await Reserva.find();
res.json(reservas);
} catch (error) {
console.error("Error al obtener reservas:", error);
res.status(500).json({ error: "Error al obtener reservas" });
}
};

const aprobarReserva = async (req, res) => {
try {
const reservaId = req.params.id;
const reserva = await Reserva.findByIdAndUpdate(reservaId, { estado: "confirmada" }, { new: true });
if (!reserva) {
return res.status(404).json({ error: "Reserva no encontrada" });
}
res.json({ mensaje: "Reserva aprobada", reserva });
} catch (error) {
console.error("Error al aprobar reserva:", error);
res.status(500).json({ error: "Error al aprobar reserva" });
}
};

const cancelarReserva = async (req, res) => {
try {
const reservaId = req.params.id;
const reserva = await Reserva.findByIdAndUpdate(reservaId, { estado: "cancelada" }, { new: true });
if (!reserva) {
return res.status(404).json({ error: "Reserva no encontrada" });
}
res.json({ mensaje: "Reserva cancelada", reserva });
} catch (error) {
console.error("Error al cancelar reserva:", error);
res.status(500).json({ error: "Error al cancelar reserva" });
}
};

const crearReservaTemporal = async (req, res) => {
try {
const { servicioId, fecha, hora } = req.body;

const yaExiste = await Reserva.findOne({  
  servicioId,  
  fecha,  
  hora,  
  estado: { $in: ["en_proceso", "confirmada"] },  
});  

if (yaExiste) {  
  return res.status(400).json({ error: "Ese turno ya está ocupado o en proceso" });  
}  

const nuevaReserva = new Reserva({  
  servicioId,  
  fecha,  
  hora,  
  estado: "en_proceso",  
});  

await nuevaReserva.save();  

res.status(201).json({ mensaje: "Reserva temporal creada", reservaId: nuevaReserva._id });

} catch (error) {
console.error("Error al crear reserva temporal:", error);
res.status(500).json({ error: "Error al crear reserva temporal" });
}
};

const verificarExpiracionReserva = async (req, res) => {
try {
const { reservaId } = req.body;
const reserva = await Reserva.findById(reservaId);

if (!reserva) {  
  return res.status(404).json({ error: "Reserva no encontrada" });  
}  

const ahora = new Date();  
const creadaHace = (ahora - reserva.createdAt) / 1000 / 60; // minutos  

if (reserva.estado === "en_proceso" && creadaHace > 5) {  
  await Reserva.findByIdAndDelete(reservaId);  
  return res.json({ mensaje: "Reserva temporal eliminada por vencimiento" });  
}  

res.json({ mensaje: "Reserva sigue activa", reserva });

} catch (error) {
console.error("Error al verificar expiración:", error);
res.status(500).json({ error: "Error al verificar expiración" });
}
};

const obtenerEstadoReserva = async (req, res) => {
try {
const { servicioId, fecha, hora } = req.query;
const reserva = await Reserva.findOne({ servicioId, fecha, hora });
if (!reserva) {
return res.json({ estado: "disponible" });
}
if (reserva.estado === "en_proceso") {
return res.json({ estado: "temporalmente-bloqueado" });
}
return res.json({ estado: reserva.estado });
} catch (error) {
console.error("Error al obtener estado de reserva:", error);
res.status(500).json({ error: "Error al obtener estado de reserva" });
}
};

const obtenerReservasConfirmadas = async (req, res) => {
try {
const reservas = await Reserva.find({ estado: "confirmada" }).sort({ createdAt: -1 });
res.json(reservas);
} catch (error) {
console.error("Error al obtener reservas confirmadas:", error);
res.status(500).json({ error: "Error al obtener reservas confirmadas" });
}
};

const enviarResenasPendientes = async (req, res) => {
  try {
    const ahora = new Date();
    console.log("📅 Ejecutando enviarResenasPendientes - ahora:", ahora.toISOString());

    // Buscamos reservas confirmadas, que aún no tengan reseña enviada
    // y cuyo momento de envío ya pasó
    const reservas = await Reserva.find({
      estado: "confirmada",
      reseñaEnviada: false,
      fechaHoraEnvioResena: { $lte: ahora }
    })
      .populate("terapeutaId")
      .populate("servicioId");

    console.log(`🔍 Reservas encontradas pendientes de reseña: ${reservas.length}`);

    if (!reservas.length) {
      return res.status(200).json({ mensaje: "No hay reseñas pendientes por enviar." });
    }

    let enviadas = 0;

    for (const reserva of reservas) {
      try {
        if (!reserva.nombreUsuario || !reserva.emailUsuario) {
          console.log(`⚠️ Reserva ${reserva._id} sin datos de usuario, no se envía reseña`);
          continue;
        }

        console.log(`✉️ Enviando email de reseña para reserva ${reserva._id} a ${reserva.emailUsuario}`);
        await enviarEmailResena({
          nombreCliente: reserva.nombreUsuario,
          emailCliente: reserva.emailUsuario,
          nombreTerapeuta: reserva.terapeutaId?.nombreCompleto || "",
          servicio: reserva.servicioId?.titulo || "",
          idReserva: reserva._id.toString(),
        });

        reserva.reseñaEnviada = true;
        reserva.emailResenaEnviado = true;
        await reserva.save();

        console.log(`✅ Email de reseña enviado y marca actualizada en DB para reserva ${reserva._id}`);
        enviadas++;

      } catch (error) {
        console.error(`❌ Error enviando reseña para reserva ${reserva._id}:`, error.message);
      }
    }

    res.status(200).json({ mensaje: `Se enviaron ${enviadas} reseñas.` });

  } catch (error) {
    console.error("❌ Error al procesar reseñas pendientes:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
crearReservaConComprobante,
obtenerReservas,
aprobarReserva,
cancelarReserva,
crearReservaTemporal,
verificarExpiracionReserva,
obtenerEstadoReserva,
obtenerReservasConfirmadas,
enviarResenasPendientes,
};
