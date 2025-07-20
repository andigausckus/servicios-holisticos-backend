const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.serviciosholisticos.com.ar",
  port: 465,
  secure: true,
  auth: {
    user: "notificaciones@serviciosholisticos.com.ar",
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/enviar-comprobante", async (req, res) => {
  console.log("📨 Solicitud para enviar emails:", req.body);

  const {
    nombreCliente,
    emailCliente,
    nombreTerapeuta,
    emailTerapeuta,
    whatsappTerapeuta,
    bancoTerapeuta,
    cbuTerapeuta,
    nombreServicio,
    fecha,
    hora,
    duracion,
    precio,
    emailAdmin,
  } = req.body;

  const asunto = "💖 Nueva sesión confirmada - Servicios Holísticos";

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

  const cuerpoTerapeuta = `
    <p>👋 Hola ${nombreTerapeuta}, te saludamos de <strong>Servicios Holísticos</strong> 🌿</p>
    <p>${nombreCliente} reservó una sesión con vos. Te adjuntamos el comprobante del pago, descontando la comisión del 15% por el uso de nuestro servicio.</p>
    <ul>
      <li><strong>Cliente:</strong> ${nombreCliente} (${emailCliente})</li>
      <li><strong>Servicio:</strong> ${nombreServicio}</li>
      <li><strong>Fecha:</strong> ${fecha}</li>
      <li><strong>Hora:</strong> ${hora}</li>
      <li><strong>Duración:</strong> ${duracion}</li>
      <li><strong>Monto recibido:</strong> $${precio}</li>
    </ul>
    <p>${nombreCliente} te escribirá antes de la sesión si tiene dudas, pero también podés escribirle vos si sentís que es necesario.</p>
    <p>Gracias por ser parte de nuestra Comunidad de terapeutas 🌸</p>
  `;

  const cuerpoAdmin = `
    <p><strong>💡 Nueva reserva confirmada:</strong></p>
    <ul>
      <li><strong>Cliente:</strong> ${nombreCliente} (${emailCliente})</li>
      <li><strong>Terapeuta:</strong> ${nombreTerapeuta} (${emailTerapeuta})</li>
      <li><strong>WhatsApp terapeuta:</strong> <a href="https://wa.me/${whatsappTerapeuta}" target="_blank">${whatsappTerapeuta}</a></li>
      <li><strong>Banco:</strong> ${bancoTerapeuta}</li>
      <li><strong>CBU:</strong> ${cbuTerapeuta}</li>
      <li><strong>Servicio:</strong> ${nombreServicio}</li>
      <li><strong>Fecha:</strong> ${fecha}</li>
      <li><strong>Hora:</strong> ${hora}</li>
      <li><strong>Precio pagado:</strong> $${precio}</li>
    </ul>
  `;

  let errores = [];

  // Cliente
  try {
    console.log("🟡 Enviando email al cliente...");
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailCliente,
      subject: asunto,
      html: cuerpoCliente,
    });
    console.log("✅ Email enviado al cliente:", emailCliente);
  } catch (error) {
    console.error("❌ Error email cliente:", error);
    errores.push("cliente");
  }

  // Terapeuta
  try {
    console.log("🟡 Enviando email al terapeuta...");
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailTerapeuta,
      subject: asunto,
      html: cuerpoTerapeuta,
    });
    console.log("✅ Email enviado al terapeuta:", emailTerapeuta);
  } catch (error) {
    console.error("❌ Error email terapeuta:", error);
    errores.push("terapeuta");
  }

  // Admin
  try {
    console.log("🟡 Enviando email al admin...");
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailAdmin,
      subject: "📥 Nueva reserva confirmada - Notificación Admin",
      html: cuerpoAdmin,
    });
    console.log("✅ Email enviado al admin:", emailAdmin);
  } catch (error) {
    console.error("❌ Error email admin:", error);
    errores.push("admin");
  }

  if (errores.length === 0) {
    res.json({ success: true, message: "📨 Emails enviados correctamente a cliente, terapeuta y admin" });
  } else {
    res.status(207).json({
      success: false,
      message: "❌ Algunos correos no se pudieron enviar",
      errores,
    });
  }
});

module.exports = router;
