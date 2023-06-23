const pool = require("../../database/connection");
const yup = require("yup");
const fs = require("fs");
const multer = require("multer");

const users = [];

function addUser(user) {
  const existingUser = users.find((u) => u.email === user.email);
  if (existingUser) {
    return;
  } else {
    users.push(user);
  }
}

const addEventUsersCsv = async (req, res) => {
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  if (!req.file) {
    return res.status(400).json("O arquivo CSV não foi enviado.");
  }

  let client;
  try {
    const { event_id } = req.params;
    const eventSchema = yup.number().positive().integer().required();
    await eventSchema.validate(event_id);

    client = await pool.connect();

    await client.query("BEGIN");

    const fileStream = fs.createReadStream(req.file.path);
    const rl = require("readline").createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    let lineNumber = 0;

    rl.on("line", async (line) => {
      lineNumber++;
      if (lineNumber === 1) {
        return rl.resume();
      }
      const userSchema = yup.object().shape({
        name: yup.string().required().max(255),
        email: yup.string().required().email().max(255),
        phone: yup.string().max(20),
      });
      try {
        const [name, email, phone] = line.split(";");

        await userSchema.validate({ name, email, phone });

        const user = { name, email, phone };

        addUser(user);
      } catch (error) {
        console.log(error);
        return res.status(400).json(error);
      }
    }).on("close", async () => {
      try {
        fs.unlinkSync(req.file.path);

        const userQuery =
          "SELECT * FROM event_user WHERE email = $1 AND event_id = $2";

        for (const user of users) {
          const userResult = await client.query(userQuery, [
            user.email,
            event_id,
          ]);
          if (userResult.rowCount > 0) {
            if (!res.headersSent) {
              await client.release();
              await client.query("ROLLBACK");
              return res
                .status(400)
                .json("Estes participantes já estão registrados neste evento.");
            }
          }
        }
        for (const user of users) {
          const insertQuery =
            "INSERT INTO event_user (name, email, phone, event_id) VALUES ($1, $2, $3, $4)";
          const insertValues = [user.name, user.email, user.phone, event_id];
          await client.query(insertQuery, insertValues);
        }

        if (!res.headersSent) {
          await client.release();
          await client.query("COMMIT");
          return res
            .status(200)
            .json("Os participantes foram cadastrados com sucesso!");
        }
      } catch (error) {
        await client.release();
        await client.query("ROLLBACK");

        console.log(`Erro ao inserir os usuários: ${error.message}`);
        if (!res.headersSent) {
          return res.status(401).json(error);
        }
      }
    });
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = addEventUsersCsv;
