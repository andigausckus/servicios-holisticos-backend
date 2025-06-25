const express = require("express");
const router = express.Router();
const Servicio = require("../models/Servicio");
const { verificarToken } = require("../middlewares/verificarToken");

const multer = require("multer");
const path = require("path");

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filtro para asegurarse de que el archivo sea una imagen
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes."));
  }
};

// Límite de tamaño: 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Ruta: Crear nuevo servicio
router.post("/", verificarToken, upload.single("imagen"), async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      modalidad,
      duracion,
      precio,
      categoria,
    } = req.body;

    const nuevaImagen = req.file ? req.file.filename : null;

    const nuevoServicio = new Servicio({
      titulo,
      descripcion,
      modalidad,
      duracion,
      precio,
      categoria,
      imagen: nuevaImagen,
      terapeuta: req.usuario.id, // desde el token
    });

    const servicioGuardado = await nuevoServicio.save();

    res.status(201).json(servicioGuardado);
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({ message: "Error al crear el servicio." });
  }
});

module.exports = router;
