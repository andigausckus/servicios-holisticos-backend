const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference } = require("mercadopago");
const { enviarComprobante } = require("../utils/email"); // ✅ importar función

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
      marketplace_fee: marketplace_fee || 0,
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

module.exports = router;
