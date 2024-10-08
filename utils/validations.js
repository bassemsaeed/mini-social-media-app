import { body } from "express-validator";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    "postgresql://posts_owner:5Ikhj0NlMYdv@ep-young-poetry-a58vec1e.us-east-2.aws.neon.tech/posts?sslmode=require",
});

const signUpValidation = [
  body("first_name")
    .trim()
    .isAlpha()
    .withMessage("first name must only contain letters")
    .isLength({ min: 3, max: 15 })
    .withMessage("first name must be between 3 and 10 chars"),
  body("last_name")
    .trim()
    .isAlpha()
    .withMessage("first name must only contain letters")
    .isLength({ min: 3, max: 15 })
    .withMessage("first name must be between 3 and 10 chars"),
  body("user_name")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("user name must be between 3 and 30 chars")
    .custom(async (value) => {
      const { rows } = await pool.query(
        `select * from users where username = LOWER($1)`,
        [value]
      );
      const user = rows[0];

      if (user) {
        throw new Error("This Username Exists. Try a new one.");
      }
    }),
  body("user_password")
    .trim()
    .isLength({ min: 8 }) // Enforce a minimum length (adjust as needed)
    .withMessage("password must be at least 8 chars long"),

  body("confirmed_user_password").custom((value, { req }) => {
    const password = req.body.user_password;

    if (value !== password) {
      throw new Error("Passwords must match.");
    } else {
      return true;
    }
  }),
];

const pfp_validation = [
  body("pfp_link")
    .trim()
    .matches(/^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i) // Case-insensitive regex
    .withMessage(
      "Please provide a valid image link ending with .png, .jpg, .jpeg, .gif, or .webp"
    ),
];


const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ message: "Not Authorized." });
  }
};

export { signUpValidation, pfp_validation, isAuth };
