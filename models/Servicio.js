const mongoose = require("mongoose");

// Subdocumento para los bloques horarios por día
const horarioSchema = new mongoose.Schema({
  fecha: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, "Formato inválido. Debe ser YYYY-MM-DD"]
  },
  horariosFijos: [
    {
      desde: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"]
      },
      hasta: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"]
      }
    }
  ]
}, { _id: false });

// Modelo principal de Servicio
const servicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  modalidad: {
    type: String,
    enum: ["Online", "Presencial", "Ambas"],
    required: true
  },
  duracionMinutos: { type: Number, required: true },
  precio: { type: Number, required: true },
  categoria: { type: String, required: true },
  plataformas: { type: [String], default: [] },
  imagen: { type: String },
  terapeuta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Terapeuta",
    required: true
  },
  horariosDisponibles: {
    type: [horarioSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Servicio", servicioSchema);
