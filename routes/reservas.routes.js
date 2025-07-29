const express = require("express");
const router = express.Router();
const {
  crearReservaConComprobante,
  obtenerReservas,
  aprobarReserva,
  cancelarReserva,
  crearReservaTemporal,
  verificarExpiracionReserva,
  obtenerEstadoReserva,
} = require("../controllers/reservasController");

router.post("/", crearReservaConComprobante);
router.get("/", obtenerReservas);
router.post("/temporal", crearReservaTemporal);
router.post("/verificar-expiracion", verificarExpiracionReserva);
router.get("/estado", obtenerEstadoReserva);
router.post("/aprobar/:id", aprobarReserva);
router.post("/cancelar/:id", cancelarReserva);

// Ruta para obtener bloqueos y reservas (formato clave fecha-hora)
router.get("/estado-actual/:servicioId", async (req, res) => {
  const { servicioId } = req.params;
  const ahora = new Date();
  const desde = new Date(ahora);
  const hasta = new Date(ahora);
  hasta.setDate(hasta.getDate() + 7);

  try {
    const reservas = await require("../models/Reserva").find({
      servicioId,
      fecha: {
        $gte: desde.toISOString().slice(0, 10),
        $lte: hasta.toISOString().slice(0, 10),
      },
      estado: "confirmada",
    });

    const bloqueos = await require("../models/Reserva").find({
      servicioId,
      fecha: {
        $gte: desde.toISOString().slice(0, 10),
        $lte: hasta.toISOString().slice(0, 10),
      },
      estado: "en_proceso",
    });

    const reservasMap = {};
    reservas.forEach((r) => {
      const key = `${r.fecha}-${r.hora}`;
      reservasMap[key] = true;
    });

    const bloqueosMap = {};
    bloqueos.forEach((b) => {
      const key = `${b.fecha}-${b.hora}`;
      bloqueosMap[key] = true;
    });

    res.json({
      reservas: reservasMap,
      bloqueos: bloqueosMap,
    });
  } catch (error) {
    console.error("Error al obtener bloqueos + reservas:", error);
    res.status(500).json({ error: "Error al obtener bloqueos y reservas" });
  }
});

module.exports = router;