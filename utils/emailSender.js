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
Tu sesión fue confirmada exitosamente con **${nombreTerapeuta}**.  
A continuación te compartimos los detalles de la reserva:

- 🧘 Servicio: ${nombreServicio}

- 📅 Fecha: ${fechaFormateada}

- 🕒 Hora: ${hora} a ${horaFinal}

- 💵 Valor: $${precio}


**Datos del terapeuta holístico para contacto:**  

- Nombre y apellido: ${nombreTerapeuta}

- Email: ${emailTerapeuta}

- WhatsApp: [Enviar mensaje](https://wa.me/${telefonoTerapeuta.replace(/\D/g, "")}?text=${encodeURIComponent(
  `Hola ${nombreTerapeuta}, soy ${nombreCliente}. Reservé con vos una sesión de ${nombreServicio} para el día ${fechaFormateada} de ${hora} a ${horaFinal}. ¡Quedo a la espera de la sesión!`
)})


✨ El terapeuta ya fue notificado de tu sesión. Podés escribirle antes si tenés dudas o esperar al día de la sesión.

Si necesitás ayuda, podés responder este correo o escribirnos a soporte@serviciosholisticos.com.ar.

Un abrazo,  
El equipo de Servicios Holísticos
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
