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

// Crear reserva con comprobante
router.post("/con-comprobante", crearReservaConComprobante);

// Crear reserva temporal sin comprobante (usado antes de subir comprobante)
router.post("/temporal", crearReservaTemporal);

router.get('/temporales/expiracion', verificarExpiracionReserva);

// Obtener todas las reservas (admin)
router.get("/", obtenerReservas);

// Confirmar manualmente una reserva
router.patch("/:id/aprobar", aprobarReserva);

// Cancelar una reserva
router.patch("/:id/cancelar", cancelarReserva);

router.get('/estado', obtenerEstadoReserva);

// Obtener estado actual de bloqueos y reservas para un servicio
router.get("/estado-actual/:servicioId", async (req, res) => {
  const { servicioId } = req.params;
  const ahora = new Date();
  const desde = new Date(ahora);
  const hasta = new Date(ahora);
  hasta.setDate(hasta.getDate() + 7); // próximos 7 días

  try {
    const reservas = await Reserva.find({
      servicioId,
      fecha: { $gte: desde.toISOString().slice(0, 10), $lte: hasta.toISOString().slice(0, 10) }
    });

    const bloqueos = await Bloqueo.find({
      servicioId,
      fecha: { $gte: desde.toISOString().slice(0, 10), $lte: hasta.toISOString().slice(0, 10) }
    });

    const reservasMap = {};
    reservas.forEach((r) => {
      const key = `${r.fecha}-${r.hora}`;
      reservasMap[key] = r;
    });

    const bloqueosMap = {};
    bloqueos.forEach((b) => {
      const key = `${b.fecha}-${b.hora}`;
      bloqueosMap[key] = b;
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

router.get("/estado-actual/:id", obtenerBloqueosYReservas);

module.exports = router;