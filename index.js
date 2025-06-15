const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const resenasRoutes = require('./routes/resenas');
const terapeutasRoutes = require("./routes/terapeutas");
const serviciosRoutes = require("./routes/servicios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect("tu_cadena_de_conexión")
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("Error de conexión:", err));

app.get("/api/servicios", (req, res) => {
  res.send("✅ Ruta GET directa de /api/servicios funcionando");
});

app.use("/api/terapeutas", terapeutasRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/servicios", serviciosRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a la API de Servicios Holísticos");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
