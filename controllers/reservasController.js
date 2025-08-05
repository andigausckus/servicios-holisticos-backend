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

    console.log("📥 Datos recibidos para nueva reserva con comprobante:");
    console.log({ servicioId, terapeutaId, precio, duracion });

    const nuevaReserva = new Reserva({
      servicioId,
      terapeuta: terapeutaId,
      fecha,
      hora,
      nombreUsuario,
      emailUsuario,
      comprobantePago,
      precio,
      duracion,
      estado: "confirmada",
    });

    await nuevaReserva.save();
    console.log("✅ Reserva confirmada:", nuevaReserva);

    const terapeuta = await Terapeuta.findById(terapeutaId);
    const servicio = await Servicio.findById(servicioId);

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

    let numeroWhatsApp = terapeuta?.whatsapp || "";
    numeroWhatsApp = numeroWhatsApp.replace(/\D/g, "");

    if (numeroWhatsApp.startsWith("15")) {
      numeroWhatsApp = "11" + numeroWhatsApp.slice(2);
    }

    if (numeroWhatsApp.length === 10) {
      numeroWhatsApp = `549${numeroWhatsApp}`;
    } else if (numeroWhatsApp.length === 11 && numeroWhatsApp.startsWith("54")) {
      numeroWhatsApp = `549${numeroWhatsApp.slice(2)}`;
    }

    await enviarEmailsReserva({
  nombreCliente,
  emailCliente,
  nombreTerapeuta: terapeuta?.nombreCompleto || "",
  emailTerapeuta: terapeuta?.email || "",
  nombreServicio: servicio?.titulo || "",
  fecha,
  hora,
  horaFinal,
  duracion,
  precio,
  telefonoTerapeuta: numeroWhatsApp,
  cbuTerapeuta: terapeuta?.cbu || "",          // 👈 asegurate de tenerlo en el modelo
  bancoTerapeuta: terapeuta?.banco || "",      // 👈 asegurate de tenerlo en el modelo
});

    // Programar envío de reseña
    const [horaFinalH, horaFinalM] = horaFinal.split(":").map(Number);
    const fechaHoraFin = new Date(fecha);
    fechaHoraFin.setHours(horaFinalH);
    fechaHoraFin.setMinutes(horaFinalM);

    const minutosDelay = process.env.NODE_ENV === "development" ? 1 : 30;
    fechaHoraFin.setMinutes(fechaHoraFin.getMinutes() + minutosDelay);

    const delayMs = fechaHoraFin.getTime() - Date.now();

    if (delayMs > 0) {
      console.log("⏳ Email de reseña programado en", Math.round(delayMs / 1000), "segundos");
      setTimeout(async () => {
        try {
          console.log("📬 Ejecutando envío de email de reseña...");
          await enviarEmailResena({
            nombreCliente: nombreUsuario,
            emailCliente: emailUsuario,
            nombreTerapeuta: terapeuta?.nombreCompleto || "",
            servicio: servicio?.titulo || "",
            reservaId: nuevaReserva._id.toString(),
          });
        } catch (err) {
          console.error("❌ Error al enviar email de reseña:", err);
        }
      }, delayMs);
    } else {
      console.log("⛔ Tiempo inválido para enviar reseña. delayMs:", delayMs);
    }

    res.status(201).json({
      mensaje: "Reserva creada exitosamente",
      reserva: nuevaReserva,
    });
  } catch (error) {
    console.error("❌ Error al crear reserva con comprobante:", error);
    res.status(500).json({ error: "Error al crear la reserva" });
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

    if (reserva.estado === "en_proceso" && creadaHace > 2) {
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

module.exports = {
  crearReservaConComprobante,
  obtenerReservas,
  aprobarReserva,
  cancelarReserva,
  crearReservaTemporal,
  verificarExpiracionReserva,
  obtenerEstadoReserva,
  obtenerReservasConfirmadas,
};
