const nodemailer = require("nodemailer");

function formatearFecha(fechaISO) {
  const partes = fechaISO.split("-");
  return `${partes[2]}-${partes[1]}-${partes[0]}`; // dd-mm-yyyy
}

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
  telefonoTerapeuta, // ✅ Agregalo acá
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

  const fechaFormateada = formatearFecha(fecha);

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

  <p>¡Gracias por confiar en Servicios Holísticos 🌿!</p>

  <p>Tu sesión fue confirmada exitosamente. A continuación te compartimos los detalles de la reserva:</p>

  <p>
    🧘 <strong>Servicio:</strong> ${nombreServicio}<br><br>
    📅 <strong>Fecha:</strong> ${fechaFormateada}<br><br>
    🕒 <strong>Hora:</strong> ${hora} a ${horaFinal}<br><br>
    💵 <strong>Valor:</strong> $${precio}
</p>

<br><br>

<p><strong>Datos del terapeuta holístico para contacto:</strong></p>
<br>
<p>
    <strong>Nombre y apellido:</strong> ${nombreTerapeuta}<br><br>
    <strong>Email:</strong> ${emailTerapeuta}<br><br>
    <strong>WhatsApp:</strong> 
    <a href="https://wa.me/${telefonoTerapeuta}?text=Hola%20${encodeURIComponent(nombreTerapeuta)},%20soy%20${encodeURIComponent(nombreCliente)}.%20Reservé%20con%20vos%20una%20sesión%20de%20*${encodeURIComponent(nombreServicio)}*%20para%20el%20día%20${encodeURIComponent(fechaFormateada)}%20de%20${encodeURIComponent(hora)}%20a%20${encodeURIComponent(horaFinal)}.%20¡Quedo%20a%20la%20espera%20de%20la%20sesión!" 
      target="_blank" style="display:inline-block;padding:8px 16px;background-color:#25D366;color:white;border-radius:4px;text-decoration:none;">
      Enviar mensaje
    </a>
</p>

  <br>

  <p>✨ El terapeuta ya fue notificado de tu sesión. Podés escribirle antes si tenés dudas o esperar al día del encuentro.</p>

<p>Una vez finalizada la sesión, vas a poder dejar una reseña sobre tu experiencia para ayudar a otros usuarios en su elección.</p>

<p>Si necesitás ayuda, podés responder directamente a este correo.</p>

  <p>Un abrazo,<br>
  El equipo de <strong>Servicios Holísticos</strong></p>
`;

const fechaFormateada = formatearFecha(fecha);

  const cuerpoTerapeuta = `
  <p>👋 <strong>Hola ${nombreTerapeuta}!</strong></p>

  <p>¡Tenés una nueva reserva confirmada! 🎉</p>

  <p>🧘 <strong>Usuario:</strong> ${nombreCliente}</p>
  <p>🛎️ <strong>Servicio:</strong> ${nombreServicio}</p>
  <p>📅 <strong>Fecha:</strong> ${fechaFormateada}</p>
  <p>🕒 <strong>Hora:</strong> ${hora} a ${horaFinal}</p>
  <p>💵 <strong>Valor de la sesión:</strong> $${precio}</p>

  <p>${nombreCliente} podrá escribirte antes de la sesión si tiene alguna duda, o el mismo día del encuentro.</p>

<p>✨ Te deseamos una excelente sesión ✨</p>

<p>Recordá que, una vez finalizada la sesión, el usuario podrá dejar una reseña sobre tu servicio.</p>

<p>Una buena experiencia, cordialidad y profesionalismo te ayudarán a construir una gran reputación dentro de la plataforma.</p>

  <p><strong>El equipo de Servicios Holísticos</strong></p>
`;

  const cuerpoAdmin = `
  <p><strong>💡 Nueva reserva confirmada:</strong></p>

  <p>👤 <strong>Cliente:</strong> ${nombreCliente} (${emailCliente})</p>
  <p>🧘 <strong>Terapeuta:</strong> ${nombreTerapeuta} (${emailTerapeuta})</p>
  <p>🛎️ <strong>Servicio:</strong> ${nombreServicio}</p>
  <p>📅 <strong>Fecha:</strong> ${fechaFormateada}</p>
  <p>🕒 <strong>Hora:</strong> ${hora} a ${horaFinal}</p>
  <p>💵 <strong>Precio pagado:</strong> $${precio}</p>

  <p style="margin-top: 20px;">
    👉 <a href="https://28bc2de7-6bbd-4dd9-9f49-afa273faafcc-00-2dnc5fn90yceh.riker.replit.dev/admin/pagos">
      Ver comprobante de pago
    </a>
  </p>
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
    
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailAdmin,
      subject: "📥 Nueva reserva confirmada",
      html: cuerpoAdmin,
    });
    console.log("✅ Email al admin enviado");
    

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
