const mongoose = require("mongoose");

const reservaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: false },
  terapeutaId: { type: mongoose.Schema.Types.ObjectId, ref: "Terapeuta", required: true },
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio", required: true },
  fecha: { type: String, required: true },
  hora: { type: String, required: true },
  estado: {
    type: String,
    enum: ["en_proceso", "pendiente_de_aprobacion", "confirmada", "cancelada"],
    default: "en_proceso",
  },
  creadaEn: { type: Date, default: Date.now },
  comprobanteUrl: { type: String, default: "" },
});

module.exports = mongoose.model("Reserva", reservaSchema);
