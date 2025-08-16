const mongoose = require("mongoose");

const resenaSchema = new mongoose.Schema(
  {
    terapeuta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Terapeuta",
      required: true,
    },
    servicio: { // 🔹 Nuevo campo
      type: mongoose.Schema.Types.ObjectId,
      ref: "Servicio",
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    comentario: {
      type: String,
      trim: true,
    },
    puntaje: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    aprobado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resena", resenaSchema);
