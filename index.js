const express = require("express");
const app = express();
const db = require("./src/connectMysql.js");
const logIn = require("./routing/logIn.js");
const logout = require("./routing/logout.js");
const bcrypt = require("bcryptjs");
const controller = require("./controller/auth.js");

const managementMyApp = require("./routing/managementMyApp.js");
const routing = express.Router();
const session = require("express-session");
const queries = require("./model/queries.js");
require("dotenv").config();

//-----------------------------------------------------------------------------------------------------
//session is like cookie
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.json());

//-----------------------------------------------------------------------------------------------------
//create tables in the db if these are not there
db().then(async (connection) => {
  console.log("connection to db completed!!");
  await connection.query(queries.createDb);
  await connection.query(queries.use);
  await connection.query(queries.createAccounts);
  let hashedPassowrd = await bcrypt.hash(process.env.PASSWORD_ADMIN, 12);

  await connection.query(queries.createUser, [
    process.env.NAME,
    hashedPassowrd,
    process.env.NAME_SURNAME,
    process.env.EMAIL,
    process.env.ROLE,
  ]);

  return connection;
});
//-----------------------------------------------------------------------------------------------------

// http://localhost:3000/home
//API
app.get("/home", (req, res) => {
  // If the user is loggedin
  if (req.session.loggedin) {
    // Output username
    res.status(201).send("Welcome back, " + req.session.username + "!");
  } else {
    // Not logged in
    res.send("Please login to view this page!");
  }
  res.end();
});

app.use("/api/v1", logIn);
app.use("/api/v1", logout);

//first check if you are an administrator,
//then if the credential format is respected, 
//then if there are no duplicates in the DB
app.use(
  "/api/v1",
  controller.onlyAdmin,
  controller.checkParametersRegister,
  controller.checkusernameExist,
  managementMyApp
);

//-----------------------------------------------------------------------------------------------------

const port = process.env.PORT;

app.listen(port, (err) => {
  if (err) console.log("ERROR", err);
  console.log(`App running on port ${port}`);
});
