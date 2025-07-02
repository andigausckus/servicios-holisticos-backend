const express = require("express");
const router = express.Router();
const Disponibilidad = require("../models/Disponibilidad");
const jwt = require("jsonwebtoken");

// Middleware para verificar token
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.terapeutaId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

// Función para dividir un rango en bloques
function dividirEnHorarios(desde, hasta, duracionMinutos = 30) {
  const [hDesde, mDesde] = desde.split(":").map(Number);
  const [hHasta, mHasta] = hasta.split(":").map(Number);

  const fechaDesde = new Date(0, 0, 0, hDesde, mDesde);
  const fechaHasta = new Date(0, 0, 0, hHasta, mHasta);

  const horarios = [];

  while (fechaDesde < fechaHasta) {
    const hora = fechaDesde.toTimeString().slice(0, 5); // "HH:mm"
    horarios.push({ hora, disponible: true });
    fechaDesde.setMinutes(fechaDesde.getMinutes() + duracionMinutos);
  }

  return horarios;
}

// ✅ Guardar disponibilidad semanal
router.post("/terapeutas/disponibilidad", verificarToken, async (req, res) => {
  try {
    const { disponibilidad } = req.body;

    if (!Array.isArray(disponibilidad) || disponibilidad.length === 0) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    // Borrar disponibilidad previa en ese rango de fechas
    const fechas = disponibilidad.map((d) => new Date(d.fecha));
    const desde = new Date(Math.min(...fechas));
    const hasta = new Date(Math.max(...fechas));
    await Disponibilidad.deleteMany({
      terapeuta: req.terapeutaId,
      fecha: { $gte: desde, $lte: hasta },
    });

    // Crear nuevos bloques de horarios
    const bloques = [];

    disponibilidad.forEach((dia) => {
      let horarios = [];
      dia.rangos.forEach((rango) => {
        const generados = dividirEnHorarios(rango.desde, rango.hasta, 30); // Podés cambiar a 60 si tus sesiones son de 1h fijas
        horarios.push(...generados);
      });

      bloques.push({
        terapeuta: req.terapeutaId,
        fecha: new Date(dia.fecha),
        horarios,
      });
    });

    await Disponibilidad.insertMany(bloques);
    res.json({ mensaje: "Disponibilidad guardada correctamente" });
  } catch (error) {
    console.error("❌ Error al guardar disponibilidad:", error);
    res.status(500).json({ error: "Error al guardar disponibilidad" });
  }
});

// ✅ Obtener horarios cargados por el terapeuta entre dos fechas
router.get("/mis-horarios", verificarToken, async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Faltan fechas desde y hasta" });
    }

    const horarios = await Disponibilidad.find({
      terapeuta: req.terapeutaId,
      fecha: { $gte: new Date(desde), $lte: new Date(hasta) },
    });

    res.json(horarios);
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    res.status(500).json({ error: "Error al obtener horarios" });
  }
});

// ✅ Obtener disponibilidad pública por terapeuta
router.get("/disponibilidad-fechas/:terapeutaId", async (req, res) => {
  try {
    const { terapeutaId } = req.params;

    const hoy = new Date();
    const lunes = new Date(hoy);
    const diaSemana = hoy.getDay();
    lunes.setDate(hoy.getDate() - ((diaSemana + 6) % 7)); // lunes
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    const horarios = await Disponibilidad.find({
      terapeuta: terapeutaId,
      fecha: { $gte: lunes, $lte: domingo },
    });

    res.json(horarios);
  } catch (error) {
    console.error("Error al obtener disponibilidad pública:", error);
    res.status(500).json({ error: "Error al obtener disponibilidad" });
  }
});

module.exports = router;
