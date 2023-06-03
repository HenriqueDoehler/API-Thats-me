const pool = require("../../database/connection");

const getEventMedals = async (req, res) => {
  let clientMedal;

  try {
    clientMedal = await pool.connect();

    const { rows } = await clientMedal.query("SELECT * FROM event_medals");
    await clientMedal.release();
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = getEventMedals;
