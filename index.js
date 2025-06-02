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
