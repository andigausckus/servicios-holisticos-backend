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
this.slug = slugify(this.titulo, { lower: true, strict: true });
}
next();
});

module.exports = mongoose.model("Servicio", servicioSchema);

2. En admin.routes.js tengo



router.put("/aprobar-servicio/:id", async (req, res) => {
try {
const { aprobado } = req.body;

// 1️⃣ Actualizamos el servicio dentro del array del terapeuta  
const terapeuta = await Terapeuta.findOne({ "servicios._id": req.params.id });  
if (!terapeuta) return res.status(404).json({ mensaje: "Servicio no encontrado" });  

const servicio = terapeuta.servicios.id(req.params.id);  
servicio.aprobado = aprobado;  
servicio.rechazado = false;  

await terapeuta.save();  

// 2️⃣ Sincronizamos con la colección Servicios  
const ServicioModel = require("../models/Servicio"); // ajusta la ruta  
await ServicioModel.findByIdAndUpdate(  
  req.params.id,  
  {  
    aprobado: aprobado,  
    rechazado: false,  
    titulo: servicio.titulo,  
    descripcion: servicio.descripcion,  
    modalidad: servicio.modalidad,  
    duracionMinutos: servicio.duracionMinutos,  
    precio: servicio.precio,  
    categoria: servicio.categoria,  
    plataformas: servicio.plataformas,  
    imagen: servicio.imagen,  
    slug: servicio.slug,  
    terapeuta: servicio.terapeuta,  
    horariosDisponibles: servicio.horariosDisponibles,  
  },  
  { new: true, upsert: true }  
);  

res.json({ mensaje: "✅ Servicio aprobado y sincronizado", servicio });

} catch (error) {
res.status(500).json({ mensaje: "Error al aprobar servicio", error });
}
});

router.put("/rechazar-servicio/:id", async (req, res) => {
try {
const terapeuta = await Terapeuta.findOne({ "servicios._id": req.params.id });
if (!terapeuta) return res.status(404).json({ mensaje: "Servicio no encontrado" });

const servicio = terapeuta.servicios.id(req.params.id);  
servicio.aprobado = false;  
servicio.rechazado = true; // 👈 clave  

await terapeuta.save();  
res.json({ mensaje: "❌ Servicio rechazado", servicio });

} catch (error) {
res.status(500).json({ mensaje: "Error al rechazar servicio", error });
}
});

3. En el frontend tengo



const refrescarServicios = async () => {
const token = localStorage.getItem("token");
if (!token) return;

try {  
  const res = await fetch(  
    "https://servicios-holisticos-backend.onrender.com/api/servicios/mis-servicios",  
    {  
      headers: {  
        Authorization: `Bearer ${token}` // ✅ template literal  
      }  
    }  
  );  
  const data = await res.json();  
  setMisServicios(data || []);  
} catch (err) {  
  console.error("Error al refrescar servicios:", err);  
}

};


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

        estado: {
  type: String,
  enum: ["pendiente", "aprobado", "rechazado"],
  default: "pendiente"
             }

}, { timestamps: true });

// Middleware para generar el slug automáticamente
servicioSchema.pre("save", function(next) {
if (this.titulo && !this.slug) {
this.slug = slugify(this.titulo, { lower: true, strict: true });
}
next();
});

module.exports = mongoose.model("Servicio", servicioSchema);
