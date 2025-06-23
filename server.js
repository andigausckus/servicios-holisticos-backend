const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// Rutas
const terapeutasRoutes = require("./routes/terapeutas");
const serviciosRoutes = require("./routes/servicios");
const resenasRoutes = require("./routes/resenas");
const reservasRoutes = require("./routes/reservas.routes");
const pagosRoutes = require("./routes/pagos");

app.use("/api/terapeutas", terapeutasRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/reservas", reservasRoutes);

// ✅ Esta línea es la clave para que funcione tu ruta de pago
app.use("/api/pagos", pagosRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🌐 API de Servicios Holísticos en funcionamiento");
});

// Puerto
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
