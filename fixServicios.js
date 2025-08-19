const mongoose = require("mongoose");
const Terapeuta = require("./models/Terapeuta");

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    await Terapeuta.updateMany(
      { "servicios.aprobado": { $exists: false } },
      { $set: { "servicios.$[].aprobado": false } }
    );
    console.log("✅ Servicios antiguos actualizados");
    process.exit();
  })
  .catch(err => console.error(err));