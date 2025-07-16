const mongoose = require("mongoose");

const BloqueoTemporalSchema = new mongoose.Schema({
  servicioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Servicio",
    required: true,
  },
  fecha: { type: String, required: true }, // formato: "2025-07-12"
  hora: { type: String, required: true },   // formato: "14:00"
  expiracion: { type: Date, required: true }, // hasta cuándo es válido el bloqueo
}, {
  timestamps: true,
});

module.exports = mongoose.model("BloqueoTemporal", BloqueoTemporalSchema);
