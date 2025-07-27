const mongoose = require("mongoose");

const reservaTemporalSchema = new mongoose.Schema({
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio" },
  terapeutaId: { type: mongoose.Schema.Types.ObjectId, ref: "Terapeuta" },
  nombreUsuario: String,
  emailUsuario: String,
  mensaje: String,
  fecha: String,
  hora: String,
  creadaEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ReservaTemporal", reservaTemporalSchema);
