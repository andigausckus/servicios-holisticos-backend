const mongoose = require("mongoose");

const servicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  modalidad: { type: String, required: true }, // Presencial / Virtual / Ambas
  ubicacion: { type: String, required: true },
  duracion: { type: String, required: true }, // Ej: "1 hora"
  precio: { type: Number, required: true },
  categoria: { type: String, required: true }, // Ej: "Reiki"
  imagen: { type: String }, // Nombre del archivo
  terapeuta: { type: mongoose.Schema.Types.ObjectId, ref: "Terapeuta", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Servicio", servicioSchema);
