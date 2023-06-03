const pool = require("../../database/connection");
const yup = require("yup");

const addWallet = async (req, res) => {
  const schema = yup.object().shape({
    short_code: yup.string().required().max(6),
    email: yup.string().required().email().max(255),
  });

  const { short_code, email } = req.body;

  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });

    client = await pool.connect();
    await client.query("BEGIN");

    const medalQuery =
      "SELECT id, event_id, max_uses FROM event_medals WHERE short_code = $1";

    const medalResult = await client.query(medalQuery, [short_code]);

    if (medalResult.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");

      return res.status(405).json("A medalha informada não existe.");
    }
    const max_uses = Number(medalResult.rows[0].max_uses);

    if (max_uses < 1) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("Medalha Esgotada");
    }

    const medal_id = medalResult.rows[0].id;
    const event_id = medalResult.rows[0].event_id;

    const checkQuery =
      "SELECT * FROM wallet WHERE event_id = $1 AND medal_id = $2 AND email = $3";
    const checkResult = await client.query(checkQuery, [
      event_id,
      medal_id,
      email,
    ]);

    const checkUserQuery =
      "SELECT EXISTS (SELECT * FROM event_user WHERE email = $1 AND event_id = $2)";
    const checkUserResult = await client.query(checkUserQuery, [
      email,
      event_id,
    ]);

    if (checkUserResult.rows[0].exists === false) {
      await client.release();
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json("Usuário não está registrado no evento correspondente.");
    }

    if (checkResult.rowCount > 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res
        .status(406)
        .json("Esta medalha já foi adicionada para este usuário.");
    }

    const insertQuery =
      "INSERT INTO wallet (event_id, medal_id, email) VALUES ($1, $2, $3)";
    const insertValues = [event_id, medal_id, email];
    const walletRegistration = await client.query(insertQuery, insertValues);

    const insertQuery1 =
      "INSERT INTO wallet_history (email, short_code, date_added, time_added) VALUES ($1, $2, $3, NOW())";
    const insertValues1 = [email, short_code, new Date()];
    await client.query(insertQuery1, insertValues1);

    if (walletRegistration.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(401).json("O registro na carteira não foi adicionado.");
    }
    const updateMedalQuery =
      "UPDATE event_medals SET max_uses = max_uses - 1 WHERE id = $1";
    await client.query(updateMedalQuery, [medal_id]);
    await client.release();
    await client.query("COMMIT");

    return res
      .status(200)
      .json("O registro na carteira foi adicionado com sucesso!");
  } catch (error) {
    console.log(error.message);

    return res.status(403).json(error.message);
  }
};

module.exports = addWallet;
