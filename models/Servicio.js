const mongoose = require("mongoose");

// Subdocumento para horarios disponibles
const horarioSchema = new mongoose.Schema({
  dia: {
    type: String,
    required: true,
    enum: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  },
  hora: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (debe ser HH:mm)"]
  }
}, { _id: false });

// Modelo principal de Servicio
const servicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true }, // En frontend: "Título"
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
  imagen: { type: String }, // nombre del archivo de imagen
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
