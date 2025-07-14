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
    const { items, payer, additional_info } = req.body;

    const preference = {
      items,
      payer,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      shipments: {},
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
      const paymentClient = new Payment(mercadopago);
const { body: payment } = await paymentClient.get({ id: data.id });
      if (!payment) return res.sendStatus(200);

      if (payment.status === "approved") {
        const preference_id = payment.preference_id;
        const payer = payment.payer;
        console.log("👤 Payer recibido del payment:", payer);

        // Obtener preferencia
        const prefResponse = await fetch(`https://api.mercadopago.com/checkout/preferences/${preference_id}`, {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        });

        const prefData = await prefResponse.json();
        console.log("📦 Preferencia (prefData):", prefData);
        const item = prefData.items?.[0];

        if (!item || !payer || !payer.email) {
          console.warn("❗ Preferencia incompleta o sin email del usuario:", payer);
          return res.sendStatus(200);
        }

        const yaExiste = await Reserva.findOne({ paymentId: payment.id });
        if (yaExiste) return res.sendStatus(200);

        // Crear reserva
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

        // Eliminar bloqueo
        await Bloqueo.findOneAndDelete({
          servicioId: item.servicioId,
          fecha: item.fechaReserva,
          hora: item.horaReserva,
        });

        // Obtener terapeuta
        const terapeuta = await Terapeuta.findById(item.terapeutaId);
        if (!terapeuta) {
          console.warn("⚠️ Terapeuta no encontrado:", item.terapeutaId);
          return res.sendStatus(200);
        }

        // 📧 Enviar email al usuario
        await enviarComprobante({
          destinatario: payer.email,
          asunto: "🌟 Confirmación de tu sesión en Servicios Holísticos",
          html: `
            <h2>🌿 ¡Gracias por tu reserva!</h2>
            <p>Hola ${payer.name || "usuario/a"},</p>
            <p>Tu sesión con <strong>${terapeuta.nombreCompleto}</strong> está confirmada.</p>
            <p>📅 Fecha: ${item.fechaReserva}</p>
            <p>⏰ Hora: ${item.horaReserva}</p>
            <br />
            <h3>📞 Datos de contacto del terapeuta</h3>
            <p>✉️ <strong>Email:</strong> ${terapeuta.email}</p>
            <p>📱 <strong>WhatsApp:</strong> ${terapeuta.whatsapp}</p>
            <br />
            <p>Podés escribirle directamente si tenés alguna duda o el día de la sesión para coordinar.</p>
            <p>Gracias por elegir Servicios Holísticos 🙌</p>
          `
        });

        // 📧 Enviar email al terapeuta
        await enviarComprobante({
          destinatario: terapeuta.email,
          asunto: "📬 ¡Nueva reserva confirmada!",
          html: `
            <h2>🧘‍♀️ ¡Tenés una nueva reserva!</h2>
            <p>Hola ${terapeuta.nombreCompleto},</p>
            <p>Un usuario ha reservado tu servicio <strong>${item.title}</strong>.</p>
            <p>📅 Fecha: ${item.fechaReserva}</p>
            <p>⏰ Hora: ${item.horaReserva}</p>
            <p>💻 Plataforma: ${item.plataforma || "a coordinar"}</p>
            <br />
            <p>El usuario se llama <strong>${payer.name || "sin nombre"}</strong> y puede contactarte si tiene dudas.</p>
            <p>También podés escribirle vos si lo necesitás para coordinar.</p>
            <br />
            <p>¡Gracias por formar parte de Servicios Holísticos! 💜</p>
          `
        });

        console.log("✅ Reserva confirmada y correos enviados:", nuevaReserva._id);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook de pago:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
