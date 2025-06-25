const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const Terapeuta = require("../models/Terapeuta");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Middleware para verificar el token JWT
function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.terapeutaId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido" });
  }
}

// Configurar almacenamiento de imágenes con multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Carpeta donde se guardan las imágenes
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombreUnico = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, nombreUnico);
  },
});

const upload = multer({ storage });

// Crear un nuevo servicio
router.post("/", verificarToken, upload.single("imagen"), async (req, res) => {
  try {
    const nuevoServicio = new Servicio({
      ...req.body,
      terapeuta: req.terapeutaId,
      imagen: req.file ? `/uploads/${req.file.filename}` : "", // Guardar ruta de la imagen
    });

    await nuevoServicio.save();

    await Terapeuta.findByIdAndUpdate(req.terapeutaId, {
      $push: { servicios: nuevoServicio._id }
    });

    res.status(201).json({ id: nuevoServicio._id });
  } catch (err) {
    console.error("Error al crear servicio:", err);
    res.status(500).json({ error: "Error al crear el servicio" });
  }
});

// Obtener todos los servicios
router.get("/", async (req, res) => {
  try {
    const servicios = await Servicio.find().populate("terapeuta", "nombreCompleto ubicacion");
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los servicios" });
  }
});

module.exports = router;
