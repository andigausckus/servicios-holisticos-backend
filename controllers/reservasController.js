const Reserva = require("../models/Reserva");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const { enviarEmailsReserva } = require("../utils/emailSender");
const mongoose = require("mongoose"); // asegurate de tener esto arriba

// Crear reserva con comprobante
const crearReservaConComprobante = async (req, res) => {
  try {
    const {
      reservaId, // ⚠️ ahora necesitamos este ID
      nombre,
      email,
      mensaje,
      comprobanteUrl,
    } = req.body;

    const reserva = await Reserva.findById(reservaId);
    if (!reserva || reserva.estado !== "en_proceso") {
      return res.status(404).json({ error: "Reserva temporal no encontrada o ya procesada" });
    }

    const servicio = await Servicio.findById(reserva.servicioId).lean();
    const terapeuta = await Terapeuta.findById(reserva.terapeutaId).lean();

    if (!servicio || !terapeuta) {
      return res.status(404).json({ error: "Datos incompletos" });
    }

    reserva.usuarioNombre = nombre;
    reserva.usuarioEmail = email;
    reserva.mensaje = mensaje;
    reserva.comprobanteUrl = comprobanteUrl;
    reserva.estado = "pendiente_de_aprobacion";

    await reserva.save();

    res.status(200).json({ ok: true, reservaId: reserva._id });
  } catch (error) {
    console.error("❌ Error al actualizar reserva con comprobante:", error);
    res.status(500).json({ error: "Error al procesar comprobante" });
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
    console.log("📥 Body recibido en reserva temporal:", req.body);
    const { servicioId, fecha, hora } = req.body;

    // ✅ Validación extra: que servicioId sea válido
    if (!mongoose.Types.ObjectId.isValid(servicioId)) {
      return res.status(400).json({ error: "ID de servicio inválido" });
    }

    // Verificar si ya hay una reserva activa en ese horario
    const reservaExistente = await Reserva.findOne({
      servicioId,
      fecha,
      hora,
      estado: { $in: ["en_proceso", "pendiente_de_aprobacion", "confirmada"] },
    });

    if (reservaExistente) {
      return res.status(409).json({ mensaje: "Ese horario ya fue reservado" });
    }

    // Obtener el terapeutaId desde el servicio
    const servicio = await Servicio.findById(servicioId);
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const nuevaTemporal = new Reserva({
      servicioId,
      terapeutaId: servicio.terapeutaId, // <--- acá el fix
      fecha,
      hora,
      estado: "en_proceso",
      creadaEn: new Date(),
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
  crearReservaTemporal, // <-- nuevo
};
