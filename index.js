const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const resenasRoutes = require('./routes/resenas');
const terapeutasRoutes = require("./routes/terapeutas");
const serviciosRoutes = require("./routes/servicios"); // ✅ Habilitás la ruta real

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect("tu_cadena_de_conexión")
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("Error de conexión:", err));

// Rutas
app.use("/api/terapeutas", terapeutasRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/servicios", serviciosRoutes); // ✅ Ruta real de servicios

// Ruta de prueba para ver que el backend responde
app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a la API de Servicios Holísticos");
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
