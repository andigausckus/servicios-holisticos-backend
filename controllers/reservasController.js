const Reserva = require("../models/Reserva");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const { enviarEmailsReserva } = require("../utils/emailSender");

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

    const servicio = await Servicio.findById(servicioId).lean();
    const terapeuta = await Terapeuta.findOne({ "servicios._id": servicioId }).lean();

    if (!servicio || !terapeuta) {
      return res.status(404).json({ error: "Servicio o terapeuta no encontrado" });
    }

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

module.exports = {
  crearReservaConComprobante,
  obtenerReservas,
  aprobarReserva,
  cancelarReserva,
};
