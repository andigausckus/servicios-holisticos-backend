require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

// Rutas
const terapeutasRoutes = require("./routes/terapeutas");
app.use("/api/terapeutas", terapeutasRoutes);

app.get("/api/test", (req, res) => {
  res.json({ mensaje: "✅ API funcionando correctamente" });
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("🟢 Conexión a MongoDB exitosa"))
.catch((err) => console.error("🔴 Error al conectar MongoDB:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a la API de Servicios Holísticos");
});