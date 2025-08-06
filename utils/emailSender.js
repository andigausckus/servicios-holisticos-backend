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
<img src="https://i.postimg.cc/xTCF8sfm/IMG-20250607-170740-893.webp" alt="Logo de la plataforma" style="width: 50px; height: auto; margin: 10px auto; display: block;">
  <p>Hola ${nombreCliente},</p>

  <p>¡Gracias por confiar en Servicios Holísticos 🌿!</p>

  <p>Tu sesión fue confirmada exitosamente. A continuación te compartimos los detalles de la reserva:</p>

  <p>
    🧘 Servicio: ${nombreServicio}<br><br>
    📅 Fecha: ${fechaFormateada}<br><br>
    🕒 Hora: ${hora} a ${horaFinal}<br><br>
    💵 Valor: $${precio}
</p>

<br><br>

<p>Datos del terapeuta holístico para contacto</p>
<p>
    Nombre y apellido: ${nombreTerapeuta}<br><br>
    Email: ${emailTerapeuta}<br><br>
    WhatsApp:</strong> 
    <a href="https://wa.me/${telefonoTerapeuta}?text=👋%20Hola%20${encodeURIComponent(nombreTerapeuta)},%20soy%20${encodeURIComponent(nombreCliente)}.%20Reservé%20con%20vos%20una%20sesión%20de%20*${encodeURIComponent(nombreServicio)}*%20para%20el%20día%20${encodeURIComponent(fechaFormateada)}%20de%20${encodeURIComponent(hora)}%20a%20${encodeURIComponent(horaFinal)}.%20¡Quedo%20a%20la%20espera%20de%20la%20sesión!" 
      target="_blank" style="display:inline-block;padding:8px 16px;background-color:#25D366;color:white;border-radius:4px;text-decoration:none;">
      Enviar mensaje
    </a>
</p>

  <p>✨ El terapeuta ya fue notificado de tu sesión. Podés escribirle antes si tenés dudas o esperar al día del encuentro.</p>

<p>Una vez finalizada la sesión, vas a poder dejar una reseña sobre tu experiencia para ayudar a otros usuarios en su elección.</p>

<p>Si necesitás ayuda, podés responder directamente a este correo.</p>

  <p>Un abrazo,<br>
  
  El equipo de <strong>Servicios Holísticos</strong></p>
`;

  const cuerpoTerapeuta = `
  <img src="https://i.postimg.cc/xTCF8sfm/IMG-20250607-170740-893.webp" alt="Logo de la plataforma" style="width: 50px; height: auto; margin: 10px auto; display: block;">
  <p>👋 Hola ${nombreTerapeuta}!</p>
  
  <p>¡Tenés una nueva reserva confirmada! 🎉</p>

  <p>🧘 Usuario: ${nombreCliente}</p>
  <p>🛎️ Servicio: ${nombreServicio}</p>
  <p>📅 Fecha: ${fechaFormateada}</p>
  <p>🕒 Hora: ${hora} a ${horaFinal}</p>
  <p>💵 Valor de la sesión: $${precio}</p>

  <p>${nombreCliente} podrá escribirte antes de la sesión por email o WhatsApp si tiene alguna duda, o el mismo día del encuentro.</p>

<p>💸 El pago correspondiente a esta sesión será procesado y enviado a tu cuenta en un plazo máximo de 60 minutos.</p>

<p>✨ Te deseamos una excelente sesión ✨</p>

<p>Recordá que, una vez finalizada la sesión, el usuario podrá dejar una reseña sobre tu servicio.</p>

<p>Una buena experiencia, cordialidad y profesionalismo te ayudarán a construir una gran reputación dentro de la plataforma.</p>

  <p>El equipo de Servicios Holísticos</p>
`;

  const cuerpoAdmin = `
  <p><strong>💡 Nueva reserva confirmada:</strong></p>

  <p>👤 <strong>Cliente:</strong> ${nombreCliente}</p>
  <p>🛎️ <strong>Servicio:</strong> ${nombreServicio}</p>
  <p>📅 <strong>Fecha:</strong> ${fechaFormateada}</p>
  <p>🕒 <strong>Hora:</strong> ${hora} a ${horaFinal}</p>
  <p>💵 <strong>Precio pagado:</strong> $${precio}</p>

  <br>
  <p><strong>Datos del terapeuta:</strong></p>

  <p>🧘 <strong>Terapeuta:</strong> ${nombreTerapeuta} (${emailTerapeuta})</p>
  <p><strong>CBU/CVU:</strong> ${cbuTerapeuta}</p>
  <p><strong>Banco:</strong> ${bancoTerapeuta}</p>

  <p style="margin-top: 20px;">
    👉 <a href="https://28bc2de7-6bbd-4dd9-9f49-afa273faafcc-00-2dnc5fn90yceh.riker.replit.dev/admin/pagos" 
    target="_blank" style="text-decoration: none; color: #7D5BA6; font-weight: bold;">
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

async function enviarEmailResenaUsuario({ nombreCliente, emailCliente, nombreTerapeuta, idReserva }) {
  if (!emailCliente || !nombreCliente || !idReserva) return;

  const urlResena = `https://28bc7de7-6bbd-4dd9-9f49-afa273faafcc-00-2dnc5fn90yceh.riker.replit.dev/resenas/${idReserva}`;

  const html = `
    <p>Hola ${nombreCliente},</p>

    <p>Gracias por tu sesión con ${nombreTerapeuta}.</p>

    <p>Nos gustaría saber cómo fue tu experiencia para ayudar a otros usuarios a tomar buenas decisiones 🙌</p>

    <p>
      <a href="${urlResena}" target="_blank" style="background:#7D5BA6;padding:12px 20px;color:white;text-decoration:none;border-radius:8px;">
        Dejar reseña ahora
      </a>
    </p>

    <p>Tu opinión es muy valiosa para nosotros y para la comunidad de Servicios Holísticos 🌿</p>

    <p>Con cariño,<br>El equipo de Servicios Holísticos</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailCliente,
      subject: "📝 ¿Cómo fue tu sesión?",
      html,
    });
    console.log("✅ Email de reseña enviado al usuario");
  } catch (error) {
    console.error("❌ Error al enviar el email de reseña:", error);
  }
}


module.exports = {
  enviarEmailsReserva,
  enviarEmailConfirmacionCliente,
  enviarEmailResenaUsuario, // 👈🏼 esta línea nueva
};
