const express = require("express");
const router = express.Router();
const MensajeGlobal = require("../models/MensajeGlobal");

// Obtener mensaje actual
router.get("/", async (req, res) => {
  const mensaje = await MensajeGlobal.findOne().sort({ creadoEn: -1 });
  res.json(mensaje || {});
});

// Crear o actualizar (puede haber solo uno)
router.post("/", async (req, res) => {
  const { contenido } = req.body;

  // Si existe, actualizamos. Si no, creamos nuevo.
  let mensaje = await MensajeGlobal.findOne();
  if (mensaje) {
    mensaje.contenido = contenido;
    await mensaje.save();
  } else {
    mensaje = await MensajeGlobal.create({ contenido });
  }

  res.json({ mensaje: "✅ Comunicado guardado", data: mensaje });
});

module.exports = router;
