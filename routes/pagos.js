const express = require("express");
const mercadopago = require("mercadopago");
const router = express.Router();

// ✅ Ruta de prueba para confirmar que el endpoint está funcionando
router.get("/pagos", (req, res) => {
  res.send("✅ Ruta de pagos funcionando");
});

// Ruta para crear una preferencia de pago
router.post("/crear-preferencia", async (req, res) => {
  try {
    const { items, payer, marketplace_fee, shipments } = req.body;

    const preference = {
      items,
      payer,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      marketplace_fee: marketplace_fee || 0,
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
