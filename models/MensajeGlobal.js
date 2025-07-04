const mongoose = require("mongoose");

const mensajeGlobalSchema = new mongoose.Schema({
  contenido: {
    type: String,
    required: true
  },
  creadoEn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MensajeGlobal", mensajeGlobalSchema);
