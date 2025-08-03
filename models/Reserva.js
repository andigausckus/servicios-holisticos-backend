const mongoose = require("mongoose");

const reservaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: false },
  terapeuta: { type: mongoose.Schema.Types.ObjectId, ref: "Terapeuta", required: true },
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio", required: true },
  fecha: { type: String, required: true },
  hora: { type: String, required: true },
  duracion: { type: Number, required: true },
  precio: { type: Number, required: true },
  nombreUsuario: { type: String, required: true },
  emailUsuario: { type: String, required: true },
  estado: {
    type: String,
    enum: ["pendiente", "confirmada", "cancelada"],
    default: "pendiente",
  },
  comprobantePago: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Reserva", reservaSchema);
