const mongoose = require("mongoose");

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

const servicioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  duracionMinutos: { type: Number, required: true },
  terapeuta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Terapeuta",
    required: true,
  },
  horariosDisponibles: {
    type: [horarioSchema],
    default: [],
  }
}, { timestamps: true });

module.exports = mongoose.model("Servicio", servicioSchema);
