const mongoose = require("mongoose");

const TerapeutaSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: [true, "El nombre y apellido son obligatorios"],
    trim: true,
    minlength: [3, "El nombre debe tener al menos 3 caracteres"]
  },
  email: {
    type: String,
    required: [true, "El email es obligatorio"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, "Ingrese un email válido"]
  },
  contraseña: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"]
  },
  especialidades: {
    type: String,
    required: [true, "La especialidad es obligatoria"],
    trim: true
  },
  modalidad: {
    type: String,
    required: [true, "La modalidad es obligatoria"],
    enum: ["presencial", "online", "ambas"]
  },
  ubicacion: {
    type: String,
    required: [true, "La ubicación es obligatoria"],
    trim: true
  },
  // Campos opcionales para agregar luego desde el panel
  redesSociales: {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },
  fotoPerfilUrl: {
    type: String,
  },
  descripcionProfesional: {
    type: String,
    trim: true
  },
  emailConfirmado: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Terapeuta", TerapeutaSchema);
