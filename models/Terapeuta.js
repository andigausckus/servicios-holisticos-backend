const mongoose = require("mongoose");

const TerapeutaSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"]
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  telefono: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "El número debe tener 10 dígitos"]
  },
  ubicacion: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Terapeuta", TerapeutaSchema);
