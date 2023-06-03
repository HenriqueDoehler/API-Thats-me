const pool = require("../../database/connection");

const getCompanies = async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query("SELECT * FROM company");
    await client.release();

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = getCompanies;
