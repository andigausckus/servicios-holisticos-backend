const express = require("express");
const router = express.Router();
const MensajeGlobal = require("../models/MensajeGlobal");

// ✅ Obtener mensaje actual
router.get("/", async (req, res) => {
  try {
    const mensaje = await MensajeGlobal.findOne().sort({ creadoEn: -1 });
    res.json(mensaje || {});
  } catch (err) {
    console.error("❌ Error al obtener el mensaje global:", err.message);
    res.status(500).json({ error: "Error interno al obtener el mensaje" });
  }
});

// ✅ Crear o actualizar mensaje global
router.post("/", async (req, res) => {
  try {
    const { contenido } = req.body;

    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({ error: "El contenido del mensaje no puede estar vacío." });
    }

    let mensaje = await MensajeGlobal.findOne();
    if (mensaje) {
      mensaje.contenido = contenido;
      await mensaje.save();
    } else {
      mensaje = await MensajeGlobal.create({ contenido });
    }

    res.json({ mensaje: "✅ Comunicado guardado", data: mensaje });
  } catch (err) {
    console.error("❌ Error al guardar el mensaje global:", err.message);
    res.status(500).json({ error: "Error interno al guardar el mensaje" });
  }
});

module.exports = router;