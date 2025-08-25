const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middlewares
app.use(express.json());
app.use(
cors({
origin: [
"http://localhost:3000",
"https://6188e661-7694-485e-b18d-0f9a4b139a16-00-3vr3dlg7g41yj.janeway.replit.dev",
"https://frontend-holisticos.vercel.app",
"https://serviciosholisticos.com.ar",
"https://www.serviciosholisticos.com.ar",
],
})
);

// ✅ Conexión a MongoDB
mongoose
.connect(process.env.MONGODB_URI)
.then(() => console.log("🟢 Conectado a MongoDB"))
.catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

const limpiarReservasEnProceso = require("./utils/limpiarReservasEnProceso");

// ✅ Ejecutar limpieza automática cada 1 minuto
setInterval(() => {
limpiarReservasEnProceso();
}, 60 * 1000);

// ✅ Importación de rutas
const terapeutasRoutes = require("./routes/terapeutas");
const serviciosRoutes = require("./routes/servicios");
const resenasRoutes = require("./routes/resenas");
const reservasRoutes = require("./routes/reservas.routes");
const rutaDisponibilidad = require("./routes/disponibilidad");
const mensajeGlobalRoutes = require("./routes/mensajeGlobal.routes");
const adminRoutes = require("./routes/admin.routes");
const bloqueosRouter = require("./routes/bloqueos");

// ✅ Uso de rutas con prefijo /api
app.use("/api/terapeutas", terapeutasRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/disponibilidad", rutaDisponibilidad);
app.use("/api/mensaje-global", mensajeGlobalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bloqueos", bloqueosRouter);
app.use(express.static("public"));

// ✅ Ruta de prueba
app.get("/", (req, res) => {
res.send("🌐 API de Servicios Holísticos en funcionamiento");
});

// ✅ Endpoint de redirección para compartir servicios
app.get("/s/:slug", (req, res) => {
const { slug } = req.params;
res.redirect(`/#/servicios/${slug}`);
});

// ✅ Endpoint dinámico para compartir servicios (Open Graph)
const Servicio = require("./models/Servicio"); // Asegurate que el modelo esté bien importado

app.get("/share/:slug", async (req, res) => {
const { slug } = req.params;

try {
const servicio = await Servicio.findOne({ slug });
if (!servicio) return res.status(404).send("Servicio no encontrado");

res.send(`  
  <!DOCTYPE html>  
  <html lang="es">  
  <head>  
    <meta charset="UTF-8" />  
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />  
    <title>${servicio.titulo}</title>  
    <meta property="og:title" content="${servicio.titulo}" />  
    <meta property="og:description" content="${servicio.descripcion}" />  
    <meta property="og:image" content="${servicio.imagen}" />  
    <meta property="og:url" content="https://www.serviciosholisticos.com.ar/servicios/${slug}" />  
    <meta property="og:type" content="website" />  
    <meta name="twitter:card" content="summary_large_image" />  
    <meta name="twitter:title" content="${servicio.titulo}" />  
    <meta name="twitter:description" content="${servicio.descripcion}" />  
    <meta name="twitter:image" content="${servicio.imagen}" />  
  </head>  
  <body>  
    <script>  
      window.location.href = "/servicios/${slug}";  
    </script>  
  </body>  
  </html>  
`);

} catch (error) {
console.error(error);
res.status(500).send("Error al generar la página de compartir");
}
});

// ✅ Arranque del servidor
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

