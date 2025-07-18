const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");
const Bloqueo = require("../models/Bloqueo");
const authMiddleware = require("../middlewares/auth");

// ✅ Crear nueva reserva
router.post("/", async (req, res) => {
  try {
    const nueva = new Reserva(req.body);
    await nueva.save();

    // ⏱ Liberación automática si no se confirma en 2 minutos
    if (nueva.estado === "en_proceso") {
      setTimeout(async () => {
        try {
          const actualizada = await Reserva.findById(nueva._id);
          if (actualizada && actualizada.estado === "en_proceso") {
            await Reserva.findByIdAndDelete(nueva._id); // Eliminás la reserva temporal
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
      }, 2 * 60 * 1000); // 2 minutos
    }

    res.status(201).json({ mensaje: "✅ Reserva registrada", reserva: nueva });
  } catch (error) {
    console.error("❌ Error al guardar reserva:", error);
    res.status(500).json({ mensaje: "❌ Error al guardar reserva", error });
  }
});

// ✅ Obtener TODAS las reservas (uso general o para admin)
router.get("/", async (req, res) => {
  try {
    const reservas = await Reserva.find()
      .sort({ fecha: -1 })
      .populate("servicioId terapeutaId");
    res.json(reservas);
  } catch (error) {
    console.error("❌ Error al obtener reservas:", error);
    res.status(500).json({ mensaje: "❌ Error al obtener reservas", error });
  }
});

// ✅ Obtener SOLO las reservas del terapeuta logueado
router.get("/mis-reservas", authMiddleware, async (req, res) => {
  try {
    const reservas = await Reserva.find({ terapeutaId: req.user.id }).sort({ fecha: -1 });
    res.json(reservas);
  } catch (err) {
    res.status(500).json({ mensaje: "❌ Error al obtener reservas", error: err });
  }
});

// ✅ Actualizar estado de una reserva
router.put("/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    const reservaAntes = await Reserva.findById(req.params.id).populate("terapeutaId servicioId");
    const reservaActualizada = await Reserva.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (estado === "confirmada") {
  const axios = require("axios");

  const emailData = {
    nombreCliente: reservaAntes.nombre,
    emailCliente: reservaAntes.usuarioEmail,
    nombreTerapeuta: reservaAntes.terapeutaId?.nombreCompleto || "Sin nombre",
    emailTerapeuta: reservaAntes.terapeutaId?.email || "Sin email",
    nombreServicio: reservaAntes.servicioId?.titulo || "Sin título",
    fecha: reservaAntes.fechaReserva,
    hora: reservaAntes.horaReserva,
    duracion: reservaAntes.duracion,
    precio: reservaAntes.precio,
  };

  console.log("📨 Preparando envío de emails...");
  console.log("📧 Datos del email:", emailData);

  try {
    const response = await axios.post(
      "https://servicios-holisticos-backend.onrender.com/api/emails/enviar-comprobante",
      emailData
    );
    console.log("✅ Email enviado correctamente:", response.data);
  } catch (err) {
    console.error("❌ Error al enviar el email:", err?.response?.data || err.message || err);
  }

    
    res.json({ mensaje: "✅ Estado actualizado", reserva: reservaActualizada });
  } catch (error) {
    console.error("❌ Error al actualizar reserva:", error);
    res.status(500).json({ mensaje: "❌ No se pudo actualizar la reserva", error });
  }
});

// ✅ Liberar un horario bloqueado (cuando expira el temporizador)
router.post("/liberar", async (req, res) => {
  const { servicioId, fecha, hora } = req.body;

  if (!servicioId || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const result = await Bloqueo.deleteOne({ servicioId, fecha, hora });

    if (result.deletedCount === 0) {
      return res.status(404).json({ mensaje: "No se encontró bloqueo para liberar" });
    }

    res.json({ mensaje: "⛔ Reserva liberada correctamente" });
  } catch (error) {
    console.error("❌ Error al liberar reserva:", error);
    res.status(500).json({ error: "Error al liberar reserva" });
  }
});

// ✅ Obtener la reserva más reciente por email
router.get("/reciente", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Falta el email" });

  const reserva = await Reserva.findOne({ usuarioEmail: email })
    .sort({ createdAt: -1 })
    .populate({
      path: "terapeutaId",
      select: "nombreCompleto ubicacion whatsapp",
    })
    .populate({
      path: "servicioId",
      select: "titulo descripcion",
    });

  if (!reserva) return res.status(404).json({ error: "No se encontró la reserva" });

  res.json(reserva);
});

// ✅ Obtener reservas confirmadas por servicio (evita conflicto con /)
router.get("/por-servicio", async (req, res) => {
  try {
    const { servicioId } = req.query;
    if (!servicioId) return res.status(400).json({ error: "Falta servicioId" });

    const reservas = await Reserva.find({ servicioId, estado: "confirmada" });
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener reservas" });
  }
});

// ✅ Obtener todas las HORAS CONFIRMADAS para un servicio en una fecha específica
router.get("/confirmadas", async (req, res) => {
  const { servicioId, fecha } = req.query;

  if (!servicioId || !fecha) {
    return res.status(400).json({ error: "Faltan servicioId o fecha" });
  }

  try {
    const reservas = await Reserva.find({ servicioId, fechaReserva: fecha, estado: "confirmada" });
    const horasConfirmadas = reservas.map(r => r.horaReserva);
    res.json(horasConfirmadas);
  } catch (error) {
    console.error("❌ Error al obtener horas confirmadas:", error);
    res.status(500).json({ error: "Error al obtener horas confirmadas" });
  }
});

module.exports = router;
