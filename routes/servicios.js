const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const Terapeuta = require("../models/Terapeuta");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Middleware JWT
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

// Configuración multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nombreUnico = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, nombreUnico);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
});

// Crear servicio
router.post("/", verificarToken, upload.single("imagen"), async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      modalidad,
      duracion,
      precio,
      categoria,
      plataformas,
    } = req.body;

    if (!titulo || !descripcion || !modalidad || !duracion || !precio || !categoria) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const nuevoServicio = new Servicio({
      titulo,
      descripcion,
      modalidad,
      duracion,
      precio,
      categoria,
      plataformas: JSON.parse(plataformas || "[]"),
      terapeuta: req.terapeutaId,
      imagen: req.file ? req.file.filename : null,
    });

    await nuevoServicio.save();

    await Terapeuta.findByIdAndUpdate(req.terapeutaId, {
      $push: { servicios: nuevoServicio._id },
    });

    res.status(201).json({ id: nuevoServicio._id });
  } catch (err) {
    console.error("Error al crear servicio:", err);
    res.status(500).json({ error: "Error al crear el servicio." });
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

    // Obtener servicios del terapeuta autenticado
router.get("/mis-servicios", verificarToken, async (req, res) => {
  try {
    const servicios = await Servicio.find({ terapeuta: req.terapeutaId });
    res.json(servicios);
  } catch (err) {
    console.error("Error al obtener tus servicios:", err);
    res.status(500).json({ error: "Error al obtener tus servicios" });
  }
});

module.exports = router;
