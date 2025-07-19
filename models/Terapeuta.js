const mongoose = require("mongoose");

// Rango horario genérico
const rangoSchema = new mongoose.Schema({
  desde: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm)"]
  },
  hasta: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm)"]
  }
}, { _id: false });

const disponibilidadSemanaSchema = new mongoose.Schema({
  dia: {
    type: String,
    required: true,
    enum: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  },
  rangos: {
    type: [rangoSchema],
    default: []
  }
}, { _id: false });

const disponibilidadFechaSchema = new mongoose.Schema({
  fecha: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"]
  },
  rangos: {
    type: [rangoSchema],
    default: []
  }
}, { _id: false });

const reseñaSchema = new mongoose.Schema({
  usuario: String,
  comentario: String,
  puntuacion: { type: Number, min: 1, max: 5 }
}, { _id: false });

const servicioSchema = new mongoose.Schema({
  titulo: String,
  descripcion: String,
  duracion: String,
  modalidad: String,
  precio: Number,
  reseñas: [reseñaSchema]
}, { _id: false });

const TerapeutaSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: [true, "El nombre completo es obligatorio"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "El email es obligatorio"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, "Debe ser un email válido"]
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"]
  },
  whatsapp: {
    type: String,
    required: [true, "El número de WhatsApp es obligatorio"],
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: "El número de WhatsApp debe tener exactamente 10 dígitos (sin 0 ni 15)."
    }
  },
  ubicacion: {
    type: String,
    trim: true
  },
  especialidades: {
    type: [String],
    default: []
  },
  modalidad: {
    type: String,
    enum: ["Online", "Presencial", "Ambas"]
  },
  fotoPerfil: String,
  fotoPortada: String,

  // 🔵 Datos de pago
  cbuCvu: {
    type: String,
    required: [true, "El CBU/CVU es obligatorio"],
    validate: {
      validator: function (v) {
        return /^\d{22}$/.test(v);
      },
      message: "El CBU/CVU debe tener exactamente 22 dígitos."
    }
  },
  bancoOBilletera: {
    type: String,
    required: [true, "El banco o billetera es obligatorio"],
    enum: [
      "Mercado Pago",
      "Ualá",
      "Naranja X",
      "Brubank",
      "Banco Nación",
      "Banco Provincia",
      "Banco Galicia",
      "Banco Santander",
      "Banco BBVA",
      "Banco Macro"
    ]
  },

  aprobado: {
    type: Boolean,
    default: true
  },

  disponibilidad: {
    type: [disponibilidadSemanaSchema],
    default: []
  },

  disponibilidadPorFechas: {
    type: [disponibilidadFechaSchema],
    default: []
  },

  horariosBloqueados: {
    type: [
      {
        fecha: { type: String, required: true },
        hora: { type: String, required: true },
        expiracion: { type: Date, required: true }
      }
    ],
    default: []
  },

  servicios: [servicioSchema]
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ⭐ Virtual para calcular promedio de reseñas
TerapeutaSchema.virtual('puntuacionPromedio').get(function () {
  let totalPuntuacion = 0;
  let totalReseñas = 0;

  this.servicios.forEach(servicio => {
    servicio.reseñas.forEach(reseña => {
      totalPuntuacion += reseña.puntuacion;
      totalReseñas += 1;
    });
  });

  if (totalReseñas === 0) return 0;
  return (totalPuntuacion / totalReseñas).toFixed(1);
});

module.exports = mongoose.model("Terapeuta", TerapeutaSchema);
