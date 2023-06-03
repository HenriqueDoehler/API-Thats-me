const pool = require("../../database/connection");

const deleteEvent = async (req, res) => {
  const eventId = req.params.eventId;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM events WHERE id = $1", [
      eventId,
    ]);
    if (result.rows.length === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(404).json("Evento não encontrado.");
    }

    const deleteQuery = "DELETE FROM events WHERE id = $1";
    const deleteValues = [eventId];
    const eventDeletion = await client.query(deleteQuery, deleteValues);

    if (eventDeletion.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("O evento não foi removido.");
    }
    await client.release();
    await client.query("COMMIT");

    return res.status(200).json("O evento foi removido com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = deleteEvent;
