const mongoose = require("mongoose");

const terapeutaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true,
    minlength: [3, "El nombre debe tener al menos 3 caracteres"]
  },
  descripcion: {
    type: String,
    required: [true, "La descripción es obligatoria"],
    minlength: [10, "La descripción debe tener al menos 10 caracteres"]
  },
  especialidad: {
    type: String,
    required: [true, "La especialidad es obligatoria"]
  }
});

module.exports = mongoose.model("Terapeuta", terapeutaSchema);
