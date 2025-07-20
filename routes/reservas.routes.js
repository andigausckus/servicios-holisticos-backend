const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");
const Terapeuta = require("../models/Terapeuta");
const Servicio = require("../models/Servicio");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.dondominio.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req, res) => {
  try {
    const { servicioId, fecha, hora, nombreUsuario, emailUsuario, mensaje } = req.body;

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

    // 🔵 Email HTML
    const emailInfo = {
      asunto: "Nueva reserva confirmada",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #663399;">Reserva Confirmada</h2>
          <p>Hola, se ha registrado una nueva reserva.</p>
          <ul>
            <li><strong>Usuario:</strong> ${nombreUsuario}</li>
            <li><strong>Email:</strong> ${emailUsuario}</li>
            <li><strong>Servicio:</strong> ${servicio.titulo}</li>
            <li><strong>Fecha:</strong> ${fecha}</li>
            <li><strong>Hora:</strong> ${hora}</li>
            <li><strong>Mensaje:</strong> ${mensaje || "(sin mensaje)"}</li>
          </ul>
          <p>Gracias por usar Servicios Holísticos ✨</p>
        </div>
      `,
    };

    const destinatarios = [
      terapeuta.email,
      emailUsuario,
      "notificaciones@serviciosholisticos.com.ar",
    ];

    for (const destinatario of destinatarios) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: destinatario,
          subject: emailInfo.asunto,
          html: emailInfo.html,
        });
        console.log("📨 Email enviado a:", destinatario);
      } catch (err) {
        console.error("❌ Error al enviar email a", destinatario, err);
      }
    }

    res.status(200).json({ mensaje: "Reserva registrada con éxito" });
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
