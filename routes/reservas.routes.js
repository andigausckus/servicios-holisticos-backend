const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");
const Bloqueo = require("../models/Bloqueo");
const authMiddleware = require("../middlewares/auth");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Zoho",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const adminEmail = "notificaciones@serviciosholisticos.com.ar";

// Crear una nueva reserva
router.post("/", async (req, res) => {
  try {
    const nueva = new Reserva(req.body);
    await nueva.save();

    if (nueva.estado === "en_proceso") {
      setTimeout(async () => {
        try {
          const actualizada = await Reserva.findById(nueva._id);
          if (actualizada && actualizada.estado === "en_proceso") {
            await Reserva.findByIdAndDelete(nueva._id);
            await Bloqueo.deleteOne({
              servicioId: actualizada.servicioId,
              fecha: actualizada.fechaReserva,
              hora: actualizada.horaReserva,
            });
            console.log("⏱ Reserva liberada automáticamente por tiempo expirado");
          }
        } catch (error) {
          console.error("❌ Error en temporizador de liberación:", error);
        }
      }, 2 * 60 * 1000);
    }

    res.status(201).json({ mensaje: "✅ Reserva registrada", reserva: nueva });
  } catch (error) {
    console.error("❌ Error al guardar reserva:", error);
    res.status(500).json({ mensaje: "❌ Error al guardar reserva", error });
  }
});

// Actualizar estado de una reserva
router.put("/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    const reservaAntes = await Reserva.findById(req.params.id).populate("terapeutaId servicioId");
    const reservaActualizada = await Reserva.findByIdAndUpdate(req.params.id, { estado }, { new: true });

    if (estado === "confirmada") {
      const {
        nombre,
        usuarioEmail,
        fechaReserva,
        horaReserva,
        duracion,
        precio,
        servicioId,
        terapeutaId,
      } = reservaAntes;

      const whatsappEnlace = `https://wa.me/549${terapeutaId?.whatsapp?.replace(/\D/g, "")}`;

      const emailInfo = {
        asunto: `Nueva sesión confirmada: ${servicioId?.titulo || "Servicio"}`,
        html: `
          <p>✅ <strong>Sesi&oacute;n confirmada</strong></p>
          <p><strong>Cliente:</strong> ${nombre} (${usuarioEmail})</p>
          <p><strong>Terapeuta:</strong> ${terapeutaId?.nombreCompleto} (${terapeutaId?.email})</p>
          <p><strong>WhatsApp del terapeuta:</strong> <a href="${whatsappEnlace}" target="_blank">${terapeutaId?.whatsapp}</a></p>
          <p><strong>Servicio:</strong> ${servicioId?.titulo}</p>
          <p><strong>Fecha:</strong> ${fechaReserva}</p>
          <p><strong>Hora:</strong> ${horaReserva}</p>
          <p><strong>Duraci&oacute;n:</strong> ${duracion} minutos</p>
          <p><strong>Precio:</strong> $${precio}</p>
          <hr/>
          <p><strong>Datos bancarios del terapeuta:</strong></p>
          <p><strong>Banco:</strong> ${terapeutaId?.banco || "No especificado"}</p>
          <p><strong>CBU/CVU:</strong> ${terapeutaId?.cbu || "No especificado"}</p>
        `,
      };

      const destinatarios = [usuarioEmail, terapeutaId?.email, adminEmail].filter(Boolean);

      for (const destinatario of destinatarios) {
        await transporter.sendMail({
          from: `"Servicios Holísticos" <${process.env.EMAIL_USER}>`,
          to: destinatario,
          subject: emailInfo.asunto,
          html: emailInfo.html,
        });
        console.log(`📨 Email enviado a ${destinatario}`);
      }

      // Email de reseña luego de finalizar la sesión
      const finSesion = calcularFinSesion(fechaReserva, horaReserva, duracion);
      const ahora = new Date();
      const delayMs = Math.max(finSesion.getTime() - ahora.getTime() + 60 * 1000, 0); // 1 min después

      setTimeout(() => {
        transporter.sendMail({
          from: `"Servicios Holísticos" <${process.env.EMAIL_USER}>`,
          to: usuarioEmail,
          subject: "🧘‍♀️ ¿Cómo fue tu sesión?",
          html: `
            <p>Esperamos que hayas disfrutado tu sesión con <strong>${terapeutaId?.nombreCompleto}</strong>.</p>
            <p>¿Te gustaría dejar una reseña?</p>
            <p><a href="https://serviciosholisticos.com.ar/resenas">Dejar reseña</a></p>
          `,
        });
        console.log(`📩 Email de reseña enviado a ${usuarioEmail}`);
      }, delayMs);
    }

    res.json({ mensaje: "✅ Estado actualizado", reserva: reservaActualizada });
  } catch (error) {
    console.error("❌ Error al actualizar reserva:", error);
    res.status(500).json({ mensaje: "❌ No se pudo actualizar la reserva", error });
  }
});

// Obtener todas las reservas
router.get("/", async (req, res) => {
  try {
    const reservas = await Reserva.find().populate("servicioId terapeutaId");
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al obtener reservas", error });
  }
});

// Obtener reservas por terapeuta autenticado
router.get("/mias", authMiddleware, async (req, res) => {
  try {
    const reservas = await Reserva.find({ terapeutaId: req.user.id }).populate("servicioId");
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al obtener tus reservas", error });
  }
});

// Eliminar una reserva (por ID)
router.delete("/:id", async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    if (!reserva) {
      return res.status(404).json({ mensaje: "❌ Reserva no encontrada" });
    }
    await reserva.deleteOne();
    await Bloqueo.deleteOne({
      servicioId: reserva.servicioId,
      fecha: reserva.fechaReserva,
      hora: reserva.horaReserva,
    });
    res.json({ mensaje: "✅ Reserva eliminada y horario liberado" });
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al eliminar reserva", error });
  }
});

function calcularFinSesion(fecha, hora, duracionMin) {
  const [h, m] = hora.split(":");
  const inicio = new Date(`${fecha}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`);
  return new Date(inicio.getTime() + duracionMin * 60000);
}

module.exports = router;
