const mongoose = require("mongoose");

const TerapeutaSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"]
  },
  fechaNacimiento: {
    type: String,
    required: [true, "La fecha de nacimiento es obligatoria"]
  },
  telefono: {
    type: String,
    required: [true, "El teléfono es obligatorio"],
    match: [/^\d{10}$/, "El número debe tener 10 dígitos"]
  },
  ubicacion: {
    type: String,
    required: true,
    trim: true
  },
  disponibilidad: [
  {
    dia: { type: String },
    rangos: [
      {
        desde: { type: String },  // Ej: "10:00"
        hasta: { type: String }   // Ej: "11:30"
      }
    ]
  }
]
});

module.exports = mongoose.model("Terapeuta", TerapeutaSchema);
