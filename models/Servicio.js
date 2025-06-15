const mongoose = require("mongoose");

const servicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  modalidad: { 
    type: String, 
    required: true,
    enum: ["Presencial", "Online"] // para evitar valores inválidos
  },
  ubicacion: {
    type: String,
    validate: {
      validator: function (valor) {
        // Solo es obligatorio si la modalidad es presencial
        return this.modalidad === "Presencial" ? !!valor : true;
      },
      message: "La ubicación es obligatoria para servicios presenciales."
    }
  },
  duracion: { type: String, required: true },
  precio: { type: Number, required: true },
  categoria: { type: String, required: true },
  imagen: { type: String },
  terapeuta: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Terapeuta", 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model("Servicio", servicioSchema);
