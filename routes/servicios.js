const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const Terapeuta = require("../models/Terapeuta");
const jwt = require("jsonwebtoken");
const Bloqueo = require("../models/Bloqueo");
const Reserva = require("../models/Reserva");
const mongoose = require("mongoose"); // asegurate de tener esta línea al comienzo del archivo
const Resena = require("../models/Resena"); // ⬅️ agregar
const verificarToken = require("../middlewares/auth");

// ✅ Crear servicio (como estaba antes)
router.post("/", verificarToken, async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      modalidad,
      duracionMinutos,
      precio,
      categoria,
      plataformas,
      imagen,
    } = req.body;

    if (!titulo || !descripcion || !modalidad || !duracionMinutos || !precio || !categoria) {  
      return res.status(400).json({ error: "Faltan campos obligatorios." });  
    }  

    // Traer datos del terapeuta actual
    const terapeuta = await Terapeuta.findById(req.user.id);
    if (!terapeuta) return res.status(404).json({ error: "Terapeuta no encontrado" });

    const nuevoServicio = new Servicio({  
      titulo,  
      descripcion,  
      modalidad,  
      duracionMinutos,  
      precio,  
      categoria,  
      plataformas: typeof plataformas === "string" ? JSON.parse(plataformas) : plataformas,  
      terapeuta: terapeuta._id,  // ⬅️ Antes solo el ID
      imagen: imagen || null,  
      aprobado: false, // queda pendiente de aprobación
    });  

    await nuevoServicio.save();  

    res.status(201).json({ _id: nuevoServicio._id });

  } catch (err) {
    console.error("Error al crear servicio:", err);
    res.status(500).json({ error: "Error al crear el servicio." });
  }
});

// ✅ Obtener todos los servicios con promedio y cantidad de reseñas
router.get("/", async (req, res) => {
try {
const servicios = await Servicio.find({ aprobado: true }).populate("terapeuta");

if (!Array.isArray(servicios)) {  
  console.error("❌ No se obtuvo un array de servicios:", servicios);  
  return res.status(500).json({ error: "No se pudo obtener los servicios" });  
}  

// Para cada servicio, obtener sus reseñas aprobadas y calcular promedio  
const conRatings = await Promise.all(  
  servicios.map(async (s) => {  
    const resenas = await Resena.find({

servicio: s._id,  // 🔹 filtrar SOLO por este servicio
aprobado: true,
}).select("puntaje");
const suma = resenas.reduce((acc, r) => acc + (r.puntaje || 0), 0);
const promedio = resenas.length ? (suma / resenas.length) : 0;

const obj = s.toObject();  
    obj.cantidadResenas = resenas.length;  
    obj.promedioResenas = Number(promedio.toFixed(1));  
    return obj;  
  })  
);  

res.json(conRatings);

} catch (err) {
console.error("❌ Error real al obtener los servicios:", err.message, err.stack);
res.status(500).json({ error: "Error al obtener los servicios" });
}
});

// ✅ Obtener servicios del terapeuta autenticado
router.get("/mis-servicios", verificarToken, async (req, res) => {
try {
const servicios = await Servicio.find({ terapeuta: req.terapeutaId });
res.json(servicios);
} catch (err) {
console.error("Error al obtener tus servicios:", err);
res.status(500).json({ error: "Error al obtener tus servicios" });
}
});

// GET /api/servicios/publico/:slug
router.get("/publico/:slug", async (req, res) => {
const { slug } = req.params;

try {
const servicio = await Servicio.findOne({ slug }).populate(
"terapeuta",
"nombreCompleto"
);

if (!servicio) {  
  return res.status(404).json({ error: "Servicio no encontrado" });  
}  

// Obtener reseñas aprobadas de este servicio

const reseñas = await Resena.find({
servicio: servicio._id,   // ✅ reseñas SOLO de este servicio
aprobado: true
}).select("nombre comentario puntaje createdAt"); // ✅ usamos 'nombre' porque lo tenés en el schema

// Calcular promedio de estrellas  
const totalEstrellas = reseñas.reduce((acc, r) => acc + (r.puntaje || 0), 0);  
const promedioEstrellas = reseñas.length > 0 ? totalEstrellas / reseñas.length : 0;  

res.json({  
  ...servicio.toObject(),  
  duracion: servicio.duracionMinutos,  
  terapeutaId: servicio.terapeuta?._id,  
  horariosDisponibles: servicio.horariosDisponibles || [],  
  plataformas: servicio.plataformas || [],  
  reseñas,  
  promedioEstrellas: Number(promedioEstrellas.toFixed(1)),  
  totalReseñas: reseñas.length  
});

} catch (err) {
console.error("❌ Error al obtener servicio público:", err);
res.status(500).json({ error: "Error al obtener el servicio público" });
}
});

// 🧹 Limpiar horarios inválidos (temporal)
router.post("/admin/limpiar-horarios-invalidos", async (req, res) => {
const servicios = await Servicio.find();
let totalLimpiados = 0;

for (const servicio of servicios) {
let cambiado = false;

const nuevosHorarios = (servicio.horariosDisponibles || []).map(dia => {  
  const horariosFijos = (dia.horariosFijos || []).filter(h => h.desde && h.hasta);  
  if (horariosFijos.length !== dia.horariosFijos.length) {  
    cambiado = true;  
  }  
  return { ...dia, horariosFijos };  
});  

if (cambiado) {  
  servicio.horariosDisponibles = nuevosHorarios;  
  await servicio.save();  
  totalLimpiados++;  
}

}

res.json({ mensaje: "Horarios inválidos eliminados", serviciosActualizados: totalLimpiados });
});

// ✅ Obtener un servicio privado por ID
router.get("/:id", verificarToken, async (req, res) => {
try {
const servicio = await Servicio.findOne({
_id: req.params.id,
terapeuta: req.terapeutaId,
});

if (!servicio) {  
  return res.status(404).json({ error: "Servicio no encontrado" });  
}  

res.json(servicio);

} catch (err) {
console.error("Error al obtener servicio:", err);
res.status(500).json({ error: "Error al obtener el servicio" });
}
});

// ✅ Actualizar un servicio
router.put("/:id", verificarToken, async (req, res) => {
try {
const servicioExistente = await Servicio.findOne({
  _id: req.params.id,
  terapeuta: req.user.id,
});

if (!servicioExistente) {  
  return res.status(404).json({ error: "Servicio no encontrado" });  
}  

const {  
  titulo,  
  descripcion,  
  modalidad,  
  duracionMinutos,  
  precio,  
  categoria,  
  plataformas,  
  imagen,  
} = req.body;  

if (  
  !titulo?.trim() ||  
  !descripcion?.trim() ||  
  !modalidad ||  
  duracionMinutos === undefined ||  
  isNaN(duracionMinutos) ||  
  !precio ||  
  !categoria?.trim() ||  
  !plataformas || plataformas.length === 0  
) {  
  return res.status(400).json({ error: "Faltan campos obligatorios." });  
}  

// ✅ Actualizar campos editables  
servicioExistente.titulo = titulo;  
servicioExistente.descripcion = descripcion;  
servicioExistente.modalidad = modalidad;  
servicioExistente.duracionMinutos = duracionMinutos;  
servicioExistente.precio = precio;  
servicioExistente.categoria = categoria;  
servicioExistente.plataformas = plataformas;  

if (imagen) {  
  servicioExistente.imagen = imagen;  
}  

// 🚀 Importante: NO tocar el estado. Mantener el que ya tiene  
// Ejemplo: si ya está "aprobado", queda igual  
// servicioExistente.estado = servicioExistente.estado;  

await servicioExistente.save();  

res.json({  
  mensaje: "Servicio actualizado correctamente",  
  servicio: servicioExistente,  
});

} catch (err) {
console.error("Error al actualizar servicio:", err);
res.status(500).json({ error: "Error al actualizar el servicio." });
}
});

// ✅ Eliminar un servicio
router.delete("/:id", verificarToken, async (req, res) => {
try {
const servicio = await Servicio.findOneAndDelete({
_id: req.params.id,
terapeuta: req.terapeutaId,
});

if (!servicio) {  
  return res.status(404).json({ error: "Servicio no encontrado o ya eliminado" });  
}  

await Terapeuta.findByIdAndUpdate(req.terapeutaId, {  
  $pull: { servicios: { _id: servicio._id } },  
});  

res.json({ mensaje: "Servicio eliminado correctamente.", eliminadoId: servicio._id });

} catch (err) {
console.error("Error al eliminar servicio:", err);
res.status(500).json({ error: "Error al eliminar el servicio." });
}
});

// ✅ Guardar o actualizar horarios del servicio
router.put("/:id/horarios", verificarToken, async (req, res) => {
try {
const { id } = req.params;
const { horarios } = req.body;

if (!Array.isArray(horarios)) {  
  return res.status(400).json({ error: "Horarios inválidos" });  
}  

await Servicio.findByIdAndUpdate(id, {  
  horariosDisponibles: horarios,  
});  

res.json({ mensaje: "Horarios guardados correctamente" });

} catch (error) {
console.error("Error al guardar horarios:", error);
res.status(500).json({ error: "Error al guardar horarios" });
}
});

// ✅ Actualizar estado de un horario específico
router.put("/actualizar-horario", async (req, res) => {
const { servicioId, fecha, hora, nuevoEstado } = req.body;

try {
const servicio = await Servicio.findById(servicioId);
if (!servicio) {
return res.status(404).json({ error: "Servicio no encontrado" });
}

const dia = servicio.horariosDisponibles.find((d) => d.fecha === fecha);  
if (!dia) {  
  return res.status(404).json({ error: "Fecha no encontrada en horariosDisponibles" });  
}  

const horario = dia.horariosFijos.find((h) => h.desde === hora);  
if (!horario) {  
  return res.status(404).json({ error: "Hora no encontrada en horariosFijos" });  
}  

horario.estado = nuevoEstado;  

await servicio.save();  

res.json({ ok: true, mensaje: "Estado del horario actualizado correctamente" });

} catch (error) {
console.error("❌ Error al actualizar horario:", error);
res.status(500).json({ error: "Error interno al actualizar horario" });
}
});

// ruta: POST /api/servicios/:id/resena
router.post("/:id/resena", async (req, res) => {
try {
console.log("Body recibido:", req.body);
console.log("ID servicio:", req.params.id);

const { nombre, comentario, puntaje } = req.body;  

const servicio = await Servicio.findById(req.params.id).populate("terapeuta");  
if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });  

// Crear la reseña en la colección Resena  
const nuevaResena = new Resena({  
  servicio: servicio._id,  
  terapeuta: servicio.terapeuta._id,  
  nombre,  
  comentario,  
  puntaje  
});  

await nuevaResena.save();  

res.status(201).json({ ok: true, resena: nuevaResena });

} catch (err) {
console.error("Error al agregar reseña:", err);
res.status(500).json({ error: "Error al agregar la reseña" });
}
});

// GET /api/servicios → para el panel del admin o grilla pública
router.get("/", async (req, res) => {
  try {
    const servicios = await Servicio.find({ aprobado: true })
      .populate("terapeuta", "_id nombreCompleto");

    const serviciosFormateados = servicios.map(s => ({
      _id: s._id,
      titulo: s.titulo || "Sin título",
      descripcion: s.descripcion || "",
      modalidad: s.modalidad || "",
      duracionMinutos: s.duracionMinutos || 0,
      precio: s.precio || 0,
      categoria: s.categoria || "Sin categoría",
      plataformas: s.plataformas || [],
      imagen: s.imagen || "",
      slug: s.slug || "",
      createdAt: s.createdAt,
      actualizado: s.updatedAt,
      terapeuta: {
        _id: s.terapeuta?._id,
        nombreCompleto: s.terapeuta?.nombreCompleto || "Sin nombre"
      },
      promedioResenas: s.promedioResenas || 0,
      cantidadResenas: s.cantidadResenas || 0
    }));

    console.log("SERVICIOS PARA PANEL:", serviciosFormateados.length);

    res.json(serviciosFormateados);
  } catch (err) {
    console.error("❌ Error al obtener servicios:", err);
    res.status(500).json({ error: "Error al obtener los servicios" });
  }
});

module.exports = router;

