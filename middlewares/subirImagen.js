const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Crear carpeta uploads si no existe
const carpetaUploads = path.join(__dirname, "../uploads");
if (!fs.existsSync(carpetaUploads)) {
  fs.mkdirSync(carpetaUploads);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, carpetaUploads);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

module.exports = upload.single("imagen");
