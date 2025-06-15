const express = require("express");
const router = express.Router();
const auth = require("../auth");
const subirImagen = require("../middlewares/subirImagen");
const { crearServicio } = require("../controladores/servicios");

router.post("/", auth, subirImagen, crearServicio);
// En routes/servicios.js
router.get("/", (req, res) => {
  res.send("✅ Ruta de servicios activa");
});

module.exports = router;
