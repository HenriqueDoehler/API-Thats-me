const express = require("express");
const multer = require("multer");
const upload = multer({ dest: "./controllers/userevent/uploads" });

const login = require("./controllers/adminlogin/adminlogin");
const registerAdmin = require("./controllers/registeradmin/registeradmin");
const authorization = require("./middleware/authorization");
const authenticateToken = require("./controllers/decoder/decoder");
const rateLimit = require("express-rate-limit");

const forgotPassword = require("./controllers/registeradmin/reset");
const resetPassowrd = require("./controllers/registeradmin/resetpass");

const registerCompany = require("./controllers/company/registercompany");
const registerEvent = require("./controllers/event/registerevent");
const registerEventMedal = require("./controllers/event/registerEventMedal");

const addEventUser = require("./controllers/userevent/addUserEvent");
const addEventUserCsv = require("./controllers/userevent/csvFileUsers");
const addWallet = require("./controllers/medal/addMedal");

const deleteCompany = require("./controllers/deleteroutes/deleteCompany");
const deleteEvent = require("./controllers/deleteroutes/deleteEvent");
const deleteEventUser = require("./controllers/deleteroutes/deleteUser");
const deleteMedal = require("./controllers/deleteroutes/deletemedal");
const deleteWallet = require("./controllers/deleteroutes/deletewallet");

const getCompanies = require("./controllers/getroutes/getCompanies");
const getEvents = require("./controllers/getroutes/getevents");
const getEventUsers = require("./controllers/getroutes/geteventuser");
const getEventMedals = require("./controllers/getroutes/geteventmedals");
const getWallet = require("./controllers/getroutes/getwallets");
const getWalletHistory = require("./controllers/getroutes/history");

const route = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message:
    "Você atingiu o limite de solicitações. Tente novamente em 15 minutos.",
});

route.post("/adminsign", limiter, registerAdmin);
route.post("/login", login);
route.post("/forgot_password", limiter, forgotPassword);
route.post("/reset_password", limiter, resetPassowrd);
route.post("/addMedal", limiter, addWallet);
route.get("/wallets/:email", limiter, getWallet);
route.use(authorization);

route.post("/registerCompany", limiter, registerCompany);
route.post("/registerEvent", limiter, registerEvent);
route.post("/registerEventMedal", limiter, registerEventMedal);
route.post("/addEventUser", limiter, addEventUser);
route.post(
  "/addEventUserCsv/:event_id",
  limiter,
  upload.single("file"),
  addEventUserCsv
);

route.delete("/deleteCompany/:companyId", limiter, deleteCompany);
route.delete("/deleteEvent/:eventId", limiter, deleteEvent);
route.delete("/deleteUser/:userId", limiter, deleteEventUser);
route.delete("/deleteMedal/:medalId", limiter, deleteMedal);
route.delete("/deleteWallet/:email/:short_code", limiter, deleteWallet);

route.get("/companies", limiter, getCompanies);
route.get("/events", limiter, getEvents);
route.get("/eventsUsers", limiter, getEventUsers);
route.get("/eventsMedals", limiter, getEventMedals);
route.get("/history", getWalletHistory);

module.exports = route;
