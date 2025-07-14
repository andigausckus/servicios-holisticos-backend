const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { enviarComprobante } = require("../utils/email"); // ✅ importar función
const { Payment } = require("mercadopago");
const Reserva = require("../models/Reserva");
const Bloqueo = require("../models/Bloqueo");

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  locale: "es-AR",
});

router.post("/crear-preferencia", async (req, res) => {
  try {
    console.log("📥 Body recibido en /crear-preferencia:", req.body);
    const { items, payer, marketplace_fee, shipments, additional_info } = req.body;

    const preference = {
      items,
      payer,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      marketplace_fee: Math.floor((items?.[0]?.unit_price || 0) * 0.1),
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

    // 🔐 Email opcional, lo activamos después del primer pago real:
    /*
    await enviarComprobante({
      destinatario: payer.email,
      asunto: "Confirmación de tu reserva en Servicios Holísticos",
      html: `
        <h2>🌟 Gracias por tu reserva</h2>
        <p>Hola ${payer.name},</p>
        <p>Confirmamos tu sesión con el terapeuta ${items[0].description}.</p>
        <p>Nos comunicaremos en caso de novedades.</p>
        <p>📅 Fecha: ${items[0].fechaReserva}</p>
        <p>⏰ Hora: ${items[0].horaReserva}</p>
        <p>💸 Precio: $${items[0].unit_price}</p>
      `
    });
    */

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia", detalle: error.message });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    console.log("🟡 Webhook recibido de Mercado Pago:", req.body);
    const { type, data } = req.body;

    if (type === "payment") {
      const payment = await new Payment(mercadopago).get({ id: data.id });
      
      if (payment.status === "approved") {
        const preference_id = payment.preference_id;
const payer = payment.payer; // ✅ este sí tiene el email real
        console.log("👤 Payer recibido del payment:", payer);


        // Obtenemos la preferencia para saber qué servicio, fecha y hora
        const prefResponse = await fetch(`https://api.mercadopago.com/checkout/preferences/${preference_id}`, {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        });

        const prefData = await prefResponse.json();
        const item = prefData.items?.[0];
        console.log("📦 Preferencia (prefData):", prefData);

        if (!item || !payer || !payer.email) {
  console.warn("❗ Preferencia incompleta o sin email del usuario:", payer);
  return res.sendStatus(200);
}

        // ✅ Evitar duplicados
        const yaExiste = await Reserva.findOne({ paymentId: payment.id });
        if (yaExiste) return res.sendStatus(200);

        // 💾 Crear reserva
        const nuevaReserva = new Reserva({
          servicioId: item.servicioId,
          terapeutaId: item.terapeutaId,
          usuarioNombre: payer.name || "Sin nombre",
          usuarioEmail: payer.email,
          usuarioTelefono: payer.phone?.number || "",
          fechaReserva: item.fechaReserva,
          horaReserva: item.horaReserva,
          precio: item.unit_price,
          plataforma: item.plataforma || "",
          estado: "confirmada",
          paymentId: payment.id,
          preferenceId: preference_id,
        });

        await nuevaReserva.save();

        // 🧼 Eliminar bloqueo temporal (si existe)
        await Bloqueo.findOneAndDelete({
          servicioId: item.servicioId,
          fecha: item.fechaReserva,
          hora: item.horaReserva,
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
