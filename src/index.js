const express = require("express");
const route = require("./routes");
const cors = require("cors");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

app.use(route);

app.listen(3000, () => console.log("server http ok"));
