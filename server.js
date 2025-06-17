require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const mercadopago = require("mercadopago");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Mercado Pago con tu access token desde variables de entorno
mercadopago.configurations.setAccessToken(process.env.TEST-520968366620813-031514-3c112a2502f3d1ef22c3ad0d467ef18c-1630607182);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("🟢 Conectado a MongoDB"))
.catch(err => console.error("🔴 Error al conectar a MongoDB:", err));

// Importar rutas
const terapeutasRoutes = require("./routes/terapeutas");
const serviciosRoutes = require("./routes/servicios");
const resenasRoutes = require("./routes/resenas");
const reservasRoutes = require("./routes/reservas.routes");

// Montar rutas
app.use("/api/terapeutas", terapeutasRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/reservas", reservasRoutes);

// Ruta para crear preferencia de pago Mercado Pago con split
app.post("/api/crear-preferencia", async (req, res) => {
  try {
    const { items, payer, marketplace_fee, shipments } = req.body;

    // Configurá la preferencia con split de mercado pago
    const preference = {
      items,
      payer,
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
      },
      marketplace_fee: marketplace_fee || 0, // comisión para el marketplace
      shipments,
      back_urls: {
        success: "https://tu-frontend.com/pago-exitoso",
        failure: "https://tu-frontend.com/pago-fallido",
        pending: "https://tu-frontend.com/pago-pendiente",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);

    res.json({ init_point: response.body.init_point });
  } catch (error) {
    console.error("Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia de pago" });
  }
});

// Rutas básicas de prueba
app.get("/api/test", (req, res) => {
  res.json({ mensaje: "✅ API funcionando correctamente" });
});

app.get("/", (req, res) => {
  res.send("🚀 Bienvenido a la API de Servicios Holísticos");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
