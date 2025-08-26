const nodemailer = require("nodemailer");

// ✅ Función para formatear fecha dd-mm-yyyy
function formatearFecha(fechaISO) {
  const partes = fechaISO.split("-");
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

// ✅ Configuración del transporter
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "notificaciones@serviciosholisticos.com.ar",
    pass: process.env.EMAIL_PASS,
  },
});

// ===================== Envío de emails de reserva =====================
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
  horaFinal,
  duracion,
  precio,
  telefonoTerapeuta,
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

  if (!emailCliente || !emailTerapeuta) {
    console.error("❌ Faltan datos para enviar el correo:", {
      emailCliente,
      emailTerapeuta,
    });
    return;
  }

  const emailAdmin = process.env.EMAIL_ADMIN || "notificaciones@serviciosholisticos.com.ar";
  const asunto = "💖 Nueva sesión confirmada - Servicios Holísticos";

  // ===== HTML para el cliente =====
const cuerpoCliente = `
<img src="https://i.postimg.cc/xTCF8sfm/IMG-20250607-170740-893.webp" 
     alt="Logo de la plataforma" style="width: 50px; height: auto; margin: 10px auto; display: block;">

<p>Hola ${nombreCliente},</p>

<p>¡Gracias por confiar en Servicios Holísticos 🌿!</p>

<p>A continuación te compartimos los detalles de la reserva:</p>

<p>🧘 Servicio: ${nombreServicio}<br><br>
📅 Fecha: ${fechaFormateada}<br><br>
🕒 Hora: ${hora} a ${horaFinal}<br><br>
💵 Valor: $${precio}</p>

<p><u>Datos del terapeuta holístico para contacto</u></p>

<p>Nombre y apellido: ${nombreTerapeuta}<br><br>
Email: ${emailTerapeuta}<br><br>
WhatsApp: 
<a href="https://wa.me/${telefonoTerapeuta}?text=👋%20Hola%20${encodeURIComponent(nombreCliente)},%20soy%20${encodeURIComponent(nombreTerapeuta)}.%0A%0AReservé%20con%20vos%20una%20sesión%20de%20*${encodeURIComponent(nombreServicio)}*%20para%20el%20día%20${encodeURIComponent(fechaFormateada)}%20de%20${encodeURIComponent(hora)}%20a%20${encodeURIComponent(horaFinal)}" 
   target="_blank" style="display:inline-block;padding:8px 16px;background-color:#25D366;color:white;border-radius:4px;text-decoration:none;">
   Enviar mensaje
</a>
</p>

<p>✨ El terapeuta ya fue notificado de tu sesión. Podés escribirle antes si tenés dudas o esperar al día del encuentro.</p>

<p>Una vez finalizada la sesión, podrás dejar una reseña sobre tu experiencia para ayudar a otros usuarios en su elección.</p>

<p>Si necesitás ayuda, podés responder directamente a este correo.</p>

<p>Con cariño 🌸<br>
<strong>El equipo de Servicios Holísticos</strong></p>
`;


  // ===== HTML para el terapeuta =====
const cuerpoTerapeuta = `
<img src="https://i.postimg.cc/xTCF8sfm/IMG-20250607-170740-893.webp" 
     alt="Logo de la plataforma" style="width: 50px; height: auto; margin: 10px auto; display: block;">

<p>👋 Hola ${nombreTerapeuta}!</p>

<p>¡Tenés una nueva reserva confirmada! 🎉</p>

<p>🧘 Usuario: ${nombreCliente}<br><br>
🛎️ Servicio: ${nombreServicio}<br><br>
📅 Fecha: ${fechaFormateada}<br><br>
🕒 Hora: ${hora} a ${horaFinal}<br><br>
💵 Valor de la sesión: $${precio}</p>

<p>${nombreCliente} podrá escribirte antes de la sesión por email o WhatsApp si tiene alguna duda, o el mismo día del encuentro.</p>

<p>💸 El pago correspondiente a esta sesión será procesado y enviado a tu cuenta en un plazo máximo de 60 minutos.</p>

<p>✨ Te deseamos una excelente sesión ✨</p>

<p>✍️ Una vez finalizada la sesión, el usuario podrá dejar una reseña sobre tu servicio.</p>

<p>😃 Una experiencia positiva y profesional te ayudará a construir una sólida reputación en nuestra plataforma, lo que atraerá a más clientes y oportunidades de crecimiento.</p>

<p>Con cariño 🌸<br>
<strong>El equipo de Servicios Holísticos</strong></p>
`;
       

  // ===== HTML para el admin =====
const cuerpoAdmin = `
  <p>💡 Nueva reserva confirmada:</p>
  <p>👤 Cliente: ${nombreCliente}</p>
  <p>🛎️ Servicio: ${nombreServicio}</p>
  <p>📅 Fecha: ${fechaFormateada}</p>
  <p>🕒 Hora: ${hora} a ${horaFinal}</p>
  <p>💵 Precio pagado: $${precio}</p>
  <br><hr style="border: 1px solid #ccc; margin: 10px 0;">
  <p>Datos del terapeuta:</p>
  <p>🧘 Terapeuta: ${nombreTerapeuta} (${emailTerapeuta})</p>
  <p>CBU/CVU: ${cbuTerapeuta}</p>
  <p>Banco: ${bancoTerapeuta}</p>
  <p style="margin-top:20px;">
    👉 <a href="https://www.serviciosholisticos.com.ar/#/admin/pagos" target="_blank" style="text-decoration:none;color:#7D5BA6;">Ver comprobante de pago</a>
  </p>
`;

  try {
    // Email al cliente
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailCliente,
      subject: asunto,
      html: cuerpoCliente,
    });
    console.log("✅ Email al cliente enviado");

    // Email al terapeuta
    await transporter.sendMail({
      from: `"Servicios Holísticos" <notificaciones@serviciosholisticos.com.ar>`,
      to: emailTerapeuta,
      subject: asunto,
      html: cuerpoTerapeuta,
    });
    console.log("✅ Email al terapeuta enviado");

    // Email al admin
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

// ===================== Función para enviar confirmación al cliente =====================
async function enviarEmailConfirmacionCliente(reserva) {
  const { nombreCliente, emailCliente, nombreTerapeuta, emailTerapeuta, nombreServicio, fecha, hora, duracion, precio } = reserva;

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

// ===================== Función para enviar email de reseña =====================
async function enviarEmailResenaUsuario({ nombreCliente, emailCliente, nombreTerapeuta, idReserva }) {
  console.log("📩 Datos recibidos para email de reseña:", { nombreCliente, emailCliente, nombreTerapeuta, idReserva });

  if (!emailCliente || !nombreCliente || !idReserva) {
    console.warn("⚠️ Email de reseña NO enviado: faltan datos obligatorios");
    return;
  }

  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  const urlResena = `${FRONTEND_URL}/#/resenas/${idReserva}`;

  const html = `
    <style>p { margin-bottom: 20px; }</style>
    <div>
      <p>Hola ${nombreCliente},</p>
      <p>Gracias por tu sesión con ${nombreTerapeuta}.</p>
      <p>Nos gustaría saber cómo fue tu experiencia para ayudar a otros usuarios a tomar buenas decisiones 🙌</p>
      <p>Tu opinión es muy valiosa para nosotros y para la comunidad de Servicios Holísticos 🌿</p>
      <p style="margin-top: 40px; text-align: center;">
        <a href="${urlResena}" target="_blank" style="background:#7D5BA6;padding:12px 20px;color:white;text-decoration:none;border-radius:8px;">
          Dejar reseña ahora
        </a>
      </p>
      <p>Con cariño 🌸<br><strong>El equipo de Servicios Holísticos</strong></p>
    </div>
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

// ===================== Export =====================
module.exports = {
  enviarEmailsReserva,
  enviarEmailConfirmacionCliente,
  enviarEmailResena: enviarEmailResenaUsuario,
};
