const Reserva = require("../models/Reserva");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const { enviarEmailsReserva } = require("../utils/emailSender");
const mongoose = require("mongoose");

const crearReservaConComprobante = async (req, res) => {
  try {

    const { nombre, email, comprobante } = req.body;

if (!nombre || !email || !comprobante) {
  return res.status(400).json({ error: "Todos los campos son obligatorios: nombre, email y comprobante." });
}
    
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

    console.log("📥 Datos recibidos para nueva reserva con comprobante:");
    console.log({ servicioId, terapeutaId, precio, duracion });

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
    });

    await nuevaReserva.save();

    const servicio = await Servicio.findById(servicioId).populate("terapeuta");
    if (servicio && servicio.terapeutaId && servicio.terapeutaId.email) {
      const terapeutaEmail = servicio.terapeutaId.email;
      await enviarEmailsReserva(terapeutaEmail, {
        nombreUsuario,
        emailUsuario,
        fecha,
        hora,
        servicio: servicio.nombre,
      });
    }

    res.status(201).json({ mensaje: "Reserva creada exitosamente", reserva: nuevaReserva });
  } catch (error) {
    console.error("Error al crear reserva con comprobante:", error);
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

module.exports = {
  crearReservaConComprobante,
  obtenerReservas,
  aprobarReserva,
  cancelarReserva,
  crearReservaTemporal,
  verificarExpiracionReserva,
  obtenerEstadoReserva,
};
