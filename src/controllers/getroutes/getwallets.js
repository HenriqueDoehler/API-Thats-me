const pool = require("../../database/connection");

let client;
const getWallet = async (req, res) => {
  const { email } = req.params;
  try {
    client = await pool.connect();

    const data = await client.query(
      `
      SELECT u.email, u.name AS user_name, w.*, e.cod_model, ev.name AS event_name, ev.description AS event_description
      FROM event_user AS u
      LEFT JOIN wallet AS w ON u.email = w.email
      LEFT JOIN event_medals AS e ON w.event_id = e.event_id AND w.medal_id = e.id
      LEFT JOIN events AS ev ON w.event_id = ev.id
      WHERE u.email = $1
      GROUP BY u.email, u.name, w.id, e.cod_model, ev.id;
  `,
      [email]
    );
    await client.release();

    if (data.rows.length === 0) {
      return res.status(404).json({ message: "Email Não Encontrado" });
    }
    return res.status(200).json(data.rows);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = getWallet;
