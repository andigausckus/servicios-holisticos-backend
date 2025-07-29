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

    if (!mongoose.Types.ObjectId.isValid(servicioId)) {
      return res.status(400).json({ error: "ID de servicio inválido" });
    }

    const reservaExistente = await Reserva.findOne({
      servicioId,
      fecha,
      hora,
      estado: { $in: ["en_proceso", "pendiente_de_aprobacion", "confirmada"] },
    });

    if (reservaExistente) {
      return res.status(409).json({ mensaje: "Ese horario ya fue reservado" });
    }

    const servicio = await Servicio.findById(servicioId).lean();
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    // 👇 Campo correcto del modelo
    const terapeutaId = servicio.terapeuta;

    const nuevaTemporal = new Reserva({
      servicioId,
      terapeutaId,
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

// Verificar si la reserva en_proceso ya expiró (más de 2 minutos)
const verificarExpiracionReserva = async (req, res) => {
  try {
    const { servicioId, fecha, hora } = req.query;

    const reserva = await Reserva.findOne({
      servicioId,
      fecha,
      hora,
      estado: "en_proceso",
    });

    if (!reserva) {
      return res.json({ disponible: true }); // Si no hay reserva, está libre
    }

    const ahora = new Date();
    const diferenciaMinutos = (ahora - reserva.creadaEn) / (1000 * 60);

    if (diferenciaMinutos > 2) {
      await Reserva.deleteOne({ _id: reserva._id });
      return res.json({ disponible: true }); // Se venció, está libre
    }

    res.json({ disponible: false }); // Aún está en proceso
  } catch (error) {
    console.error("❌ Error al verificar expiración:", error);
    res.status(500).json({ error: "Error al verificar expiración" });
  }
};

const obtenerEstadoReserva = async (req, res) => {
  try {
    const { servicioId, fecha, hora } = req.query;
    const reserva = await Reserva.findOne({ servicioId, fecha, hora });
    if (!reserva) {
      return res.json({ estado: 'disponible' });
    }
    if (reserva.estado === 'en_proceso') {
      return res.json({ estado: 'temporalmente-bloqueado' });
    }
    return res.json({ estado: reserva.estado });
  } catch (error) {
    console.error('Error al obtener estado de reserva:', error);
    res.status(500).json({ error: 'Error al obtener estado de reserva' });
  }
};

const obtenerBloqueosYReservas = async (req, res) => {
  try {
    const servicioId = req.params.id;

    console.log("➡️ Obteniendo bloqueos y reservas para servicio:", servicioId);

    const reservas = await Reserva.find({ servicio: servicioId, estado: "confirmada" });
    const bloqueos = await Reserva.find({ servicio: servicioId, estado: "en_proceso" });

    res.json({
      reservas,
      bloqueos,
    });
  } catch (error) {
    console.error("Error al obtener bloqueos + reservas:", error);
    res.status(500).json({ error: "Error al obtener bloqueos y reservas" });
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
};