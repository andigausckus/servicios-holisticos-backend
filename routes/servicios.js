const express = require("express");
const router = express.Router();
const auth = require("../auth"); // si querés proteger con token
const subirImagen = require("../middlewares/subirImagen");
const { crearServicio } = require("../controladores/servicios");

router.post("/", auth, subirImagen, crearServicio);

module.exports = router;
