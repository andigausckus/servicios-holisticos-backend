const express = require("express");
const router = express.Router();
const auth = require("../auth");
const { crearServicio } = require("../controladores/servicios");

router.post("/", auth, (req, res, next) => {
  console.log("👉 Llegó un POST a /api/servicios sin imagen");
  next();
}, crearServicio);

router.get("/", (req, res) => {
  res.send("✅ Ruta de servicios activa");
});

module.exports = router;
