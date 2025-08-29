const mongoose = require("mongoose");

const resenaSchema = new mongoose.Schema(
  {
    terapeuta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Terapeuta",
      required: true,
    },
    servicio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Servicio",
      required: true,
    },
    usuarioId: { // opcional para usuarios registrados
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: false,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: { // ⚠️ agregado para controlar reseñas duplicadas
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
