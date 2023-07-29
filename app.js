const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
let app = express();
app.use(express.json());
async function start() {
  try {
    db = await open({
      filename: __dirname + "/userData.db",
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("server running..."));
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}
start();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let userEnq = `select * from user where username="${username}";`;
  let dbUser = await db.get(userEnq);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const query = `insert into user (username,name,password,gender,location)
        values("${username}","${name}","${hashedPassword}","${gender}","${location}");`;
      await db.run(query);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let userEnq = `select * from user where username="${username}";`;
  let dbUser = await db.get(userEnq);
  if (dbUser !== undefined) {
    let checker = await bcrypt.compare(password, dbUser.password);
    if (checker === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let userEnq = `select * from user where username="${username}";`;
  let dbUser = await db.get(userEnq);
  let checker = await bcrypt.compare(oldPassword, dbUser.password);
  if (checker === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `update user set password="${hashedPassword}" 
    where username="${username}";`;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
