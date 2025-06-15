const express = require("express");
const router = express.Router();

// Ejemplo simple de ruta POST para crear servicio (sin controlador externo)
router.post("/", (req, res) => {
  // Aquí podés poner la lógica básica o solo un mensaje por ahora
  res.json({ message: "Ruta POST /api/servicios activa (sin lógica aún)" });
});

router.get("/", (req, res) => {
  res.send("✅ Ruta de servicios activa");
});

module.exports = router;
