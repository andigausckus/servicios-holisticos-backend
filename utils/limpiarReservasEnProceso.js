const Reserva = require("../models/Reserva");

async function limpiarReservasEnProceso() {
  const haceDosMinutos = new Date(Date.now() - 2 * 60 * 1000);
  try {
    const resultado = await Reserva.deleteMany({
      estado: "en_proceso",
      creadaEn: { $lt: haceDosMinutos },
    });
    if (resultado.deletedCount > 0) {
      console.log(`🧹 Reservas eliminadas automáticamente: ${resultado.deletedCount}`);
    }
  } catch (error) {
    console.error("❌ Error al limpiar reservas en proceso:", error);
  }
}

module.exports = limpiarReservasEnProceso;
