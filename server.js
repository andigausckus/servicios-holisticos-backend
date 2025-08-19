const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middlewares
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://6188e661-7694-485e-b18d-0f9a4b139a16-00-3vr3dlg7g41yj.janeway.replit.dev",
    "https://frontend-holisticos.vercel.app",
    "https://serviciosholisticos.com.ar",
    "https://www.serviciosholisticos.com.ar",
  ]
}));

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

// ✅ Arranque del servidor
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
