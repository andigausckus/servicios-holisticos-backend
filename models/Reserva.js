const mongoose = require("mongoose");

const reservaSchema = new mongoose.Schema({
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio", required: true },
  terapeutaId: { type: mongoose.Schema.Types.ObjectId, ref: "Terapeuta", required: true },
  usuarioNombre: { type: String, required: true },
  usuarioEmail: { type: String, required: true },
  usuarioTelefono: { type: String, required: true },
  fechaReserva: { type: String, required: true },
  horaReserva: { type: String, required: true },
  precio: { type: Number, required: true },
  plataforma: { type: String },

  estado: { type: String, default: "confirmada" },
  paymentId: { type: String },        // 🆕 ID del pago en MP
  preferenceId: { type: String },     // 🆕 ID de preferencia

  creadoEn: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reserva", reservaSchema);
