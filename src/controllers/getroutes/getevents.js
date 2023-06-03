const pool = require("../../database/connection");

const getEvents = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM events");
    await client.release();
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = getEvents;
