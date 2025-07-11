const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// ✅ Importación de rutas
const terapeutasRoutes = require("./routes/terapeutas");
const serviciosRoutes = require("./routes/servicios");
const resenasRoutes = require("./routes/resenas");
const reservasRoutes = require("./routes/reservas.routes");
const pagosRoutes = require("./routes/pagos");
const rutaDisponibilidad = require("./routes/disponibilidad");
const emailsRoutes = require("./routes/emails");
const mensajeGlobalRoutes = require("./routes/mensajeGlobal.routes");
const adminRoutes = require("./routes/admin.routes");
const bloqueosRouter = require("./routes/bloqueos");


// ✅ Uso de rutas
app.use("/api/terapeutas", terapeutasRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/pagos", pagosRoutes); // clave para que MercadoPago funcione
app.use("/api/disponibilidad", rutaDisponibilidad);
app.use("/api/emails", emailsRoutes);
app.use("/api/mensaje-global", mensajeGlobalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bloqueos", bloqueosRouter);


// ✅ Ruta de prueba
app.get("/", (req, res) => {
  res.send("🌐 API de Servicios Holísticos en funcionamiento");
});

// ✅ Arranque del servidor
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
