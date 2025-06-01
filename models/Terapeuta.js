const mongoose = require("mongoose");

const terapeutaSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  especialidad: String  // <-- Campo agregado
});

module.exports = mongoose.model("Terapeuta", terapeutaSchema);
