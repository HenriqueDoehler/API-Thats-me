const pool = require("../../database/connection");

const deleteWallet = async (req, res) => {
  const { email, short_code } = req.params;

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const medalQuery = "SELECT * FROM event_medals WHERE short_code = $1";
    const medalValues = [short_code];
    const medalResult = await client.query(medalQuery, medalValues);

    if (medalResult.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(401).json("Medalha não encontrada.");
    }

    const medalId = medalResult.rows[0].id;

    const walletQuery = "DELETE FROM wallet WHERE email = $1 AND medal_id = $2";
    const walletValues = [email, medalId];
    const walletDeletion = await client.query(walletQuery, walletValues);

    const walletHistoryQuery =
      "DELETE FROM wallet_history WHERE email = $1 AND short_code = $2";
    const walletHistoryValues = [email, short_code];
    const walletHistoryDeletion = await client.query(
      walletHistoryQuery,
      walletHistoryValues
    );

    if (walletDeletion.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(405).json("Carteira não encontrada na wallet.");
    }
    if (walletHistoryDeletion.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(406).json("Carteira não encontrada no historico.");
    }
    await client.release();
    await client.query("COMMIT");
    return res.status(200).json("A carteira foi removida com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = deleteWallet;
