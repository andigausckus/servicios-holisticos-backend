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
  horaFinal, // 👈🏼 Agregá esta línea
  duracion,
  precio,
}) {
  console.log("🧪 Datos recibidos para enviarEmailsReserva:", {
    emailCliente,
    emailTerapeuta,
    nombreCliente,
    nombreTerapeuta,
    nombreServicio,
    fecha,
    hora,
    horaFinal,
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

// cuerpo del emailCliente (HTML) actualizado

const cuerpoCliente = `
  <p>Hola ${nombreCliente},</p>
  <p>¡Gracias por confiar en <strong>Servicios Holísticos</strong> 🌿!</p>
  <p>Tu sesión fue confirmada exitosamente con <strong>${nombreTerapeuta}</strong>. A continuación te compartimos los detalles de la reserva:</p>

  <ul>
    <li><strong>🧘 Servicio:</strong> ${nombreServicio}</li>
    <li><strong>📅 Fecha:</strong> ${fecha}</li>
    <li><strong>🕒 Hora:</strong> ${hora} a ${horaFinal}</li>
    <li><strong>⏱️ Duración:</strong> ${duracion} minutos</li>
    <li><strong>💵 Valor:</strong> $${precio}</li>
  </ul>

  <p><strong>Datos del terapeuta holístico para contacto:</strong></p>
  <ul>
    <li><strong>Nombre y apellido:</strong> ${nombreTerapeuta}</li>
    <li><strong>Email:</strong> <a href="mailto:${emailTerapeuta}">${emailTerapeuta}</a></li>
    <li><strong>WhatsApp:</strong> <a href="https://wa.me/${telefonoTerapeuta.replace(/\D/g, "")}?text=${encodeURIComponent(
      `Hola ${nombreTerapeuta}, soy ${nombreCliente}. Reservé con vos una sesión de "${nombreServicio}" para el día ${fecha} de ${hora} a ${horaFinal}. Quedo a la espera de la sesión. ¡Gracias!`
    )}" target="_blank">Enviar mensaje</a></li>
  </ul>

  <p>✨ El terapeuta ya fue notificado de tu sesión. Podés escribirle antes si tenés dudas o esperar al día de la sesión.</p>

  <p>Si necesitás ayuda, podés responder este correo o escribirnos a <a href="mailto:soporte@serviciosholisticos.com.ar">soporte@serviciosholisticos.com.ar</a>.</p>

  <p>Un abrazo,</p>
  <p><strong>El equipo de Servicios Holísticos</strong></p>
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

      async function enviarEmailConfirmacionCliente(reserva) {
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
  } = reserva;

  return await enviarEmailsReserva({
    nombreCliente,
    emailCliente,
    nombreTerapeuta,
    emailTerapeuta,
    nombreServicio,
    fecha,
    hora,
    duracion,
    precio,
  });
    }

module.exports = {
  enviarEmailsReserva,
  enviarEmailConfirmacionCliente,
};
