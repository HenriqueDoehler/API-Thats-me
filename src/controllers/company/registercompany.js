const pool = require("../../database/connection");
const yup = require("yup");

const registerCompany = async (req, res) => {
  const schema = yup.object().shape({
    name: yup.string().required().max(255),
    cnpj: yup
      .string()
      .matches(/^\d{14}$/)
      .required(),
    address: yup.string().required().max(255),
    state: yup.string().required().max(255),
    sector: yup.string().required().max(255),
    cep: yup
      .string()
      .matches(/^\d{8}$/)
      .required(),
    email: yup.string().required().email().max(255),
    phone: yup.string().required().max(15),
  });

  const { name, cnpj, address, state, sector, cep, email, phone } = req.body;

  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });

    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM company WHERE cnpj = $1", [
      cnpj,
    ]);

    if (result.rows.length > 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("CNPJ já cadastrado");
    }

    const insertQuery =
      "INSERT INTO company (name, cnpj, address, state, sector, cep, email, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
    const insertValues = [
      name,
      cnpj,
      address,
      state,
      sector,
      cep,
      email,
      phone,
    ];
    const companyRegistration = await client.query(insertQuery, insertValues);
    if (companyRegistration.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("A empresa não foi cadastrada.");
    }
    await client.release();
    await client.query("COMMIT");
    return res.status(200).json("A empresa foi cadastrada com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = registerCompany;
