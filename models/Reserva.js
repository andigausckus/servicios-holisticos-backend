const mongoose = require("mongoose");

const reservaSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: false },
  terapeutaId: { type: mongoose.Schema.Types.ObjectId, ref: "Terapeuta", required: true },
  servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio", required: true },
  fecha: { 
    type: String, 
    required: true, 
    match: [/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"] 
  },
  hora: { 
    type: String, 
    required: true, 
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"] 
  },
  duracion: { type: Number, required: true },
  precio: { type: Number, required: true },
  nombreUsuario: { type: String, required: true },
  emailUsuario: { type: String, required: true },
  estado: {
    type: String,
    enum: ["pendiente", "confirmada", "cancelada", "aprobada"],
    default: "pendiente",
  },
  comprobantePago: { type: String, required: true },

  reseñaEnviada: { type: Boolean, default: false },
  emailResenaEnviado: { type: Boolean, default: false },

  // 👇 Nuevo campo para programar el envío automático de reseñas
  fechaHoraEnvioResena: { type: Date },
}, 
{ timestamps: true });

module.exports = mongoose.model("Reserva", reservaSchema);
