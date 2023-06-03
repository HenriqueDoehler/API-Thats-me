const pool = require("../../database/connection");
const yup = require("yup");

const addEventUser = async (req, res) => {
  const schema = yup.object().shape({
    name: yup.string().required().max(255),
    email: yup.string().required().email().max(255),
    phone: yup.string().max(20),
    event_id: yup.number().required(),
  });

  const { name, email, phone, event_id } = req.body;

  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });

    client = await pool.connect();

    const eventQuery = "SELECT * FROM events WHERE id = $1";
    const eventResult = await client.query(eventQuery, [event_id]);

    if (eventResult.rowCount === 0) {
      return res.status(400).json("O evento informado não existe.");
    }

    const userQuery =
      "SELECT * FROM event_user WHERE email = $1 AND event_id = $2";
    const userResult = await client.query(userQuery, [email, event_id]);

    if (userResult.rowCount > 0) {
      return res
        .status(400)
        .json("Este participante já está registrado neste evento.");
    }

    const insertQuery =
      "INSERT INTO event_user (name, email, phone, event_id) VALUES ($1, $2, $3, $4)";
    const insertValues = [name, email, phone, event_id];
    const eventUserRegistration = await client.query(insertQuery, insertValues);

    if (eventUserRegistration.rowCount === 0) {
      return res.status(400).json("O participante não foi cadastrado.");
    }

    return res.status(200).json("O participante foi cadastrado com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  } finally {
    client && client.release();
  }
};

module.exports = addEventUser;
