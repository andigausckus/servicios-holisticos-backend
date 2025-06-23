const mongoose = require("mongoose");

const rangoSchema = new mongoose.Schema({
  desde: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (debe ser HH:mm)"]
  },
  hasta: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (debe ser HH:mm)"]
  }
}, { _id: false });

const disponibilidadSchema = new mongoose.Schema({
  dia: {
    type: String,
    required: true,
    enum: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  },
  rangos: {
    type: [rangoSchema],
    default: []
  }
}, { _id: false });

const TerapeutaSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: [true, "El nombre completo es obligatorio"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "El email es obligatorio"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, "Debe ser un email válido"]
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"]
  },
  especialidades: {
    type: String,
    required: [true, "Al menos una especialidad es obligatoria"]
  },
  ubicacion: {
    type: new mongoose.Schema({
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }, { _id: false }),
    required: false
  },
  disponibilidad: {
    type: [disponibilidadSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Terapeuta", TerapeutaSchema);
