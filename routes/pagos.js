const express = require("express");
const router = express.Router();
const { mercadopago } = require("../server"); // usamos la instancia exportada

router.get("/pagos", (req, res) => {
  res.send("✅ Ruta de pagos funcionando");
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
        success: "https://tuservicio.com/gracias",
        failure: "https://tuservicio.com/pago-fallido",
        pending: "https://tuservicio.com/pago-pendiente",
      },
      auto_return: "approved",
    };

    const result = await mercadopago.preferences.create({ body: preference });
    res.json({ init_point: result.body.init_point });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia de pago", detalle: error.message });
  }
});

module.exports = router;
