const mongoose = require("mongoose");
const slugify = require("slugify");

// Subdocumento para los bloques horarios por día
const horarioSchema = new mongoose.Schema({
fecha: {
type: String,
required: true,
match: [/^\d{4}-\d{2}-\d{2}$/, "Formato inválido. Debe ser YYYY-MM-DD"]
},
horariosFijos: [
{
desde: {
type: String,
required: true,
match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"]
},
hasta: {
type: String,
required: true,
match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato inválido (HH:mm)"]
}
}
]
}, { _id: false });

// Subdocumento para reseñas
const resenaSchema = new mongoose.Schema({
usuario: {
type: mongoose.Schema.Types.ObjectId,
ref: "Usuario",
required: true
},
comentario: { type: String, required: true },
calificacion: { type: Number, min: 1, max: 5, required: true }
}, { timestamps: true });

// Modelo principal de Servicio
const servicioSchema = new mongoose.Schema({
titulo: { type: String, required: true },
slug: { type: String, unique: true },
descripcion: { type: String, required: true },
modalidad: {
type: String,
enum: ["Online", "Presencial", "Ambas"],
required: true
},
duracionMinutos: { type: Number, required: true },
precio: { type: Number, required: true },
categoria: { type: String, required: true },
plataformas: { type: [String], default: [] },
imagen: { type: String },
terapeuta: {
type: mongoose.Schema.Types.ObjectId,
ref: "Terapeuta",
required: true
},
horariosDisponibles: { type: [horarioSchema], default: [] },
resenas: { type: [resenaSchema], default: [] },
aprobado: { type: Boolean, default: false } // 👈 ahora queda pendiente
}, { timestamps: true });

// Middleware para generar el slug automáticamente
servicioSchema.pre("save", function(next) {
  if (this.titulo && !this.slug) {
    this.slug = slugify(this.titulo, {
      lower: true,   // convierte todo a minúsculas
      strict: true,  // elimina acentos y caracteres no alfanuméricos
      locale: "es"   // soporte para español
    });
  }
  next();
});

module.exports = mongoose.model("Servicio", servicioSchema);
