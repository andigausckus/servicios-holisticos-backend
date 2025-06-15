const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const resenasRoutes = require('./routes/resenas');
const terapeutasRoutes = require("./routes/terapeutas");
// const serviciosRoutes = require("./routes/servicios"); // Lo comento para evitar conflicto

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
// app.use("/api/servicios", serviciosRoutes); // Comentado para usar ruta abajo

// Ruta POST para crear un servicio (simple, sin base de datos, para test)
app.post("/api/servicios", (req, res) => {
  const { titulo } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: "El título es obligatorio" });
  }

  // Aquí puedes agregar la lógica para guardar en BD
  // Por ahora, solo respondo con el dato recibido:
  res.status(201).json({ mensaje: "Servicio creado", titulo });
});

// Ruta de prueba (opcional)
app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a la API de Servicios Holísticos");
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
