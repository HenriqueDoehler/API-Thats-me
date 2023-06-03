const bcrypt = require('bcrypt');
const pool = require('../../database/connection')
const yup = require('yup');

const schema = yup.object().shape({
  email: yup.string().matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).required().email().max(255),
  newPassword: yup.string().min(8).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/).required(),
  code: yup.number().test('len', 'Código deve ter exatamente 6 dígitos', val => val.toString().length === 6).required(),
});

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  let client;
  try {
    await schema.validate(req.body, { abortEarly: false });
    client = await pool.connect();
    const result = await client.query('SELECT * FROM password_reset WHERE admin_id = (SELECT id FROM admin WHERE email = $1) AND code = $2 AND expires_at > NOW()', [email, code]);

    if (result.rowCount === 0) {
      return res.status(400).send({ error: 'Invalid code or expired' });
    }

    const passwordEncrypted = await bcrypt.hash(newPassword, 10);
    await client.query('UPDATE admin SET password = $1 WHERE email = $2', [passwordEncrypted, email]);

    await client.query('DELETE FROM password_reset WHERE admin_id = (SELECT id FROM admin WHERE email = $1) AND code = $2', [email, code]);

    return res.status(200).send({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  } finally {
    client && client.release();
  }
}

module.exports = resetPassword;