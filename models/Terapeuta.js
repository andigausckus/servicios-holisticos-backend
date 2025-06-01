const mongoose = require("mongoose");

const terapeutaSchema = new mongoose.Schema({
  nombre: String,
  especialidad: String,
  descripcion: String,
  email: String,
  telefono: String,
});

module.exports = mongoose.model("Terapeuta", terapeutaSchema);
