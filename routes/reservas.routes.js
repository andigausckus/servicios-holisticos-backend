const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const { enviarEmailsReserva } = require("../utils/emailSender");

router.post("/", async (req, res) => {
  try {
    console.log("📩 req.body:", req.body);
    const {
      servicioId,
      fechaReserva: fecha,
      horaReserva: hora,
      usuarioNombre: nombreUsuario,
      usuarioEmail: emailUsuario,
      mensaje
    } = req.body;

    const servicio = await Servicio.findById(servicioId).lean();
    if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

    const terapeuta = await Terapeuta.findOne({ "servicios._id": servicioId }).lean();
    if (!terapeuta) return res.status(404).json({ error: "Terapeuta no encontrado" });

    const nuevaReserva = new Reserva({
      servicioId,
      terapeutaId: terapeuta._id,
      nombreUsuario,
      emailUsuario,
      fecha,
      hora,
      mensaje,
      estado: "confirmada",
    });

    await nuevaReserva.save();
    console.log("✅ Reserva guardada");

    try {
      console.log("📧 Enviando emails con:", {
        nombreCliente: nombreUsuario,
        emailCliente: emailUsuario,
        nombreTerapeuta: terapeuta.nombre,
        emailTerapeuta: terapeuta.email,
      });

      await enviarEmailsReserva({
        nombreCliente: nombreUsuario,
        emailCliente: emailUsuario,
        nombreTerapeuta: terapeuta.nombre,
        emailTerapeuta: terapeuta.email,
        whatsappTerapeuta: terapeuta.whatsapp,
        bancoTerapeuta: terapeuta.banco,
        cbuTerapeuta: terapeuta.cbu,
        nombreServicio: servicio.titulo,
        fecha,
        hora,
        duracion: servicio.duracion || "60min",
        precio: servicio.precio || 0,
      });

      console.log("✅ Emails de reserva enviados correctamente");
    } catch (error) {
      console.error("❌ Error al enviar emails de reserva:", error);
    }

    res.status(200).json({ mensaje: "Reserva registrada con éxito" });

  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
