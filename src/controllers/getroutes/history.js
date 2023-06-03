const pool = require("../../database/connection");

const getWalletHistory = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM wallet_history");
    await client.release();
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = getWalletHistory;
