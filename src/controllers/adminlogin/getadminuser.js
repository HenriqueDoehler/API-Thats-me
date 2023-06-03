const jwt = require("jsonwebtoken");
const pool = require('../../database/connection');
require("dotenv").config();

const getAdminUser = async (req, res) => {
   
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json('Token não fornecido');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM admin WHERE id = $1', [userId]);
    const adminUsers = result.rows;
    return res.status(200).json(adminUsers);
    
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports =  getAdminUser;