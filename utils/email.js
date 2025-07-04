const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // comprobante@serviciosholisticos.com.ar
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarComprobante({ destinatario, asunto, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Servicios Holísticos" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html,
    });

    console.log("📧 Correo enviado:", info.messageId);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
  }
}

module.exports = { enviarComprobante };
