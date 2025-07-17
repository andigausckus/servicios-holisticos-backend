const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Reserva = require("../models/Reserva");
const Bloqueo = require("../models/Bloqueo");
const Terapeuta = require("../models/Terapeuta");
const { enviarComprobante } = require("../utils/email");

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  locale: "es-AR",
});

// ✅ Crear preferencia
router.post("/crear-preferencia", async (req, res) => {
  try {
    console.log("📥 Body recibido en /crear-preferencia:", req.body);
    const { items, payer, shipments, additional_info } = req.body;

    const metadata = {
      servicio_id: items[0].servicioId,
      terapeuta_id: items[0].terapeutaId,
      fecha_reserva: items[0].fechaReserva,
      hora_reserva: items[0].horaReserva,
      plataforma: items[0].plataforma || ""
    };

    const itemsConMetadata = items.map((item) => ({
      ...item
    }));

    const preference = {
      items: itemsConMetadata,
      payer,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      shipments,
      additional_info,
      metadata,
      back_urls: {
        success: "https://www.serviciosholisticos.com.ar/gracias",
        failure: "https://www.serviciosholisticos.com.ar/pago-fallido",
        pending: "https://www.serviciosholisticos.com.ar/pago-pendiente",
      },
      auto_return: "approved",
    };

    const pref = new Preference(mercadopago);
    const result = await pref.create({ body: preference });

    // 🔄 Guardar reserva temporal (estado: "en_proceso")
    const reservaTemporal = new Reserva({
      servicioId: metadata.servicio_id,
      terapeutaId: metadata.terapeuta_id,
      fechaReserva: metadata.fecha_reserva,
      horaReserva: metadata.hora_reserva,
      usuarioEmail: payer.email || "desconocido",
      estado: "en_proceso",
      creadaEn: new Date(),
    });

    await reservaTemporal.save();

    // ⏱️ Eliminar si no se confirma en 2 minutos
    setTimeout(async () => {
      const reservaActual = await Reserva.findOne({ _id: reservaTemporal._id });
      if (reservaActual && reservaActual.estado === "en_proceso") {
        await Reserva.deleteOne({ _id: reservaTemporal._id });
        console.log("⏱️ Reserva temporal eliminada por timeout");
      }
    }, 2 * 60 * 1000); // 2 minutos

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia", detalle: error.message });
  }
});

// ✅ Webhook de Mercado Pago
router.post("/webhook", async (req, res) => {
  try {
    console.log("🟡 Webhook recibido de Mercado Pago:", req.body);
    const { type, data } = req.body;

    if (type === "payment") {
      const payment = await new Payment(mercadopago).get({ id: data.id });

      if (payment && payment.status === "approved") {
        const preference_id = payment.preference_id;
        const payer = payment.payer;
        console.log("👤 Payer recibido del payment:", payer);

        const metadata = payment.metadata || {};
        console.log("📦 Metadata recibido:", metadata);

        const servicioId = metadata.servicio_id;
        const terapeutaId = metadata.terapeuta_id;
        const fechaReserva = metadata.fecha_reserva;
        const horaReserva = metadata.hora_reserva;
        const plataforma = metadata.plataforma || "";

        if (!servicioId || !fechaReserva || !payer?.email) {
          console.warn("❗ Metadata incompleto o sin email del usuario:", payer);
          return res.sendStatus(200);
        }

        const yaExiste = await Reserva.findOne({ paymentId: payment.id });
        if (yaExiste) return res.sendStatus(200);

        const nuevaReserva = new Reserva({
          servicioId,
          terapeutaId,
          usuarioNombre: payer.name || "Sin nombre",
          usuarioEmail: payer.email,
          usuarioTelefono: payer.phone?.number || "No especificado",
          fechaReserva,
          horaReserva,
          precio: payment.transaction_amount || 0,
          plataforma,
          estado: "confirmada",
          paymentId: payment.id,
          preferenceId: preference_id,
        });

        await nuevaReserva.save();

        // Eliminar bloqueo fijo (si existiera)
        await Bloqueo.findOneAndDelete({
          servicioId,
          fecha: fechaReserva,
          hora: horaReserva,
        });

        console.log("✅ Reserva confirmada por webhook:", nuevaReserva);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook de pago:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
