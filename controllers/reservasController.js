const Reserva = require("../models/Reserva");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const { enviarEmailsReserva } = require("../utils/emailSender");
const mongoose = require("mongoose"); // asegurate de tener esto arriba

// Crear reserva con comprobante
const crearReservaConComprobante = async (req, res) => {
  try {
    const {
      servicioId,
      fecha,
      hora,
      nombre,
      email,
      mensaje,
      comprobanteUrl,
    } = req.body;
    
console.log("📌 Buscando servicio con ID:", servicioId);

const servicio = await Servicio.findById(servicioId).lean();
if (!servicio) {
  return res.status(404).json({ error: "Servicio no encontrado" });
}

const terapeuta = await Terapeuta.findOne({
  $or: [
    { servicios: servicio._id },
    { 'servicios._id': servicio._id }
  ]
}).lean();

if (!terapeuta) {
  return res.status(404).json({ error: "Terapeuta no encontrado para este servicio" });
}

console.log("✅ Servicio y terapeuta encontrados");
    
console.log("✅ Servicio encontrado:", servicio);
    
    const nuevaReserva = new Reserva({
      servicioId,
      terapeutaId: terapeuta._id,
      usuarioNombre: nombre,
      usuarioEmail: email,
      terapeutaNombre: terapeuta.nombre,
      terapeutaEmail: terapeuta.email,
      fecha,
      hora,
      mensaje,
      comprobanteUrl,
      estado: "pendiente_de_aprobacion",
    });

    await nuevaReserva.save();
    res.status(201).json({ ok: true, reservaId: nuevaReserva._id });
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({ error: "Error al crear reserva con comprobante" });
  }
};

// Obtener reservas (admin)
const obtenerReservas = async (req, res) => {
  try {
    const reservas = await Reserva.find().sort({ fecha: -1 });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener reservas" });
  }
};

// Aprobar (confirmar) una reserva y enviar emails
const aprobarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada" });

    const servicio = await Servicio.findById(reserva.servicioId).lean();
    const terapeuta = await Terapeuta.findById(reserva.terapeutaId).lean();

    if (!servicio || !terapeuta) {
      return res.status(404).json({ mensaje: "Datos incompletos" });
    }

    reserva.estado = "confirmada";
    await reserva.save();

    await enviarEmailsReserva({
      nombreCliente: reserva.usuarioNombre,
      emailCliente: reserva.usuarioEmail,
      nombreTerapeuta: terapeuta.nombre,
      emailTerapeuta: terapeuta.email,
      whatsappTerapeuta: terapeuta.whatsapp,
      bancoTerapeuta: terapeuta.banco,
      cbuTerapeuta: terapeuta.cbu,
      nombreServicio: servicio.titulo,
      fecha: reserva.fecha,
      hora: reserva.hora,
      duracion: servicio.duracion || "60min",
      precio: servicio.precio || 0,
    });

    res.json({ mensaje: "Reserva confirmada y emails enviados", reserva });
  } catch (error) {
    console.error("❌ Error al confirmar reserva:", error);
    res.status(500).json({ mensaje: "Error al confirmar", error });
  }
};

// Cancelar reserva (admin o usuario)
const cancelarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    if (!reserva) return res.status(404).json({ mensaje: "Reserva no encontrada" });

    reserva.estado = "cancelada";
    await reserva.save();

    res.json({ mensaje: "Reserva cancelada", reserva });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cancelar", error });
  }
};

// Crear reserva temporal al hacer clic en "Reservar sesión"
const crearReservaTemporal = async (req, res) => {
  try {
    const { servicioId, fecha, hora } = req.body;

    // Verificamos si ya hay una reserva activa para ese servicio/fecha/hora
    const reservaExistente = await Reserva.findOne({
      servicioId,
      fecha,
      hora,
      estado: { $in: ["en_proceso", "pendiente_de_aprobacion", "confirmada"] },
    });

    if (reservaExistente) {
      return res.status(409).json({ mensaje: "Ese horario ya fue reservado" });
    }

    const nuevaTemporal = new Reserva({
      servicioId,
      fecha,
      hora,
      estado: "en_proceso",
      creadaEn: new Date(), // obligatorio para limpieza automática
    });

    await nuevaTemporal.save();
    res.status(201).json({ ok: true, reservaId: nuevaTemporal._id });
  } catch (error) {
    console.error("❌ Error al crear reserva temporal:", error);
    res.status(500).json({ error: "Error al crear reserva temporal" });
  }
};

module.exports = {
  crearReservaConComprobante,
  obtenerReservas,
  aprobarReserva,
  cancelarReserva,
};
