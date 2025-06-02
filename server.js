require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");       // <-- acá

const app = express();

app.use(cors());                   // <-- acá
app.use(express.json());

// Rutas
const terapeutasRoutes = require("./routes/terapeutas");
app.use("/api/terapeutas", terapeutasRoutes);

// Otros endpoints, conexión, puerto, etc.

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

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect("mongodb+srv://AndiUser:Andiog34_@cluster0.mongodb.net/servicios-holisticos?retryWrites=true&w=majority")
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("Error de conexión:", err));

// Rutas
const terapeutasRoutes = require("./routes/terapeutas");
app.use("/terapeutas", terapeutasRoutes);

const reservasRoutes = require('./routes/reservas.routes');
app.use('/api/reservas', reservasRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
