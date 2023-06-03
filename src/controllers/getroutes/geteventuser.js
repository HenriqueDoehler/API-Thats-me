const pool = require("../../database/connection");

const getEventUsers = async (req, res) => {
  let clientEvent;

  try {
    clientEvent = await pool.connect();
    const { rows } = await clientEvent.query("SELECT * FROM event_user");
    await clientEvent.release();
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = getEventUsers;
