const pool = require("../../database/connection");

const deleteCompany = async (req, res) => {
  const companyId = req.params.companyId;
  console.log(req.params);

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM company WHERE id = $1", [
      companyId,
    ]);

    if (result.rows.length === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(404).json("Empresa não encontrada.");
    }

    const deleteQuery = "DELETE FROM company WHERE id = $1";
    const deleteValues = [companyId];
    const companyDeletion = await client.query(deleteQuery, deleteValues);

    if (companyDeletion.rowCount === 0) {
      await client.release();
      await client.query("ROLLBACK");
      return res.status(400).json("A empresa não foi removida.");
    }
    await client.release();
    await client.query("COMMIT");

    return res.status(200).json("A empresa foi removida com sucesso!");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = deleteCompany;
