require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ✅ Configuración de MercadoPago (SDK versión 2.8.0)
const MercadoPago = require("mercadopago").default;

const mercadopago = new MercadoPago({
  access_token: process.env.MP_ACCESS_TOKEN,
  locale: "es_AR",
});

// Exportamos la instancia correctamente
module.exports = { mercadopago };

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// ✅ Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("🟢 Conectado a MongoDB"))
  .catch((err) => console.error("🔴 Error al conectar a MongoDB:", err));

// ✅ Rutas
const terapeutasRoutes = require("./routes/terapeutas");
const serviciosRoutes = require("./routes/servicios");
const resenasRoutes = require("./routes/resenas");
const reservasRoutes = require("./routes/reservas.routes");
const pagosRoutes = require("./routes/pagos");

app.use("/api/terapeutas", terapeutasRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api", pagosRoutes);

app.get("/api/test", (req, res) => {
  res.json({ mensaje: "✅ API funcionando correctamente" });
});

app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a la API de Servicios Holísticos");
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
