import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world travel",
  password: "Anurag4619",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


let users = [];

async function nextUser() {
  const result = await db.query("SELECT id FROM users ORDER BY id ASC");
  return result.rows[0].id;
}
let currentUserId = await nextUser();

async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM vis_countries JOIN users ON users.id = user_id WHERE user_id = $1;",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await getCurrentUser();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getCurrentUser();
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO vis_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error: "Country has already been added!",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser.color,
      error: "Country name does not exist, Enter a valid country!",
    });
  }
});

app.post("/remove", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getCurrentUser();
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "DELETE FROM vis_countries WHERE country_code=$1 AND user_id=$2",
        [countryCode, currentUserId]
      );
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error: "The country has been deleted!",
      });
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser.color,
      error: "Country name does not exist, Enter a valid country!",
    });
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  try {
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
      [name, color]
    );
    currentUserId =  result.rows[0].id;
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.render("new.ejs", {
      error: "User already present, try a different name!",
    });
  }
});

app.post("/removeUser", async (req, res) => {
  const currentUser = await getCurrentUser();
  try {
    await db.query(
      "DELETE FROM vis_countries WHERE user_id=$1;",
      [currentUser.id]
    );
    await db.query(
      "DELETE FROM users WHERE id=$1;",
      [currentUser.id]
    );
  } catch (error) {
    console.log(error);
  }
  currentUserId = await nextUser();    
  res.redirect("/");
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});