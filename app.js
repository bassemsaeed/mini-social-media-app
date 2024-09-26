import express from "express";
import session from "express-session";
import passport from "passport";
import pg from "pg";
import flash from "connect-flash";
import { Server as SocketIOServer } from "socket.io";
import http from "http";

import bcrypt from "bcrypt";
import { Strategy as LocalStrategy } from "passport-local";
import { validationResult } from "express-validator";
import connectPgSimple from "connect-pg-simple";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

import {
  signUpValidation,
  pfp_validation,
  isAuth,
} from "./utils/validations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const assetsPath = path.join(__dirname, "public");

const app = express();
const PORT = process.env.PORT || 3000;

const { Pool } = pg;
const pool = new Pool({
  connectionString:
    "postgresql://posts_owner:5Ikhj0NlMYdv@ep-young-poetry-a58vec1e.us-east-2.aws.neon.tech/posts?sslmode=require",
});

const server = http.createServer(app);
const io = new SocketIOServer(server);

const pgSession = connectPgSimple(session);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(assetsPath));

app.use(
  session({
    secret: "tkalfemfsdf1323#@#lsdf",
    resave: false,
    saveUninitialized: true,
    store: new pgSession({
      pool: pool,
      tableName: "users_sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 4,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.use(flash());

app.use(express.json());

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM users WHERE username = LOWER($1);`,
        [username]
      );

      const user = rows[0];

      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return done(null, false, { message: "Incorrect username or password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    const user = rows[0];

    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.get("/", async (req, res) => {
  const isAuth = req.isAuthenticated();

  const { rows } = await pool.query(
    `SELECT *, posts.id as identifier FROM posts INNER JOIN users ON posts.user_id = users.id;`
  );
  const posts = rows.reverse();

  if (req.user) {
    const {
      id,
      first_name,
      last_name,
      member_status: status,
      profile_pic,
    } = req.user;
    const userData = { first_name, last_name, status, profile_pic, id };
    res.render("home-page", { isAuth, userData, posts });
  } else {
    res.render("home-page", { posts });
  }
});

app.get(
  "/edit-prof-pic",
  (req, res, next) => {
    req.isAuthenticated() ? next() : res.status(401).send("Not Authorized.");
  },
  (req, res) => {
    res.render("edit-prof-pic");
  }
);

app.post(
  "/edit-prof-pic",
  (req, res, next) => {
    req.isAuthenticated()
      ? next()
      : res.status(401).json({ msg: "Not Authorized." });
  },
  pfp_validation,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errs = errors.array();
      return res.render("edit-prof-pic", { errs });
    }
    const { pfp_link } = req.body;
    const { id } = req.user;

    await pool.query(
      `
    UPDATE users
    SET profile_pic = $1
    WHERE id = $2
    `,
      [pfp_link, id]
    );

    res.redirect("/");
  }
);

app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

app.post(
  "/post",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Not Authorized." });
    }
  },
  async (req, res) => {
    const { id } = req.user;
    const { post_content } = req.body;

    try {
      await pool.query(`INSERT INTO posts (content, user_id) VALUES ($1, $2)`, [
        post_content,
        id,
      ]);

      res.status(200).json({ message: "Successful Post" });
    } catch (error) {
      console.error("Database Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.post("/sign-up", signUpValidation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render("sign-up", { errs: errors.array(), inputs: req.body });
  }

  const {
    first_name: firstName,
    last_name: lastName,
    user_name: username,
    user_password,
  } = req.body;

  const password = await bcrypt.hash(user_password, 10);
  try {
    await pool.query(
      `
                INSERT INTO users (username, first_name, last_name, password) VALUES (LOWER($1), $2, $3, $4);
            `,
      [username, firstName, lastName, password]
    );

    res.redirect("/log-in");
  } catch (error) {
    console.log(error);
    res.render("sign-up", {
      serverErr: { msg: "An unexpected error occurred, please try again." },
      inputs: req.body,
    });
  }
});

app.get("/log-in", (req, res) => {
  const authErrors = req.flash("error");

  res.render("log-in", { authErrors });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/log-in",
    failureFlash: true,
  })
);

app.post("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.sendStatus(200);
  });
});

app.delete("/post", isAuth, async (req, res) => {
  const { post_id } = req.body;

  await pool.query(`DELETE FROM posts WHERE id = $1`, [post_id]);

  res.status(200).json({ message: "Deleted successfully" });
});

app.get("/join", isAuth, (req, res) => {
  res.render("join");
});

app.get("/admin", isAuth, (req, res) => {
  res.render("admin");
});

app.post("/admin", isAuth, async (req, res) => {
  const { admin_pass } = req.body;
  const user = req.user;
  if (admin_pass !== "1234") {
    res.render("admin", { err: "Incorrect password" });
    return;
  }

  await pool.query(`UPDATE users SET member_status = 'admin' WHERE id = $1`, [
    user.id,
  ]);

  res.redirect("/");
});

app.post("/join", isAuth, async (req, res) => {
  const { join_pass } = req.body;
  const user = req.user;
  if (join_pass !== "1234") {
    res.render("join", { err: "Incorrect password" });
    return;
  }

  await pool.query(`UPDATE users SET member_status = 'member' WHERE id = $1`, [
    user.id,
  ]);

  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on - http://localhost:${PORT}`);
});
