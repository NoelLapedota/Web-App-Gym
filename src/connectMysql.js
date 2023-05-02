require("dotenv").config();
const mysql = require("mysql2/promise");

async function db() {
  try {
    if (process.env.NODE_ENV === "dev") {
      //docker
      return await mysql.createConnection({
        host: process.env.LOCALHOST_DOCKER,
        user: process.env.ROOT,
        password: process.env.PASSWORD_DOCKER,
        port: process.env.PORT_DB,
      });
    } else {
      //xamp and test
      return await mysql.createConnection({
        host: process.env.LOCALHOST,
        user: process.env.ROOT,
        password: process.env.PASSWORD,
        port: process.env.PORT_DB,
      });
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to connect to the database");
  }
}
module.exports = db;
