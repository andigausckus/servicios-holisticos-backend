const mongoose = require("mongoose");

const disponibilidadSchema = new mongoose.Schema({
  terapeuta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Terapeuta",
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  horarios: [
    {
      hora: { type: String, required: true }, // Ej: "10:00"
      disponible: { type: Boolean, default: true },
    },
  ],
});

module.exports = mongoose.model("Disponibilidad", disponibilidadSchema);
