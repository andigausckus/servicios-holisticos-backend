const express = require("express");
const router = express.Router();
const {
  crearReservaConComprobante,
  crearReservaTemporal,
  obtenerReservas,
  aprobarReserva,
  cancelarReserva,
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

module.exports = router;
