const express = require("express");
const router = express.Router();
const Terapeuta = require("../models/Terapeuta");
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

// Guardar disponibilidad por fechas (formato tradicional de fechas + rangos)
router.post("/terapeutas/disponibilidad", verificarToken, async (req, res) => {
  try {
    const { disponibilidad } = req.body;

    console.log("🧠 Disponibilidad recibida:", disponibilidad);

    if (!Array.isArray(disponibilidad) || disponibilidad.length === 0) {
      return res.status(400).json({ error: "Datos inválidos: no hay días con disponibilidad" });
    }

    // Validación: cada día debe tener una fecha válida y al menos un rango correcto
    for (const dia of disponibilidad) {
      if (
        !dia.fecha ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dia.fecha) ||
        !Array.isArray(dia.rangos) ||
        dia.rangos.length === 0
      ) {
        console.log("🚫 Día inválido:", dia);
        return res.status(400).json({
          error: `Día inválido o sin rangos: ${JSON.stringify(dia)}`
        });
      }

      for (const r of dia.rangos) {
        if (
          !r.desde ||
          !r.hasta ||
          !/^([01]\d|2[0-3]):([0-5]\d)$/.test(r.desde) ||
          !/^([01]\d|2[0-3]):([0-5]\d)$/.test(r.hasta)
        ) {
          console.log("🚫 Rango inválido:", r);
          return res.status(400).json({
            error: `Rango horario inválido: ${JSON.stringify(r)}`
          });
        }
      }
    }

    // Actualizar en la base de datos
    await Terapeuta.findByIdAndUpdate(
      req.terapeutaId,
      { disponibilidadPorFechas: disponibilidad },
      { new: true, runValidators: true }
    );

    res.json({ mensaje: "Disponibilidad guardada correctamente" });
  } catch (error) {
    console.error("❌ Error al guardar disponibilidad:", error);
    res.status(500).json({ error: "Error al guardar disponibilidad" });
  }
});

// Obtener disponibilidad pública por terapeuta
router.get("/disponibilidad-fechas/:terapeutaId", async (req, res) => {
  try {
    const { terapeutaId } = req.params;

    const terapeuta = await Terapeuta.findById(terapeutaId);
    if (!terapeuta) {
      return res.status(404).json({ error: "Terapeuta no encontrado" });
    }

    res.json(terapeuta.disponibilidadPorFechas || []);
  } catch (error) {
    console.error("Error al obtener disponibilidad pública:", error);
    res.status(500).json({ error: "Error al obtener disponibilidad" });
  }
});

module.exports = router;
