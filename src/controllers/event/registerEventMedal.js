const pool = require("../../database/connection");
const yup = require("yup");

const registerEventMedal = async (req, res) => {
  const schema = yup.object().shape({
    cod_model: yup.string().required().max(500),
    short_code: yup.string().max(50),
    event_id: yup.number().required(),
    position: yup.string().max(30),
  });

  const { cod_model, short_code, event_id, position, max_uses } = req.body;

  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });

    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query("SELECT * FROM events WHERE id = $1", [
      event_id,
    ]);

    if (result.rows.length === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("Evento não encontrado");
    }

    const insertQuery =
      "INSERT INTO event_medals (cod_model, short_code, event_id, position, max_uses) VALUES ($1, $2, $3, $4, $5)";
    const insertValues = [cod_model, short_code, event_id, position, max_uses];
    const medalRegistration = await client.query(insertQuery, insertValues);
    if (medalRegistration.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("A medalha não foi cadastrada.");
    }
    await client.release();
    await client.query("COMMIT");

    return res.status(200).json("A medalha foi cadastrada com sucesso!");
  } catch (error) {
    console.log(error);
    return res.status(400).json(error.message);
  }
};

module.exports = registerEventMedal;
