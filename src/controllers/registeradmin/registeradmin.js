const pool = require("../../database/connection");
const bcrypt = require("bcrypt");
const yup = require("yup");

const registerAdmin = async (req, res) => {
  const schema = yup.object().shape({
    nome: yup
      .string()
      .matches(/^[a-zA-Z0-9 ]+$/)
      .required(),
    email: yup
      .string()
      .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .required()
      .email()
      .max(255),
    senha: yup
      .string()
      .min(8)
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
      )
      .required(),
  });
  const { nome, email, senha } = req.body;
  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });
    client = await pool.connect();
    const result = await client.query("SELECT * FROM admin WHERE email = $1", [
      email,
    ]);

    if (result.rows.length > 0) {
      return res.status(400).json("O email já existe");
    }
    const salt = await bcrypt.genSalt(10);
    const passwordEncrypted = await bcrypt.hash(senha, salt);

    const userDatas = { nome, email, senha: passwordEncrypted };
    const insertQuery =
      "INSERT INTO admin (name, email, password) VALUES ($1, $2, $3)";
    const insertValues = [userDatas.nome, userDatas.email, userDatas.senha];
    const userRegistration = await client.query(insertQuery, insertValues);

    if (userRegistration.rowCount === 0) {
      return res.status(400).json("O usuário não foi cadastrado.");
    }

    return res.status(200).json("O usuário foi cadastrado com sucesso!");
  } catch (error) {
    return res.status(400).json(error);
  } finally {
    client && client.release();
  }
};

module.exports = registerAdmin;
