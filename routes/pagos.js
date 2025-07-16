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

    // ✅ Metadata global (ya no por item)
    const metadata = {
      servicioId: items[0].servicioId,
      terapeutaId: items[0].terapeutaId,
      fechaReserva: items[0].fechaReserva,
      horaReserva: items[0].horaReserva,
      plataforma: items[0].plataforma || ""
    };

    // ✅ Limpiar items para evitar errores
    const itemsFormateados = items.map((item) => ({
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      currency_id: item.currency_id,
      unit_price: item.unit_price,
    }));

    const preference = {
      items: itemsFormateados,
      payer,
      metadata, // ✅ Ahora sí llega correctamente al webhook
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      shipments,
      additional_info,
      back_urls: {
        success: "https://www.serviciosholisticos.com.ar/gracias",
        failure: "https://www.serviciosholisticos.com.ar/pago-fallido",
        pending: "https://www.serviciosholisticos.com.ar/pago-pendiente",
      },
      auto_return: "approved",
    };

    const pref = new Preference(mercadopago);
    const result = await pref.create({ body: preference });

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
        const metadata = payment.metadata || {};

        console.log("👤 Payer recibido del payment:", payer);
        console.log("📦 Metadata recibido:", metadata);

        // Validar datos clave
        if (!metadata.servicioId || !metadata.fechaReserva || !payer?.email) {
          console.warn("❗ Metadata incompleto o sin email del usuario:", payer);
          return res.sendStatus(200);
        }

        // Evitar duplicados
        const yaExiste = await Reserva.findOne({ paymentId: payment.id });
        if (yaExiste) return res.sendStatus(200);

        // Crear reserva confirmada
        const nuevaReserva = new Reserva({
          servicioId: metadata.servicioId,
          terapeutaId: metadata.terapeutaId,
          usuarioNombre: payer.name || "Sin nombre",
          usuarioEmail: payer.email,
          usuarioTelefono: payer.phone?.number || "",
          fechaReserva: metadata.fechaReserva,
          horaReserva: metadata.horaReserva,
          precio: payment.transaction_amount || 0,
          plataforma: metadata.plataforma || "",
          estado: "confirmada",
          paymentId: payment.id,
          preferenceId: preference_id,
        });

        await nuevaReserva.save();

        // Eliminar el bloqueo temporal
        await Bloqueo.findOneAndDelete({
          servicioId: metadata.servicioId,
          fecha: metadata.fechaReserva,
          hora: metadata.horaReserva,
        });

        console.log("✅ Reserva confirmada por webhook:", nuevaReserva._id);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook de pago:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
