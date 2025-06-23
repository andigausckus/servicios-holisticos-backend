const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference } = require("mercadopago");

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  locale: "es-AR",
});

router.post("/crear-preferencia", async (req, res) => {
  try {
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
        success: "https://serviciosholisticos.com.ar/gracias",
        failure: "https://serviciosholisticos.com.ar/pago-fallido",
        pending: "https://serviciosholisticos.com.ar/pago-pendiente",
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

module.exports = router;
