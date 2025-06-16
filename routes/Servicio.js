const mongoose = require("mongoose");

const ServicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  modalidad: { type: [String], required: true }, // ["Online", "Presencial"]
  ubicacion: String,
  duracion: { type: Number, required: true },
  precio: { type: Number, required: true },
  categoria: { type: String, required: true },
  terapeuta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Terapeuta",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Servicio", ServicioSchema);
