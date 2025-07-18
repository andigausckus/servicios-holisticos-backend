const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Transporter general (no se usa directamente en este caso)
const transporter = nodemailer.createTransport({
  host: "mail.serviciosholisticos.com.ar",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_FROM, // notificaciones@serviciosholisticos.com.ar
    pass: process.env.EMAIL_PASS,
  },
});

// Transporter para notificaciones al cliente
const transporterNotificaciones = nodemailer.createTransport({
  host: "mail.serviciosholisticos.com.ar",
  port: 465,
  secure: true,
  auth: {
    user: "notificaciones@serviciosholisticos.com.ar",
    pass: process.env.EMAIL_PASS,
  },
});

// Transporter para comprobantes al terapeuta
const transporterComprobante = nodemailer.createTransport({
  host: "mail.serviciosholisticos.com.ar",
  port: 465,
  secure: true,
  auth: {
    user: "comprobante@serviciosholisticos.com.ar",
    pass: process.env.EMAIL_COMPROBANTE_PASS,
  },
});

router.post("/enviar-comprobante", async (req, res) => {
  console.log("📨 Se recibió solicitud para enviar email de comprobante:", req.body);

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
    <p>Puedes escribirle al terapeuta si tenés preguntas, o hacerlo el día de la sesión directamente.</p>
    <p>Gracias por elegirnos 🙌</p>
  `;

  let errores = [];

  // Enviar email al terapeuta desde comprobante@
  try {
    console.log("🟡 Enviando email al terapeuta...");
    await transporterComprobante.sendMail({
      from: `"Servicios Holísticos" <comprobante@serviciosholisticos.com.ar>`,
      to: emailTerapeuta,
      subject: asunto,
      html: cuerpoTerapeuta,
    });
    console.log("✅ Email enviado al terapeuta:", emailTerapeuta);
  } catch (error) {
    console.error("❌ Error al enviar email al terapeuta:", error);
    errores.push("terapeuta");
  }

  // Enviar email al cliente desde notificaciones@
  try {
    console.log("🟡 Enviando email al cliente...");
    await transporterNotificaciones.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailCliente,
      subject: asunto,
      html: cuerpoCliente,
    });
    console.log("✅ Email enviado al cliente:", emailCliente);
  } catch (error) {
    console.error("❌ Error al enviar email al cliente:", error);
    errores.push("cliente");
  }

  if (errores.length === 0) {
    res.json({ success: true, message: "📨 Emails enviados correctamente a terapeuta y cliente" });
  } else {
    res.status(207).json({
      success: false,
      message: "Algunos correos no se pudieron enviar",
      errores,
    });
  }
});

module.exports = router;
