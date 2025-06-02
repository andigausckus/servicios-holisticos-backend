require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch(err => console.error("🔴 Error al conectar a MongoDB:", err));

// Rutas
const terapeutasRoutes = require("./routes/terapeutas");
app.use("/api/terapeutas", terapeutasRoutes);

const reservasRoutes = require("./routes/reservas.routes");
app.use("/api/reservas", reservasRoutes);

const loginRouter = require("./routes/login");
app.use("/api/login", loginRouter);

// Ruta de test
app.get("/api/test", (req, res) => {
  res.json({ mensaje: "✅ API funcionando correctamente" });
});

// Ruta base
app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a la API de Servicios Holísticos");
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
