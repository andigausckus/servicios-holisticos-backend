const mongoose = require("mongoose");

const BloqueoSchema = new mongoose.Schema({
  servicioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Servicio",
    required: true,
  },
  fecha: { type: String, required: true }, // formato: "2025-07-10"
  hora: { type: String, required: true },   // formato: "14:30"
  bloqueadoHasta: { type: Date, required: true },
});

module.exports = mongoose.model("Bloqueo", BloqueoSchema);
