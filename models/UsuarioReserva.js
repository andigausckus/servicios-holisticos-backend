const mongoose = require("mongoose");

const UsuarioReservaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  telefono: { type: String, required: true },
  mensaje: { type: String },
  fechaReserva: { type: String },
  horaReserva: { type: String },
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio" },
  terapeutaId: { type: mongoose.Schema.Types.ObjectId, ref: "Terapeuta" },
}, { timestamps: true });

module.exports = mongoose.model("UsuarioReserva", UsuarioReservaSchema);
