const pool = require("../../database/connection");

const deleteEventUser = async (req, res) => {
  const eventUserId = req.params.userId;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT * FROM event_user WHERE id = $1",
      [eventUserId]
    );
    if (result.rows.length === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(404).json("Usuário do evento não encontrado.");
    }

    const deleteQuery = "DELETE FROM event_user WHERE id = $1";
    const deleteValues = [eventUserId];
    const eventUserDeletion = await client.query(deleteQuery, deleteValues);

    if (eventUserDeletion.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("O usuário do evento não foi removido.");
    }
    await client.release();
    await client.query("COMMIT");
    return res
      .status(200)
      .json("O usuário do evento foi removido com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = deleteEventUser;
