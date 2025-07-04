const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference } = require("mercadopago");
const UsuarioReserva = require("../models/UsuarioReserva");

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  locale: "es-AR",
});

router.post("/crear-preferencia", async (req, res) => {
  try {
    console.log("📥 Body recibido en /crear-preferencia:", req.body);
    const { items, payer, marketplace_fee, shipments, additional_info } = req.body;

    // ✅ Guardar datos del usuario en MongoDB
    const nuevaReserva = new UsuarioReserva({
      nombre: payer?.name || "Sin nombre",
      email: payer?.email || "Sin email",
      telefono: payer?.phone?.number || "Sin teléfono",
      mensaje: additional_info || "",
      servicioId: items?.[0]?.servicioId || null, // Esto solo si lo mandás
      terapeutaId: items?.[0]?.terapeutaId || null, // Esto también opcional
      fechaReserva: items?.[0]?.fechaReserva || "", // También podrías enviar estos datos
      horaReserva: items?.[0]?.horaReserva || "",
    });

    await nuevaReserva.save();
    console.log("✅ UsuarioReserva guardado:", nuevaReserva._id);

    // ✅ Crear preferencia de MercadoPago
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
        success: "https://1f721fac-38a2-4d72-830f-70b269359703-00-2quue1dbfg8v2.riker.replit.dev/gracias",
        failure: "https://1f721fac-38a2-4d72-830f-70b269359703-00-2quue1dbfg8v2.riker.replit.dev/pago-fallido",
        pending: "https://1f721fac-38a2-4d72-830f-70b269359703-00-2quue1dbfg8v2.riker.replit.dev/pago-pendiente",
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
