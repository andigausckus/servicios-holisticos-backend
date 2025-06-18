const express = require("express");
const mercadopago = require("mercadopago");
const router = express.Router();

router.post("/crear-preferencia", async (req, res) => {
  try {
    const { items, payer, marketplace_fee, shipments } = req.body;

    // Configura la preferencia con split de mercado pago
    const preference = {
      items,
      payer,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      marketplace_fee: marketplace_fee || 0, // comisión para el marketplace (opcional)
      shipments,
      back_urls: {
  success: "https://tuservicio.com/gracias",
  failure: "https://tuservicio.com/pago-fallido",
  pending: "https://tuservicio.com/pago-pendiente",
},
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia de pago" });
  }
});

module.exports = router;
