import mongoose from "mongoose";

import Reserva from "../models/Reserva.js";
import Terapeuta from "../models/Terapeuta.js";
import Servicio from "../models/Servicio.js";
import {
  enviarEmailsReserva,
  enviarEmailConfirmacionCliente,
} from "../utils/emailSender.js";

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

    console.log("🧪 Datos recibidos en el backend:", {
      servicioId,
      terapeutaId,
      fecha,
      hora,
      nombreUsuario,
      emailUsuario,
      comprobantePago,
      precio,
      duracion,
    });

    console.log("📦 Objeto que se envía a mongoose:", {
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

    const nuevaReserva = new Reserva({
  servicioId,
  terapeuta: new mongoose.Types.ObjectId(terapeutaId),
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

    // 🔍 Buscar datos del terapeuta y servicio para los emails
    const servicio = await Servicio.findById(servicioId);
    const terapeuta = await Terapeuta.findById(terapeutaId);
    console.log("🧑‍⚕️ Terapeuta encontrado:", terapeuta);

    // ⏱️ Calcular hora final
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

    // 📧 Enviar emails tanto al cliente como al terapeuta
let numeroWhatsApp = terapeuta?.whatsapp || "";

// 🔧 Limpiar y formatear número para WhatsApp (Argentina)
numeroWhatsApp = numeroWhatsApp.replace(/\D/g, ""); // quitar todo lo que no sea número

if (numeroWhatsApp.startsWith("15")) {
  numeroWhatsApp = "11" + numeroWhatsApp.slice(2);
}

if (numeroWhatsApp.length === 10) {
  numeroWhatsApp = `549${numeroWhatsApp}`;
} else if (numeroWhatsApp.length === 11 && numeroWhatsApp.startsWith("54")) {
  numeroWhatsApp = `549${numeroWhatsApp.slice(2)}`;
}

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
});

    console.log("✅ Emails enviados correctamente");

  // ⏰ Programar envío de email de reseña
const { enviarEmailResena } = require("../utils/emailSender");

const [horaFinalH, horaFinalM] = horaFinal.split(":").map(Number);
const fechaHoraFin = new Date(fecha);
fechaHoraFin.setHours(horaFinalH);
fechaHoraFin.setMinutes(horaFinalM);

// En desarrollo: enviar a los 1 minuto
const minutosDelay = process.env.NODE_ENV === "development" ? 1 : 30;
fechaHoraFin.setMinutes(fechaHoraFin.getMinutes() + minutosDelay);

const delayMs = fechaHoraFin.getTime() - Date.now();

if (delayMs > 0) {
  setTimeout(() => {
    enviarEmailResena({
      nombreCliente: nombreUsuario,
      emailCliente: emailUsuario,
      nombreTerapeuta: terapeuta?.nombreCompleto || "",
      servicio: servicio?.titulo || "",
      reservaId: nuevaReserva._id.toString(),
    });
  }, delayMs);
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
