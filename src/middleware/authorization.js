const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require("../database/connection");

let client;
const validateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({
        message:
          "É necessário um token autenticado válido para acessar este recurso",
      });
  }

  try {
    client = await pool.connect();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const query = "SELECT id, name, email, password FROM admin WHERE id = $1";
    const result = await client.query(query, [userId]);
    const usuario = result.rows[0];
    await client.release();

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const userWithoutPassword = {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
    };

    req.usuario = userWithoutPassword;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

module.exports = validateToken;
