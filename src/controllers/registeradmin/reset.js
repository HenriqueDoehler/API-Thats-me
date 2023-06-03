const nodemailer = require("nodemailer");
const pool = require("../../database/connection");
const { google } = require("googleapis");
const yup = require("yup");
require("dotenv").config();

const generateRandomCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
};

const schema = yup.object().shape({
  email: yup
    .string()
    .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .required()
    .email()
    .max(255),
});

const deleteExpiredCodes = async () => {
  let client;
  try {
    client = await pool.connect();
    const now = new Date();
    await client.query("DELETE FROM password_reset WHERE expires_at < $1", [
      now,
    ]);
    console.log("Expired password reset codes deleted");
  } catch (error) {
    console.error(error);
  } finally {
    if (client) {
      client.release();
    }
  }
};
const OAuth2 = google.auth.OAuth2;
const OAuth2_client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
);
OAuth2_client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const forgotPassword = async (req, res) => {
  const accessToken = await OAuth2_client.getAccessToken();

  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });
    const { email } = req.body;
    client = await pool.connect();
    await deleteExpiredCodes(client);
    const admin = await client.query("SELECT * FROM admin WHERE email = $1", [
      email,
    ]);
    if (admin.rowCount === 0) {
      return res.status(404).send({ error: "E-mail not found" });
    }
    const code = generateRandomCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3600000);
    await client.query(
      "INSERT INTO password_reset (admin_id, code, expires_at) VALUES ($1, $2, $3)",
      [admin.rows[0].id, code, expiresAt]
    );
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.USER_EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: accessToken.token,
      },
    });
    const mailOptions = {
      from: "THATS ME",
      to: email,
      subject: "Thats Me Redefinir Senha",
      html: `<div style="color: red;"><h1>Seu código de redefinição ${code} :</h1><img src="" alt="Imagem"></div>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send({ error: "Failed to send email" });
      } else {
        console.log("Email sent: " + info.response);
        return res
          .status(200)
          .send({ message: "Password reset code sent to email" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = forgotPassword;
