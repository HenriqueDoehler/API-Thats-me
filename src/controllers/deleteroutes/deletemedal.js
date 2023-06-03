const pool = require("../../database/connection");

const deleteMedal = async (req, res) => {
  const medalId = req.params.medalId;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM event_medals WHERE id = $1",
      [medalId]
    );

    if (result.rows.length === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(404).json("Medalha não encontrada.");
    }

    const deleteQuery = "DELETE FROM event_medals WHERE id = $1";
    const deleteValues = [medalId];
    const medalDeletion = await client.query(deleteQuery, deleteValues);

    if (medalDeletion.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("A medalha não foi removida.");
    }
    await client.release();
    await client.query("COMMIT");
    return res.status(200).json("A medalha foi removida com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = deleteMedal;
