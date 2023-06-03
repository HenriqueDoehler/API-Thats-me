const pool = require("../../database/connection");
const yup = require("yup");

const registerEvent = async (req, res) => {
  const schema = yup.object().shape({
    name: yup.string().required().max(255),
    company_id: yup.number().integer().positive().required(),
    description: yup.string().max(500),
    address: yup.string().max(255),
    time: yup.string(),
  });

  const { name, company_id, description, data, address, time } = req.body;

  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });

    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM events WHERE name = $1", [
      name,
    ]);

    if (result.rows.length > 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("Evento já cadastrado");
    }

    const insertQuery =
      "INSERT INTO events (name, company_id, description, data, address, time) VALUES ($1, $2, $3, $4, $5, $6)";
    const insertValues = [name, company_id, description, data, address, time];
    const eventRegistration = await client.query(insertQuery, insertValues);
    if (eventRegistration.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("O evento não foi cadastrado.");
    }
    await client.release();
    await client.query("COMMIT");
    return res.status(200).json("O evento foi cadastrado com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = registerEvent;
