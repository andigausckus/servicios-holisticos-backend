const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Configuración del transporter para DomWeb (correo profesional)
const transporter = nodemailer.createTransport({
  host: "mail.serviciosholisticos.com.ar",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_FROM, // notificaciones@serviciosholisticos.com.ar
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/enviar-comprobante", async (req, res) => {
  try {
    const {
      nombreCliente,
      emailCliente,
      nombreTerapeuta,
      emailTerapeuta,
      nombreServicio,
      fecha,
      hora,
      duracion,
      precio,
    } = req.body;

    const asunto = "💖 Nueva sesión confirmada - Servicios Holísticos";

    // 📨 Email al terapeuta
    const cuerpoTerapeuta = `
      <p>Hola ${nombreTerapeuta},</p>

      <p>Recibiste una nueva reserva de sesión a través de <strong>Servicios Holísticos</strong> 🌿</p>

      <ul>
        <li><strong>Cliente:</strong> ${nombreCliente} (${emailCliente})</li>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Fecha:</strong> ${fecha}</li>
        <li><strong>Hora:</strong> ${hora}</li>
        <li><strong>Duración:</strong> ${duracion}</li>
        <li><strong>Monto recibido:</strong> $${precio}</li>
      </ul>

      <p>En breve recibirás la transferencia correspondiente al 85% del valor.</p>
      <p>Gracias por formar parte de nuestra comunidad 🌸</p>
    `;

    // 📨 Email al cliente
    const cuerpoCliente = `
      <p>Hola ${nombreCliente},</p>

      <p>Gracias por tu reserva en <strong>Servicios Holísticos</strong> 🌿</p>

      <p>Tu sesión ha sido confirmada con el/la terapeuta <strong>${nombreTerapeuta}</strong>.</p>

      <ul>
        <li><strong>Servicio:</strong> ${nombreServicio}</li>
        <li><strong>Fecha:</strong> ${fecha}</li>
        <li><strong>Hora:</strong> ${hora}</li>
        <li><strong>Duración:</strong> ${duracion}</li>
        <li><strong>Monto abonado:</strong> $${precio}</li>
      </ul>

      <p>Podes escribirle al terapeuta si tenes preguntas, o hacerlo el día de la sesión directamente</p>
      <p>Gracias por elegirnos 🙌</p>
    `;

    // Enviar correo al terapeuta
    await transporter.sendMail({
      from: `"Servicios Holísticos" <${process.env.EMAIL_FROM}>`,
      to: emailTerapeuta,
      subject: asunto,
      html: cuerpoTerapeuta,
    });

    // Enviar correo al cliente
    await transporter.sendMail({
      from: `"Servicios Holísticos" <${process.env.EMAIL_FROM}>`,
      to: emailCliente,
      subject: asunto,
      html: cuerpoCliente,
    });

    res.json({ success: true, message: "📨 Emails enviados a terapeuta y cliente" });

  } catch (error) {
    console.error("❌ Error al enviar emails:", error);
    res.status(500).json({
      success: false,
      error: "Error enviando emails",
      detalle: error.message,
    });
  }
});

module.exports = router;
