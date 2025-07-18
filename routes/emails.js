const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Reemplazá por tu email real de envío (Gmail, Zoho, etc.)
const transporter = nodemailer.createTransport({
  host: "mail.serviciosholisticos.com.ar",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_FROM, // debe ser notificaciones@serviciosholisticos.com.ar
    pass: process.env.EMAIL_PASS, // tu contraseña real o variable en Render
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
    const cuerpo = `
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

    const mailOptions = {
      from: `"Servicios Holísticos" <${process.env.EMAIL_FROM}>`,
      to: emailTerapeuta,
      subject: asunto,
      html: cuerpo,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "📨 Email enviado al terapeuta" });
  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    res.status(500).json({ success: false, error: "Error enviando email", detalle: error.message });
  }
});

module.exports = router;
