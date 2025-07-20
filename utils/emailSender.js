const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com", // ✅ Usamos servidor SMTP oficial de Zoho
  port: 465,
  secure: true,
  auth: {
    user: "notificaciones@serviciosholisticos.com.ar",
    pass: process.env.EMAIL_PASS, // Asegurate de usar una contraseña de aplicación
  },
});

async function enviarEmailsReserva({
  nombreCliente,
  emailCliente,
  nombreTerapeuta,
  emailTerapeuta,
  whatsappTerapeuta = "",
  bancoTerapeuta = "",
  cbuTerapeuta = "",
  nombreServicio,
  fecha,
  hora,
  duracion,
  precio,
}) {
  const emailAdmin = "notificaciones@serviciosholisticos.com.ar";
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
  `;

  const cuerpoTerapeuta = `
    <p>👋 Hola ${nombreTerapeuta},</p>
    <p>${nombreCliente} reservó una sesión con vos:</p>
    <ul>
      <li><strong>Cliente:</strong> ${nombreCliente} (${emailCliente})</li>
      <li><strong>Servicio:</strong> ${nombreServicio}</li>
      <li><strong>Fecha:</strong> ${fecha}</li>
      <li><strong>Hora:</strong> ${hora}</li>
      <li><strong>Monto recibido:</strong> $${precio}</li>
    </ul>
  `;

  const cuerpoAdmin = `
    <p><strong>💡 Nueva reserva confirmada:</strong></p>
    <ul>
      <li><strong>Cliente:</strong> ${nombreCliente} (${emailCliente})</li>
      <li><strong>Terapeuta:</strong> ${nombreTerapeuta} (${emailTerapeuta})</li>
      <li><strong>Servicio:</strong> ${nombreServicio}</li>
      <li><strong>Fecha:</strong> ${fecha}</li>
      <li><strong>Hora:</strong> ${hora}</li>
      <li><strong>Precio pagado:</strong> $${precio}</li>
    </ul>
  `;

  try {
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailCliente,
      subject: asunto,
      html: cuerpoCliente,
    });
    console.log("✅ Email cliente enviado");

    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailTerapeuta,
      subject: asunto,
      html: cuerpoTerapeuta,
    });
    console.log("✅ Email terapeuta enviado");

    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailAdmin,
      subject: "📥 Nueva reserva confirmada",
      html: cuerpoAdmin,
    });
    console.log("✅ Email admin enviado");
  } catch (error) {
    console.error("❌ Error al enviar alguno de los emails:", error);
    throw error;
  }
}

module.exports = { enviarEmailsReserva };
