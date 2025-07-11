const express = require("express");
const router = express.Router();
const Bloqueo = require("../models/Bloqueo");

// Crear bloqueo
router.post("/", async (req, res) => {
  const { servicioId, fecha, hora } = req.body;
  if (!servicioId || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const ahora = new Date();
  const desbloqueo = new Date(ahora.getTime() + 10 * 60000);

  try {
    await Bloqueo.create({
      servicioId,
      fecha,
      hora,
      bloqueadoHasta: desbloqueo,
    });
    res.status(200).json({ ok: true, bloqueadoHasta: desbloqueo });
  } catch (err) {
    res.status(500).json({ error: "Error al bloquear horario" });
  }
});

// Verificar bloqueo
router.get("/verificar", async (req, res) => {
  const { servicioId, fecha, hora } = req.query;
  try {
    const bloqueo = await Bloqueo.findOne({ servicioId, fecha, hora });

    if (!bloqueo) return res.status(200).json({ libre: true });

    const ahora = new Date();
    if (bloqueo.bloqueadoHasta > ahora) {
      return res.status(200).json({ libre: false });
    } else {
      await Bloqueo.deleteOne({ _id: bloqueo._id });
      return res.status(200).json({ libre: true });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al verificar bloqueo" });
  }
});

module.exports = router;
