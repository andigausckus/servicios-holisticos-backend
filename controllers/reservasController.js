import Reserva from "../models/Reserva.js";
import Servicio from "../models/Servicio.js";
import Terapeuta from "../models/Terapeuta.js";
import Usuario from "../models/Usuario.js";
import nodemailer from "nodemailer";
import schedule from "node-schedule";
import { formatearFecha } from "../helpers/formatearFecha.js";

const crearReserva = async (req, res) => {
  try {
    const {
      servicio,
      usuario,
      fecha,
      horaInicio,
      horaFinal,
      metodoPago,
      estadoPago,
      monto,
    } = req.body;

    const nuevaReserva = await Reserva.create({
      servicio,
      usuario,
      fecha,
      horaInicio,
      horaFinal,
      metodoPago,
      estadoPago,
      monto,
    });

    console.log("✅ Reserva guardada en la base de datos");

    const servicioDB = await Servicio.findById(servicio)
      .populate("terapeuta", "nombreCompleto email")
      .populate("usuario", "nombre email");

    const terapeuta = servicioDB.terapeuta;
    const usuarioDB = await Usuario.findById(usuario);

    console.log("✅ Datos cargados:", {
      terapeuta: terapeuta?.email,
      usuario: usuarioDB?.email,
    });

    // Configurar transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Armar HTML del email
    const emailHTML = `
      <h2>Datos de la sesión reservada</h2>
      <p>Hola ${usuarioDB.nombre},</p>
      <p>Tu sesión fue confirmada exitosamente con <strong>${terapeuta.nombreCompleto}</strong>.</p>
      <p>A continuación te compartimos los detalles de la reserva:</p>
      <ul>
        <li>🧘 Servicio: ${servicioDB.titulo}</li>
        <li>📅 Fecha: ${formatearFecha(fecha)}</li>
        <li>🕒 Hora: ${horaInicio} a ${horaFinal}</li>
        <li>💵 Valor: $${monto}</li>
      </ul>
      <p><strong>Datos del terapeuta holístico para contacto:</strong></p>
      <ul>
        <li>📛 Nombre y apellido: ${terapeuta.nombreCompleto}</li>
        <li>✉️ Email: ${terapeuta.email}</li>
      </ul>
      <p>Gracias por elegir Servicios Holísticos 💜</p>
    `;

    const emailUsuario = usuarioDB.email;

    // Programar envío de email de contacto del terapeuta 1 minuto después (en desarrollo) o 30 minutos (producción)
    try {
      const [horaFinalH, horaFinalM] = horaFinal.split(":").map(Number);
      const fechaHoraFin = new Date(fecha);
      fechaHoraFin.setHours(horaFinalH);
      fechaHoraFin.setMinutes(horaFinalM);

      const fechaEnvio =
        process.env.NODE_ENV === "development"
          ? new Date(fechaHoraFin.getTime() + 1 * 60 * 1000) // +1 minuto
          : new Date(fechaHoraFin.getTime() + 30 * 60 * 1000); // +30 minutos

      const job = schedule.scheduleJob(fechaEnvio, async () => {
        await transporter.sendMail({
          from: '"Servicios Holísticos" <info@serviciosholisticos.com.ar>',
          to: emailUsuario,
          subject: "Datos de contacto del terapeuta",
          html: emailHTML,
        });

        console.log("✅ Email programado correctamente para el usuario");
      });
    } catch (error) {
      console.error("❌ Error al programar el envío del email:", error);
    }

    res.status(200).json({ reservaId: nuevaReserva._id });
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({ mensaje: "Error al crear reserva", error });
  }
};

export { crearReserva };
