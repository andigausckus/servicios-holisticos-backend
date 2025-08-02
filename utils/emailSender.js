const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "notificaciones@serviciosholisticos.com.ar",
    pass: process.env.EMAIL_PASS,
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
  console.log("🧪 Datos recibidos para enviarEmailsReserva:", {
    emailCliente,
    emailTerapeuta,
    nombreCliente,
    nombreTerapeuta,
  });

  // Validación previa
  if (!emailCliente || !emailTerapeuta) {
    console.error("❌ Faltan datos para enviar el correo:", {
      emailCliente,
      emailTerapeuta,
    });
    return;
  }

  const emailAdmin = process.env.EMAIL_ADMIN || "notificaciones@serviciosholisticos.com.ar";
  const asunto = "💖 Nueva sesión confirmada - Servicios Holísticos";

  const cuerpoCliente = `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
    <p>Hola <strong>${nombreCliente}</strong>,</p>

    <p>¡Gracias por confiar en <strong>Servicios Holísticos</strong> 🌿!</p>

    <p>Tu sesión fue confirmada exitosamente con <strong>${nombreTerapeuta}</strong>. A continuación te compartimos los detalles de la reserva:</p>

    <ul style="padding-left: 16px;">
      <li><strong>🧘 Servicio:</strong> ${nombreServicio}</li>
      <li><strong>📅 Fecha:</strong> ${fecha}</li>
      <li><strong>🕒 Hora:</strong> ${hora}</li>
      <li><strong>⏱️ Duración:</strong> ${duracion}</li>
      <li><strong>💵 Monto abonado:</strong> $${precio}</li>
    </ul>

    <p>✨ En las próximas horas, ${nombreTerapeuta} se pondrá en contacto con vos para coordinar la sesión.</p>

    <p>Si tenés dudas o necesitás ayuda, podés responder este correo o escribirnos a <a href="mailto:soporte@serviciosholisticos.com.ar">soporte@serviciosholisticos.com.ar</a>.</p>

    <p style="margin-top: 24px;">Un abrazo,</p>
    <p><strong>El equipo de Servicios Holísticos</strong></p>
  </div>
`;

  const cuerpoTerapeuta = `
    <p>👋 Hola ${nombreTerapeuta},</p>
    <p><strong>${nombreCliente}</strong> reservó una sesión con vos:</p>
    <ul>
      <li><strong>Cliente:</strong> ${nombreCliente} (${emailCliente})</li>
      <li><strong>Servicio:</strong> ${nombreServicio}</li>
      <li><strong>Fecha:</strong> ${fecha}</li>
      <li><strong>Hora:</strong> ${hora}</li>
      <li><strong>Monto recibido:</strong> $${precio}</li>
    </ul>
    <p>Por favor, contactalo/a a la brevedad para confirmar.</p>
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
    // Email para el cliente
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailCliente,
      subject: asunto,
      html: cuerpoCliente,
    });
    console.log("✅ Email al cliente enviado");

    // Email para el terapeuta
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailTerapeuta,
      subject: asunto,
      html: cuerpoTerapeuta,
    });
    console.log("✅ Email al terapeuta enviado");

    // Email al admin (opcional)
    /*
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailAdmin,
      subject: "📥 Nueva reserva confirmada",
      html: cuerpoAdmin,
    });
    console.log("✅ Email al admin enviado");
    */

  } catch (error) {
    console.error("❌ Error al enviar alguno de los emails:", error);
    throw error;
  }
}

module.exports = { enviarEmailsReserva };
