const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../../database/connection");
const yup = require("yup");
require("dotenv").config();

const login = async (req, res) => {
  const { email, senha } = req.body;
  const schema = yup.object().shape({
    email: yup.string().required().email(),
    senha: yup.string().required().min(6).trim(),
  });

  let client;
  try {
    await schema.validate({ email, senha }, { abortEarly: false });
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM admin WHERE email = $1", [
      email,
    ]);
    const usuario = result.rows[0];
    if (!usuario) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("Error");
    }
    const checkPassword = await bcrypt.compare(senha, usuario.password);

    if (!checkPassword) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("A senha está incorreta");
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "6h",
    });
    await client.release();
    await client.query("COMMIT");
    return res.status(200).json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
      token,
    });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = login;
