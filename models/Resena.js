const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  comentario: { type: String, required: true },
  aprobada: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resena', resenaSchema);