const express = require("express");
const router = express.Router();
const Reserva = require("../models/Reserva");
const verificarToken = require("../middlewares/auth");

const {
  crearReservaConComprobante,
  obtenerReservas,
  aprobarReserva,
  cancelarReserva,
  crearReservaTemporal,
  verificarExpiracionReserva,
  obtenerEstadoReserva,
  obtenerReservasConfirmadas,
  enviarResenasPendientes,
} = require("../controllers/reservasController");

router.post("/", crearReservaConComprobante);
router.get("/", obtenerReservas);
router.post("/temporal", crearReservaTemporal);
router.post("/verificar-expiracion", verificarExpiracionReserva);
router.get("/estado", obtenerEstadoReserva);
router.post("/aprobar/:id", aprobarReserva);
router.post("/cancelar/:id",
cancelarReserva);
router.get("/admin/reservas-confirmadas", obtenerReservasConfirmadas);
// Ruta para obtener reservas confirmadas y bloqueos (incluye bloqueos temporales)
router.get("/enviar-resenas-pendientes", enviarResenasPendientes);
router.get("/estado-actual/:servicioId", async (req, res) => {
  const { servicioId } = req.params;
  const ahora = new Date();
  const desde = new Date(ahora);
  const hasta = new Date(ahora);
  hasta.setDate(hasta.getDate() + 7);

  try {
    const Reserva = require("../models/Reserva");
    const BloqueoTemporal = require("../models/BloqueoTemporal");

    const reservas = await Reserva.find({
      servicioId,
      fecha: {
        $gte: desde.toISOString().slice(0, 10),
        $lte: hasta.toISOString().slice(0, 10),
      },
      estado: "confirmada",
    });

    const bloqueosEnProceso = await Reserva.find({
      servicioId,
      fecha: {
        $gte: desde.toISOString().slice(0, 10),
        $lte: hasta.toISOString().slice(0, 10),
      },
      estado: "en_proceso",
    });

    const bloqueosTemporales = await BloqueoTemporal.find({
  servicioId,
  fecha: {
    $gte: desde.toISOString().slice(0, 10),
    $lte: hasta.toISOString().slice(0, 10),
  },
  expiracion: { $gt: ahora },
});

const reservasMap = {};
reservas.forEach((r) => {
  const key = `${r.fecha}-${r.hora}`;
  reservasMap[key] = {
    estado: "confirmada",
    userId: r.userId?.toString(),
  };
});

    const bloqueosMap = {};
    bloqueosEnProceso.forEach((b) => {
      const key = `${b.fecha}-${b.hora}`;
      bloqueosMap[key] = true;
    });

    bloqueosTemporales.forEach((b) => {
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

    // GET: obtener los datos de una reserva
router.get("/:id", async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id).populate("terapeuta");
    if (!reserva) {
      return res.status(404).json({ mensaje: "Reserva no encontrada" });
    }
    res.status(200).json(reserva);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener la reserva", error });
  }
});

router.get("/mis-reservas", verificarToken, async (req, res) => {
  try {
    const reservas = await Reserva.find({ terapeutaId: req.user._id })
      .sort({ fecha: -1 })
      .lean();

    const reservasConDatosUsuario = reservas.map((reserva) => ({
      ...reserva,
      usuarioNombre: reserva.nombreUsuario || "Cliente",
      usuarioEmail: reserva.emailUsuario || "Sin email",
    }));

    res.json(reservasConDatosUsuario);
  } catch (error) {
    console.error("❌ Error al obtener mis reservas:", error);
    res.status(500).json({ mensaje: "Error al obtener tus reservas", error });
  }
});

module.exports = router;
