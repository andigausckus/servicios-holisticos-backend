const mongoose = require("mongoose");

const servicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  modalidad: {
    type: [String], // Array como ["Online", "Presencial"]
    enum: ["Presencial", "Online"],
    required: true,
  },
  ubicacion: {
    type: String,
    validate: {
      validator: function (valor) {
        // Solo es obligatorio si incluye "Presencial"
        return this.modalidad.includes("Presencial") ? !!valor : true;
      },
      message: "La ubicación es obligatoria para servicios presenciales.",
    },
  },
  duracion: { type: Number, required: true }, // minutos totales
  precio: { type: Number, required: true },
  categoria: { type: String, required: true },
  plataformas: {
    type: [String],
    enum: ["WhatsApp", "Zoom", "Skype", "Google Meet"],
    required: true,
  },
  imagen: { type: String },
  terapeuta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Terapeuta",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Servicio", servicioSchema);
